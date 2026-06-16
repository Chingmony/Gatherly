"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { apiFetch, ApiError } from "@/lib/api/client";
import { toast } from "@/components/ui/toast";
import type { EventResponse, MaterialResponse, MaterialStatus, UserResponse } from "@/lib/types";

type UIStatus = "IN_PROGRESS" | "NEEDS_REVIEW" | "PENDING" | "ISSUE" | "DONE";

const STATUS_ORDER: UIStatus[] = ["IN_PROGRESS", "NEEDS_REVIEW", "PENDING", "ISSUE", "DONE"];

const STATUS_VARIANT: Record<UIStatus, "blue" | "orange" | "gray" | "green" | "danger"> = {
  IN_PROGRESS:  "blue",
  NEEDS_REVIEW: "orange",
  PENDING:      "gray",
  ISSUE:        "danger",
  DONE:         "green",
};

const STATUS_LABEL: Record<UIStatus, string> = {
  IN_PROGRESS:  "In progress",
  NEEDS_REVIEW: "Needs review",
  PENDING:      "To do",
  ISSUE:        "Issue",
  DONE:         "Done",
};

// Accent (stripe / header dot / event chip) per status. `color` is the solid hue,
// `soft` its tinted background.
const STATUS_COLORS: Record<UIStatus, { color: string; soft: string }> = {
  IN_PROGRESS:  { color: "var(--primary-hex,#6366f1)", soft: "var(--primary-soft)" },
  NEEDS_REVIEW: { color: "var(--orange)",              soft: "var(--orange-soft)" },
  PENDING:      { color: "var(--text-muted)",          soft: "var(--surface-3)" },
  ISSUE:        { color: "var(--danger)",              soft: "var(--danger-soft)" },
  DONE:         { color: "var(--green-600)",           soft: "var(--green-soft)" },
};

const NEXT_STATUSES: Record<MaterialStatus, MaterialStatus[]> = {
  PENDING:      ["IN_PROGRESS", "ISSUE"],
  IN_PROGRESS:  ["NEEDS_REVIEW", "ISSUE"],
  NEEDS_REVIEW: ["DONE", "IN_PROGRESS", "ISSUE"],
  ISSUE:        ["IN_PROGRESS"],
  DONE:         [],
};

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function HandlerTasksPage() {
  // useSearchParams needs a Suspense boundary in the App Router (Next 16) — without it the
  // page is forced into fully client-side rendering and the build complains.
  return (
    <Suspense fallback={null}>
      <HandlerTasksContent />
    </Suspense>
  );
}

