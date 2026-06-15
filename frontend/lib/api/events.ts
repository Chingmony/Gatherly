/**
 * Public (guest) event discovery — wraps the unauthenticated `GET /api/v1/public/events*`
 * endpoints (see backend `PublicController`). Only PUBLIC events are ever returned.
 */
import { apiFetch } from "./client";

/** Mirrors backend `PublicEventResponse`. */
export interface PublicEvent {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  description: string | null;
  venue: string | null;
  coverColor: string | null;
  coverImageUrl: string | null;
  startsAt: string | null;
  endsAt: string | null;
  capacity: number | null;
  registeredCount: number;
}

export interface ListPublicEventsParams {
  search?: string;
  category?: string;
  location?: string;
  page?: number;
  size?: number;
  signal?: AbortSignal;
}

/**
 * Browse PUBLIC events. Server supports `search` (title), `category` (exact), and `location`
 * (venue substring) filters; the explore page fetches a single page and filters in-memory so the
 * category/location option lists stay populated.
 */
export async function listPublicEvents(params: ListPublicEventsParams = {}): Promise<PublicEvent[]> {
  const { search, category, location, page, size = 100, signal } = params;
  const qs = new URLSearchParams();
  if (search) qs.set("search", search);
  if (category) qs.set("category", category);
  if (location) qs.set("location", location);
  if (page != null) qs.set("page", String(page));
  qs.set("size", String(size));
  const query = qs.toString();
  return apiFetch<PublicEvent[]>(`/public/events${query ? `?${query}` : ""}`, { signal });
}

/** Public details of a single PUBLIC event by slug (404 if unknown / not public). */
export async function getPublicEvent(slug: string, signal?: AbortSignal): Promise<PublicEvent> {
  return apiFetch<PublicEvent>(`/public/events/${encodeURIComponent(slug)}`, { signal });
}

/** Dynamic-form field type — mirrors backend `FormFieldType` (serialized lowercase). */
export type FormFieldType =
  | "text"
  | "email"
  | "phone"
  | "number"
  | "date"
  | "select"
  | "multiselect"
  | "checkbox"
  | "textarea";

/** One field of the registration form schema — mirrors backend `FormField`. */
export interface PublicFormField {
  key: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  order: number;
  options?: string[] | null;
  validation?: { min?: number; max?: number; pattern?: string } | null;
}

/** Mirrors backend `PublicFormResponse` — the active registration form for a public event. */
export interface PublicForm {
  eventId: string;
  slug: string;
  eventTitle: string;
  formTitle: string;
  fields: PublicFormField[];
}

/** Mirrors backend `RegistrationResponse`. */
export interface RegistrationResult {
  submissionId: string;
  ticketStatus: string;
  ticketUrl: string;
  message: string;
}

/**
 * Fetch a public event's active registration form (the guest renderer schema). Throws an
 * {@link ApiError} with code `NO_ACTIVE_FORM` (409) if the event has no active form yet.
 */
export async function getPublicEventForm(slug: string, signal?: AbortSignal): Promise<PublicForm> {
  return apiFetch<PublicForm>(`/public/events/${encodeURIComponent(slug)}/form`, { signal });
}

/**
 * Submit a guest registration. `answers` is keyed by field `key`; the server validates against the
 * active form schema (email + phone always required) and emails a QR ticket on success.
 */
export async function registerForEvent(
  eventId: string,
  answers: Record<string, unknown>,
  signal?: AbortSignal
): Promise<RegistrationResult> {
  return apiFetch<RegistrationResult>(`/public/events/${encodeURIComponent(eventId)}/register`, {
    method: "POST",
    body: { answers },
    signal,
  });
}

/** Mirrors backend `TicketResponse` — a guest's QR ticket with the rendered on-screen QR image. */
export interface PublicTicket {
  checkinToken: string;
  ticketStatus: string;
  guestName: string | null;
  eventTitle: string | null;
  venue: string | null;
  startsAt: string | null;
  /** Base64 `data:image/png` URL of the real check-in QR — the on-screen fallback to the email. */
  qrImageDataUrl: string;
}

/** Fetch a guest's ticket (real QR) by its check-in token. 404 if the token is unknown. */
export async function getTicket(checkinToken: string, signal?: AbortSignal): Promise<PublicTicket> {
  return apiFetch<PublicTicket>(`/public/tickets/${encodeURIComponent(checkinToken)}`, { signal });
}

/** Re-send the QR-ticket email. 409 `TICKET_INVALID` if the ticket is checked-in or revoked. */
export async function resendTicket(checkinToken: string): Promise<RegistrationResult> {
  return apiFetch<RegistrationResult>(
    `/public/tickets/${encodeURIComponent(checkinToken)}/resend`,
    { method: "POST" }
  );
}

