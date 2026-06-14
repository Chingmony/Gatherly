import { apiFetch } from "./client";
import type { CreateEventBody, EventResponse, UpdateEventBody } from "./types";

/** Client-side event mutations (docs/03 §4.4). Reads are done server-side (see server.ts). */

export function createEvent(body: CreateEventBody): Promise<EventResponse> {
  return apiFetch<EventResponse>("/events", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateEvent(eventId: string, body: UpdateEventBody): Promise<EventResponse> {
  return apiFetch<EventResponse>(`/events/${eventId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function publishEvent(eventId: string): Promise<EventResponse> {
  return apiFetch<EventResponse>(`/events/${eventId}/publish`, { method: "POST" });
}

export function archiveEvent(eventId: string): Promise<EventResponse> {
  return apiFetch<EventResponse>(`/events/${eventId}/archive`, { method: "POST" });
}

export function deleteEvent(eventId: string): Promise<void> {
  return apiFetch<void>(`/events/${eventId}`, { method: "DELETE" });
}
