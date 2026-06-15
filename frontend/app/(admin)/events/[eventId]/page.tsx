import Link from "next/link";
import { serverFetch } from "@/lib/api/server";
import { ApiError } from "@/lib/api/client";
import type {
  AgendaResponse, AgendaTemplateResponse, AssignmentResponse, AttendanceResponse, CandidateResponse,
  EventResponse, FormResponse, MaterialResponse, PageResponse, SubmissionResponse, UserResponse,
} from "@/lib/api/types";
import { EventWorkspace } from "./event-workspace";

/**
 * Event detail / workspace (docs/03 §4.4–§4.8, docs/05 §7). Server Component: parallel fetches of
 * the event + every tab's data (cookies forwarded, never cached). 403/404 render explicit states.
 * `isAdmin` comes straight from the caller's global role (`/me`); the member-picker candidates load
 * from the `canManage`-gated `/assignments/candidates` so Sub-admins can delegate Handlers too.
 */
export default async function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;

  let event: EventResponse | null = null;
  let agenda: AgendaResponse | null = null;
  let templates: AgendaTemplateResponse[] = [];
  let assignments: AssignmentResponse[] = [];
  let materials: MaterialResponse[] = [];
  let denied = false;
  let missing = false;

  try {
    [event, agenda, templates, assignments, materials] = await Promise.all([
      serverFetch<EventResponse>(`/events/${eventId}`),
      serverFetch<AgendaResponse>(`/events/${eventId}/agenda`),
      serverFetch<AgendaTemplateResponse[]>(`/agenda-templates`),
      serverFetch<AssignmentResponse[]>(`/events/${eventId}/assignments`),
      serverFetch<MaterialResponse[]>(`/events/${eventId}/materials`),
    ]);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 403 || e.status === 401)) denied = true;
    else if (e instanceof ApiError && e.status === 404) missing = true;
    else throw e;
  }

  // Optional/role-dependent fetches — degrade gracefully.
  let form: FormResponse | null = null;
  let submissions: SubmissionResponse[] = [];
  let attendance: AttendanceResponse = { registeredCount: 0, checkedInCount: 0, records: [] };
  let candidates: CandidateResponse[] = [];
  if (event) {
    form = await serverFetch<FormResponse>(`/events/${eventId}/form`).catch(() => null);
    submissions = (await serverFetch<PageResponse<SubmissionResponse>>(`/events/${eventId}/submissions?size=100`)
      .catch(() => null))?.content ?? [];
    attendance = (await serverFetch<AttendanceResponse>(`/events/${eventId}/attendance`).catch(() => null))
      ?? attendance;
    // Member picker: gated by canManage, so both Admins and event MANAGERs get a candidate list.
    candidates = (await serverFetch<CandidateResponse[]>(`/events/${eventId}/assignments/candidates`)
      .catch(() => null)) ?? [];
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

  // isAdmin from the caller's global role; canManage = Admin or the event's MANAGER (Sub-admin).
  const me = await serverFetch<UserResponse>("/me").catch(() => null);
  const isAdmin = me?.globalRole === "ADMIN";
  const canManage = isAdmin || assignments.some((a) => a.userId === me?.id && a.eventRole === "MANAGER");

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/events" className="inline-block text-[12px] font-semibold text-[var(--text-faint)] hover:text-[var(--text)]">← Events</Link>
      <EventWorkspace
        event={event} agenda={agenda} templates={templates} assignments={assignments}
        materials={materials} submissions={submissions} attendance={attendance} candidates={candidates} form={form}
        isAdmin={isAdmin} canManage={canManage}
      />
    </div>
  );
}
