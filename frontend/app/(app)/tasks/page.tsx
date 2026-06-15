"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { apiFetch, ApiError } from "@/lib/api/client";
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
  const [me, setMe]               = useState<UserResponse | null>(null);
  const [events, setEvents]       = useState<EventResponse[]>([]);
  const [materials, setMaterials] = useState<MaterialResponse[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<string>("all");

  // Dialog state
  const [selected, setSelected]     = useState<MaterialResponse | null>(null);
  const [nextStatus, setNextStatus] = useState<MaterialStatus | null>(null);
  const [note, setNote]             = useState("");
  const [updating, setUpdating]     = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

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
    setUpdateError(null);
  }, []);

  const closeDialog = useCallback(() => {
    if (updating) return;
    setSelected(null);
  }, [updating]);

  const handleUpdate = useCallback(async () => {
    if (!selected || !nextStatus) return;
    setUpdating(true);
    setUpdateError(null);
    try {
      await apiFetch(`/materials/${selected.id}/status`, {
        method: "PATCH",
        body: { toStatus: nextStatus, ...(note.trim() ? { note: note.trim() } : {}) },
      });
      // Optimistic update in local state
      setMaterials((prev) =>
        prev.map((m) => m.id === selected.id ? { ...m, status: nextStatus } : m)
      );
      setSelected(null);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to update status";
      setUpdateError(msg);
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
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
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
        return (
          <div key={status} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <StatusBadge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</StatusBadge>
              <span className="text-sm font-bold" style={{ color: "var(--text-faint)" }}>{group.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {group.map((m) => {
                const event = eventMap.get(m.eventId);
                const isDone = m.status === "DONE";
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => !isDone && openDialog(m)}
                    disabled={isDone}
                    className="flex items-center gap-3 px-4 py-4 rounded-[var(--radius-lg)] border min-h-[56px] transition-colors hover:bg-[var(--surface-2)] active:opacity-80 w-full overflow-hidden text-left"
                    style={{
                      background: "var(--surface)",
                      borderColor: "var(--border-hex,#ecedf4)",
                      cursor: isDone ? "default" : "pointer",
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-base leading-snug" style={{ color: "var(--text-strong)" }}>{m.name}</span>
                    </div>
                    <span
                      className="text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0 max-w-[100px] truncate"
                      style={{ background: "var(--primary-soft)", color: "var(--primary-hex,#6366f1)" }}
                    >
                      {event?.title ?? "—"}
                    </span>
                    <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                      {formatDate(event?.startsAt)}
                    </span>
                    {!isDone && (
                      <span className="text-xs font-semibold flex-shrink-0" style={{ color: "var(--primary-hex,#6366f1)" }}>
                        Update →
                      </span>
                    )}
                  </button>
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
          <DialogContent className="max-w-sm mx-4">
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
                    {NEXT_STATUSES[selected.status].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setNextStatus(s)}
                        className="px-3 py-2 rounded-[var(--radius-md)] border text-sm font-bold transition-all"
                        style={{
                          background:  nextStatus === s ? "var(--primary-hex,#6366f1)" : "var(--surface-2)",
                          borderColor: nextStatus === s ? "var(--primary-hex,#6366f1)" : "var(--border-hex,#ecedf4)",
                          color:       nextStatus === s ? "#fff" : "var(--text-strong)",
                        }}
                      >
                        {STATUS_LABEL[s]}
                      </button>
                    ))}
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

                {updateError && (
                  <p className="text-sm" style={{ color: "var(--danger)" }}>{updateError}</p>
                )}
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
