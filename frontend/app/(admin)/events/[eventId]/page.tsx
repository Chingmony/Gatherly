import Link from "next/link";
import { serverFetch } from "@/lib/api/server";
import { ApiError } from "@/lib/api/client";
import type { AgendaResponse, AgendaTemplateResponse, EventResponse } from "@/lib/api/types";
import { EventWorkspace } from "./event-workspace";

/**
 * Event detail / workspace (docs/03 §4.4, docs/05 §7). Server Component: parallel fetches of the
 * event, its agenda, and global agenda templates (cookies forwarded, never cached). A 403/404
 * renders an explicit state rather than crashing (docs/07 §6).
 */
export default async function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;

  let event: EventResponse | null = null;
  let agenda: AgendaResponse | null = null;
  let templates: AgendaTemplateResponse[] = [];
  let denied = false;
  let missing = false;

  try {
    [event, agenda, templates] = await Promise.all([
      serverFetch<EventResponse>(`/events/${eventId}`),
      serverFetch<AgendaResponse>(`/events/${eventId}/agenda`),
      serverFetch<AgendaTemplateResponse[]>(`/agenda-templates`),
    ]);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 403 || e.status === 401)) denied = true;
    else if (e instanceof ApiError && e.status === 404) missing = true;
    else throw e;
  }

  if (denied || missing || !event || !agenda) {
    return (
      <div className="mx-auto max-w-md space-y-3 rounded-[var(--r)] border border-[var(--bo)] bg-[var(--ca)] p-6 shadow-[var(--sh)]">
        <h1 className="text-[15px] font-bold text-[var(--t1)]">
          {missing ? "Event not found" : "Not authorized"}
        </h1>
        <p className="text-[13px] text-[var(--t2)]">
          {missing
            ? "This event doesn’t exist or has been deleted."
            : "You don’t have access to manage this event."}
        </p>
        <Link href="/events" className="inline-block text-[13px] font-semibold text-[var(--ac)]">
          ← Back to events
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/events" className="inline-block text-[12px] font-semibold text-[var(--t3)] hover:text-[var(--t1)]">
        ← Events
      </Link>
      <EventWorkspace event={event} agenda={agenda} templates={templates} />
    </div>
  );
}
