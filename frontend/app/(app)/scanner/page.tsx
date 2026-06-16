"use client";

import { useEffect, useState } from "react";
import { Loader2, QrCode } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { listEvents, type AdminEvent } from "@/lib/api/events";
import { ApiError } from "@/lib/api/client";
import { HandlerEventCard } from "../events/_components/event-card";

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth()    === now.getMonth()    &&
    d.getDate()     === now.getDate()
  );
}

/**
 * Should this event appear in the scanner picker right now? An event qualifies when its
 * check-in window covers the current moment, OR it simply starts today (so it's reachable
 * before check-in formally opens). The window is [checkinOpensAt ?? startsAt … endsAt],
 * with a null `endsAt` treated as "runs through the end of the start day" so a single-day
 * event without an explicit end still shows. This catches events that are happening now but
 * started on a previous calendar day — which a strict `isToday(startsAt)` check misses.
 */
function isScannableNow(e: AdminEvent, now: number): boolean {
  if (e.status === "ARCHIVED" || !e.startsAt) return false;
  if (isToday(e.startsAt)) return true;

  const opens = new Date(e.checkinOpensAt ?? e.startsAt).getTime();
  if (Number.isNaN(opens) || now < opens) return false;

  if (e.endsAt) {
    const ends = new Date(e.endsAt).getTime();
    return Number.isNaN(ends) || now <= ends;
  }
  // No explicit end: keep it visible until the end of its start calendar day.
  const endOfStartDay = new Date(e.startsAt);
  endOfStartDay.setHours(23, 59, 59, 999);
  return now <= endOfStartDay.getTime();
}

export default function ScannerPickerPage() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listEvents({ size: 100 })
      .then((data) => {
        if (cancelled) return;
        const now = Date.now();
        // Always list — even a single event. Entering /scanner never auto-routes;
        // the handler picks an event, and tapping a card navigates to its scanner.
        setEvents((data ?? []).filter((e) => isScannableNow(e, now)));
      })
      .catch((err) => { if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load events"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex flex-col gap-5 view-anim">
      <PageHeader title="Select Event" sub="Showing events you can check in to right now" />

      {loading ? (
        <div className="py-24 flex items-center justify-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
          <Loader2 size={18} className="animate-spin" /> Loading events…
        </div>
      ) : error ? (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
          {error}
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={QrCode}
          title="Nothing to check in"
          description="No events are open for check-in right now. They appear here while they're happening."
        />
      ) : (
        <div className="flex flex-wrap gap-5">
          {events.map((event) => (
            <HandlerEventCard key={event.id} event={event} href={`/events/${event.id}/scanner`} />
          ))}
        </div>
      )}
    </div>
  );
}