/** Pull the check-in token out of a ticket URL (`…/tickets/{token}`). */
export function tokenFromTicketUrl(ticketUrl: string): string | null {
  try {
    const path = ticketUrl.startsWith("http") ? new URL(ticketUrl).pathname : ticketUrl;
    const seg = path.split("/").filter(Boolean).pop();
    return seg ?? null;
  } catch {
    return null;
  }
}

/* ─────────────────────── Authenticated event management ───────────────────────
 * Wraps the role-scoped `/events` endpoints (backend `EventController`). Auth is carried by the
 * httpOnly cookies `apiFetch` replays — ADMIN sees all events, others only events they're assigned
 * to. Create/publish/archive/delete/QR-rotate are ADMIN-only (the API returns 403 otherwise).
 */

/** Event lifecycle — mirrors backend `EventStatus` (serialized as the enum name). */
export type EventStatus = "DRAFT" | "PUBLIC" | "ARCHIVED";

/** Whitelisted sort keys for `GET /events` — mirrors backend `EventSort`. */
export type EventSortKey = "DATE" | "NAME" | "STATUS" | "CREATED_AT";

/** Full event projection — mirrors backend `EventResponse`. */
export interface AdminEvent {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  capacity: number | null;
  description: string | null;
  venue: string | null;
  coverColor: string | null;
  coverImageUrl: string | null;
  startsAt: string | null;
  endsAt: string | null;
  status: EventStatus;
  registeredCount: number;
  registrationQrToken: string | null;
  checkinOpensAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListEventsParams {
  search?: string;
  page?: number;
  size?: number;
  sort?: EventSortKey;
  direction?: "ASC" | "DESC";
  signal?: AbortSignal;
}

/** Role-scoped list of events the caller can see. Returns a single page (default size 100). */
export async function listEvents(params: ListEventsParams = {}): Promise<AdminEvent[]> {
  const { search, page, size = 100, sort, direction, signal } = params;
  const qs = new URLSearchParams();
  if (search) qs.set("search", search);
  if (page != null) qs.set("page", String(page));
  qs.set("size", String(size));
  if (sort) qs.set("sort", sort);
  if (direction) qs.set("direction", direction);
  const query = qs.toString();
  return apiFetch<AdminEvent[]>(`/events${query ? `?${query}` : ""}`, { signal });
}

/** Fields accepted when creating an event — mirrors backend `EventCreateRequest`. */
export interface EventCreateInput {
  title: string;
  category?: string | null;
  capacity?: number | null;
  description?: string | null;
  venue?: string | null;
  coverColor?: string | null;
  coverImageUrl?: string | null;
  /** ISO-8601 instant (e.g. `2026-07-15T09:00:00Z`), or null for TBA. */
  startsAt?: string | null;
  endsAt?: string | null;
  checkinOpensAt?: string | null;
}

/** Partial update — mirrors backend `EventUpdateRequest`; omitted/null fields are left unchanged. */
export type EventUpdateInput = Partial<EventCreateInput>;

/** Create a new DRAFT event (ADMIN only). Throws `ApiError` (403/400) on failure. */
export async function createEvent(
  input: EventCreateInput,
  signal?: AbortSignal
): Promise<AdminEvent> {
  return apiFetch<AdminEvent>("/events", { method: "POST", body: input, signal });
}

/** Fetch a single event by id (ADMIN or an assigned MANAGER/HANDLER). */
export async function getEvent(id: string, signal?: AbortSignal): Promise<AdminEvent> {
  return apiFetch<AdminEvent>(`/events/${encodeURIComponent(id)}`, { signal });
}

/** Partial update of event details (ADMIN or the event's MANAGER). */
export async function updateEvent(
  id: string,
  input: EventUpdateInput,
  signal?: AbortSignal
): Promise<AdminEvent> {
  return apiFetch<AdminEvent>(`/events/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: input,
    signal,
  });
}

/** Transition DRAFT → PUBLIC (ADMIN only). Throws `ApiError` 409 if not in DRAFT. */
export async function publishEvent(id: string, signal?: AbortSignal): Promise<AdminEvent> {
  return apiFetch<AdminEvent>(`/events/${encodeURIComponent(id)}/publish`, {
    method: "POST",
    signal,
  });
}

/** Transition PUBLIC → ARCHIVED (ADMIN only). Throws `ApiError` 409 if not in PUBLIC. */
export async function archiveEvent(id: string, signal?: AbortSignal): Promise<AdminEvent> {
  return apiFetch<AdminEvent>(`/events/${encodeURIComponent(id)}/archive`, {
    method: "POST",
    signal,
  });
}

/** Permanently delete an event and its children (ADMIN only). */
export async function deleteEvent(id: string, signal?: AbortSignal): Promise<void> {
  return apiFetch<void>(`/events/${encodeURIComponent(id)}`, { method: "DELETE", signal });
}
