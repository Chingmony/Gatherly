"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiFetch } from "@/lib/api";
import type { ApiResponse, EventResponse, MaterialResponse, MaterialStatus, UserResponse } from "@/lib/types";

type UIStatus = "IN_PROGRESS" | "NEEDS_REVIEW" | "PENDING" | "ISSUE" | "DONE";

const STATUS_ORDER: UIStatus[] = ["IN_PROGRESS", "NEEDS_REVIEW", "PENDING", "ISSUE", "DONE"];

const STATUS_VARIANT: Record<UIStatus, "blue" | "orange" | "gray" | "green"> = {
  IN_PROGRESS:  "blue",
  NEEDS_REVIEW: "orange",
  PENDING:      "gray",
  ISSUE:        "orange",
  DONE:         "green",
};

const STATUS_LABEL: Record<UIStatus, string> = {
  IN_PROGRESS:  "In progress",
  NEEDS_REVIEW: "Needs review",
  PENDING:      "To do",
  ISSUE:        "Issue",
  DONE:         "Done",
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

  useEffect(() => {
    async function load() {
      try {
        const [meRes, eventsRes] = await Promise.all([
          apiFetch<ApiResponse<UserResponse>>("/me"),
          apiFetch<ApiResponse<EventResponse[]>>("/events?size=100"),
        ]);

        const evs = eventsRes.data ?? [];

        const materialResults = await Promise.all(
          evs.map((e) =>
            apiFetch<ApiResponse<MaterialResponse[]>>(`/events/${e.id}/materials?size=100`)
          )
        );

        setMe(meRes.data);
        setEvents(evs);
        setMaterials(materialResults.flatMap((r) => r.data ?? []));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tasks");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

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

      {/* Event filter chips — h-11 for 44px touch target */}
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
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 px-4 py-4 rounded-[var(--radius-lg)] border min-h-[56px] transition-colors hover:bg-[var(--surface-2)] active:opacity-80 w-full overflow-hidden"
                    style={{ background: "var(--surface)", borderColor: "var(--border-hex,#ecedf4)" }}
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
    </div>
  );
}
