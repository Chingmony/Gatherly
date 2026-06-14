import Link from "next/link";
import { serverFetch } from "@/lib/api/server";
import { ApiError } from "@/lib/api/client";
import type {
  AgendaResponse, AgendaTemplateResponse, AssignmentResponse, EventResponse,
  FormResponse, PageResponse, SubmissionResponse, UserResponse,
} from "@/lib/api/types";
import { EventWorkspace } from "./event-workspace";

/**
 * Event detail / workspace (docs/03 §4.4–§4.8, docs/05 §7). Server Component: parallel fetches of
 * the event + every tab's data (cookies forwarded, never cached). 403/404 render explicit states.
 * `isAdmin` is inferred from whether the admin-only user directory loads (for the member picker).
 */
export default async function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;

  let event: EventResponse | null = null;
  let agenda: AgendaResponse | null = null;
  let templates: AgendaTemplateResponse[] = [];
  let assignments: AssignmentResponse[] = [];
  let denied = false;
  let missing = false;

  try {
    [event, agenda, templates, assignments] = await Promise.all([
      serverFetch<EventResponse>(`/events/${eventId}`),
      serverFetch<AgendaResponse>(`/events/${eventId}/agenda`),
      serverFetch<AgendaTemplateResponse[]>(`/agenda-templates`),
      serverFetch<AssignmentResponse[]>(`/events/${eventId}/assignments`),
    ]);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 403 || e.status === 401)) denied = true;
    else if (e instanceof ApiError && e.status === 404) missing = true;
    else throw e;
  }

  // Optional/role-dependent fetches — degrade gracefully.
  let form: FormResponse | null = null;
  let submissions: SubmissionResponse[] = [];
  let candidates: UserResponse[] = [];
  let isAdmin = false;
  if (event) {
    form = await serverFetch<FormResponse>(`/events/${eventId}/form`).catch(() => null);
    submissions = (await serverFetch<PageResponse<SubmissionResponse>>(`/events/${eventId}/submissions?size=100`)
      .catch(() => null))?.content ?? [];
    const users = await serverFetch<PageResponse<UserResponse>>(`/users?size=100`).catch(() => null);
    if (users) { candidates = users.content; isAdmin = true; }
  }

  if (denied || missing || !event || !agenda) {
    return (
      <div className="mx-auto max-w-md space-y-3 rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
        <h1 className="text-[15px] font-bold text-[var(--text-strong)]">{missing ? "Event not found" : "Not authorized"}</h1>
        <p className="text-[13px] text-[var(--text-muted)]">
          {missing ? "This event doesn’t exist or has been deleted." : "You don’t have access to manage this event."}
        </p>
        <Link href="/events" className="inline-block text-[13px] font-bold text-[var(--primary)]">← Back to events</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/events" className="inline-block text-[12px] font-semibold text-[var(--text-faint)] hover:text-[var(--text)]">← Events</Link>
      <EventWorkspace
        event={event} agenda={agenda} templates={templates} assignments={assignments}
        submissions={submissions} candidates={candidates} form={form} isAdmin={isAdmin}
      />
    </div>
  );
}
