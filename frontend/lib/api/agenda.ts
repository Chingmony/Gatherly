import { apiFetch } from "./client";
import type { AgendaResponse, UpdateAgendaBody } from "./types";

/** Client-side agenda mutation (docs/03 §4.4). Reads are done server-side (see server.ts). */
export function saveAgenda(eventId: string, body: UpdateAgendaBody): Promise<AgendaResponse> {
  return apiFetch<AgendaResponse>(`/events/${eventId}/agenda`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
