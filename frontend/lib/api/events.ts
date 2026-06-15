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
