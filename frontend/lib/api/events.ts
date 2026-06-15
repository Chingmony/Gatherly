/**
 * Events surface — wraps `/api/v1/events` (see backend `EventController`). ADMIN sees all events;
 * others see only events they're assigned to. The list/create/update payloads carry the card
 * fields (category, capacity, cover) plus computed counts.
 */
import { apiFetch } from "./client";

export type EventStatus = "DRAFT" | "PUBLIC" | "ARCHIVED" | "ENDED";
export type EventCategory =
  | "CONFERENCE"
  | "FESTIVAL"
  | "NETWORKING"
  | "WORKSHOP"
  | "GALA"
  | "HACKATHON"
  | "OTHER";

/** Mirrors backend `EventResponse`. */
export interface EventResponse {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  venue: string | null;
  startsAt: string | null;
  endsAt: string | null;
  status: EventStatus;
  category: EventCategory | null;
  capacity: number | null;
  coverKey: string | null;
  coverUrl: string | null;
  registeredCount: number;
  managerCount: number;
  handlerCount: number;
  registrationQrToken: string | null;
  checkinOpensAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventWriteBody {
  title?: string;
  description?: string | null;
  venue?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  checkinOpensAt?: string | null;
  category?: EventCategory | null;
  capacity?: number | null;
  coverKey?: string | null;
}

/** Role-scoped list. Returns the page content (page metadata is dropped by apiFetch). */
export function listEvents(search?: string): Promise<EventResponse[]> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch<EventResponse[]>(`/events${qs}`);
}

export function getEvent(id: string): Promise<EventResponse> {
  return apiFetch<EventResponse>(`/events/${id}`);
}

/** Create an event (ADMIN). Starts in DRAFT; title is required. */
export function createEvent(body: EventWriteBody & { title: string }): Promise<EventResponse> {
  return apiFetch<EventResponse>("/events", { method: "POST", body });
}

/** Partial update (Manager/Admin). Null fields are left unchanged. */
export function updateEvent(id: string, body: EventWriteBody): Promise<EventResponse> {
  return apiFetch<EventResponse>(`/events/${id}`, { method: "PUT", body });
}

export function deleteEvent(id: string): Promise<void> {
  return apiFetch<void>(`/events/${id}`, { method: "DELETE" });
}

/** Publish a DRAFT event (ADMIN) → PUBLIC. */
export function publishEvent(id: string): Promise<EventResponse> {
  return apiFetch<EventResponse>(`/events/${id}/publish`, { method: "POST" });
}

export const EVENT_CATEGORIES: EventCategory[] = [
  "CONFERENCE", "FESTIVAL", "NETWORKING", "WORKSHOP", "GALA", "HACKATHON", "OTHER",
];