function HandlerTasksContent() {
  const searchParams = useSearchParams();
  const [me, setMe]               = useState<UserResponse | null>(null);
  const [events, setEvents]       = useState<EventResponse[]>([]);
  const [materials, setMaterials] = useState<MaterialResponse[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  // Deep-link from the dashboard's "Your events" cards: /tasks?event=<id> preselects that event.
  const [eventFilter, setEventFilter] = useState<string>(() => searchParams.get("event") ?? "all");

  // Dialog state
  const [selected, setSelected]     = useState<MaterialResponse | null>(null);
  const [nextStatus, setNextStatus] = useState<MaterialStatus | null>(null);
  const [note, setNote]             = useState("");
  const [updating, setUpdating]     = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [meRes, eventsRes] = await Promise.all([
          apiFetch<UserResponse>("/me"),
          apiFetch<EventResponse[]>("/events?size=100"),
        ]);

        const evs = eventsRes ?? [];

        const materialResults = await Promise.all(
          evs.map((e) =>
            apiFetch<MaterialResponse[]>(`/events/${e.id}/materials?size=100`)
          )
        );

        setMe(meRes);
        setEvents(evs);
        setMaterials(materialResults.flatMap((r) => r ?? []));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const openDialog = useCallback((m: MaterialResponse) => {
    setSelected(m);
    setNextStatus(null);
    setNote("");
  }, []);

  const closeDialog = useCallback(() => {
    if (updating) return;
    setSelected(null);
  }, [updating]);

  const handleUpdate = useCallback(async () => {
    if (!selected || !nextStatus) return;
    setUpdating(true);
    try {
      await apiFetch(`/materials/${selected.id}/status`, {
        method: "PATCH",
        body: { toStatus: nextStatus, ...(note.trim() ? { note: note.trim() } : {}) },
      });
      // Optimistic update in local state
      setMaterials((prev) =>
        prev.map((m) => m.id === selected.id ? { ...m, status: nextStatus } : m)
      );
      toast.success("Task updated", `"${selected.name}" moved to ${STATUS_LABEL[nextStatus]}`);
      setSelected(null);
    } catch (err) {
      toast.error("Couldn't update task", err instanceof ApiError ? err.message : "Failed to update status");
    } finally {
      setUpdating(false);
    }
  }, [selected, nextStatus, note]);

  const eventMap = new Map(events.map((e) => [e.id, e]));
  const myMaterials = materials.filter((m) => m.assignedTo === me?.id);
  const filtered = eventFilter === "all"
    ? myMaterials
    : myMaterials.filter((m) => m.eventId === eventFilter);

  return (
    <div className="flex flex-col gap-5 view-anim">
      <PageHeader title="My Tasks" sub="All tasks across your assigned events" />

      {error && (
        <div className="rounded-[var(--radius-lg)] px-4 py-3 text-sm" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
          {error}
        </div>
      )}

      {/* Event filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {[{ id: "all", title: "All events" }, ...events].map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => setEventFilter(e.id)}
            className="h-11 px-4 rounded-full text-base font-bold border transition-all cursor-pointer"
            style={{
              background:  eventFilter === e.id ? "var(--primary-hex,#6366f1)" : "var(--surface)",
              borderColor: eventFilter === e.id ? "var(--primary-hex,#6366f1)" : "var(--border-hex,#ecedf4)",
              color:       eventFilter === e.id ? "#fff" : "var(--text-muted)",
            }}
          >
            {e.title}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 rounded-[var(--radius-lg)] animate-pulse"
              style={{ background: "var(--surface-2)" }}
            />
          ))}
        </div>
      )}

      {/* Tasks grouped by status */}
      {!loading && STATUS_ORDER.map((status) => {
        const group = filtered.filter((m) => (m.status as MaterialStatus) === status);
        if (group.length === 0) return null;
        const c = STATUS_COLORS[status];
        return (
          <div key={status} className="flex flex-col gap-2.5">
            {/* Group header — dot · STATUS · count pill */}
            <div className="flex items-center gap-2 px-1">
              <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
              <span className="text-xs font-extrabold uppercase tracking-wider" style={{ color: c.color }}>
                {STATUS_LABEL[status]}
              </span>
              <span
                className="ml-auto text-xs font-bold px-2.5 py-0.5 rounded-full"
                style={{ background: c.soft, color: c.color }}
              >
                {group.length}
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {group.map((m) => {
                const event = eventMap.get(m.eventId);
                const isDone = m.status === "DONE";
                return (
                  <div
                    key={m.id}
                    role={isDone ? undefined : "button"}
                    tabIndex={isDone ? undefined : 0}
                    onClick={() => { if (!isDone) openDialog(m); }}
                    onKeyDown={(e) => {
                      if (!isDone && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openDialog(m); }
                    }}
                    className="relative flex items-center gap-3 pl-5 pr-4 py-4 rounded-[var(--radius-lg)] border overflow-hidden transition-all hover:shadow-[var(--shadow-card)] active:scale-[.995] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-hex,#6366f1)]"
                    style={{
                      background: "var(--surface)",
                      borderColor: "var(--border-hex,#ecedf4)",
                      cursor: isDone ? "default" : "pointer",
                    }}
                  >
                    {/* Left status stripe */}
                    <span
                      className="absolute left-0 top-2.5 bottom-2.5 w-1.5 rounded-full"
                      style={{ background: c.color }}
                    />

                    {isDone && (
                      <CheckCircle2 size={20} className="flex-shrink-0" style={{ color: "var(--green-600)" }} />
                    )}

                    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                      <span
                        className="font-bold text-base leading-snug truncate"
                        style={{
                          color: isDone ? "var(--text-faint)" : "var(--text-strong)",
                          textDecoration: isDone ? "line-through" : "none",
                        }}
                      >
                        {m.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold max-w-[120px] truncate"
                          style={{ background: c.soft, color: c.color }}
                        >
                          {event?.title ?? "—"}
                        </span>
                        <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                          {formatDate(event?.startsAt)}
                        </span>
                      </div>
                    </div>

                    {!isDone && (
                      <span
                        className="inline-flex items-center gap-1 text-xs font-bold px-3.5 py-2 rounded-full text-white flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, var(--primary-hex,#6366f1), #7c5cf5)" }}
                      >
                        Update <ArrowUpRight size={13} strokeWidth={2.5} />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {!loading && filtered.length === 0 && (
        <Card>
          <CardContent className="px-5 py-12 text-center">
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>No tasks for this event.</span>
          </CardContent>
        </Card>
      )}

      {/* Status update dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        {selected && (
          <DialogContent className="w-[calc(100%-2rem)] max-w-sm">
            <DialogHeader>
              <DialogTitle>{selected.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Current status:</span>
                <StatusBadge variant={STATUS_VARIANT[selected.status as UIStatus]}>
                  {STATUS_LABEL[selected.status as UIStatus]}
                </StatusBadge>
              </div>
            </DialogHeader>

            {NEXT_STATUSES[selected.status].length > 0 ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    Move to
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {NEXT_STATUSES[selected.status].map((s) => {
                      const sc = STATUS_COLORS[s];
                      const isSel = nextStatus === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setNextStatus(s)}
                          className="px-3 py-2 rounded-[var(--radius-md)] border text-sm font-bold transition-all"
                          style={{
                            // Active → filled with the target status's colour; idle → that colour as
                            // text on a neutral chip, so each option reads (orange = review, red = issue…).
                            background:  isSel ? sc.color : "var(--surface-2)",
                            borderColor: isSel ? sc.color : "var(--border-hex,#ecedf4)",
                            color:       isSel ? "#fff" : sc.color,
                          }}
                        >
                          {STATUS_LABEL[s]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    Note (optional)
                  </span>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a note…"
                    className="w-full resize-none rounded-[var(--radius-md)] border px-3 py-2 text-sm outline-none transition-all focus:ring-2"
                    style={{
                      background: "var(--surface-2)",
                      borderColor: "var(--border-hex,#ecedf4)",
                      color: "var(--text-strong)",
                      // @ts-expect-error css var
                      "--tw-ring-color": "var(--primary-hex,#6366f1)",
                    }}
                  />
                </div>

              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                This task is complete — no further transitions available.
              </p>
            )}

            <DialogFooter>
              <Button variant="ghost" onClick={closeDialog} disabled={updating}>
                Cancel
              </Button>
              {NEXT_STATUSES[selected.status].length > 0 && (
                <Button
                  onClick={handleUpdate}
                  disabled={!nextStatus || updating}
                >
                  {updating ? "Updating…" : "Update status"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
