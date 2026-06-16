"use client";

import { useEffect, useState } from "react";
import { Loader2, CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { listEvents, type AdminEvent } from "@/lib/api/events";
import { ApiError } from "@/lib/api/client";
import { HandlerEventCard, STATUS_META } from "./event-card";

/** Active-first: Public → Draft → Archived, then by start date (soonest first). */
function sortActiveFirst(a: AdminEvent, b: AdminEvent) {
  const ra = STATUS_META[a.status].rank;
  const rb = STATUS_META[b.status].rank;
  if (ra !== rb) return ra - rb;
  const ta = a.startsAt ? Date.parse(a.startsAt) : Infinity;
  const tb = b.startsAt ? Date.parse(b.startsAt) : Infinity;
  return ta - tb;
}

/**
 * Read-only events list for handlers. `GET /events` is backend-scoped to the
 * handler's `event_assignment` rows, so this shows exactly the events they're
 * involved in — every status, badged, active-first. Tapping a card opens the
 * read-only event detail (`/events/[id]`).
 */
export function HandlerEvents() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    listEvents()
      .then((ev) => { if (!cancelled) setEvents([...(ev ?? [])].sort(sortActiveFirst)); })
      .catch((e) => { if (!cancelled) setLoadError(e instanceof ApiError ? e.message : "Failed to load events."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex flex-col gap-6 view-anim">
      <PageHeader title="My Events" sub="Events you're assigned to" />

      {loading ? (
        <div className="py-24 flex items-center justify-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
          <Loader2 size={18} className="animate-spin" /> Loading events…
        </div>
      ) : loadError ? (
        <div className="py-24 text-center text-sm" style={{ color: "var(--danger)" }}>{loadError}</div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No assigned events"
          description="You haven't been assigned to any events yet. Once a manager adds you, they'll show up here."
        />
      ) : (
        <div className="flex flex-wrap gap-5">
          {events.map((ev) => (
            <HandlerEventCard key={ev.id} event={ev} href={`/events/${ev.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
