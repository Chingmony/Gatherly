import { apiFetch } from "./client";
import type { FormResponse, UpdateFormBody } from "./types";

/** Registration form builder (docs/03 §4.8). Reads server-side; save/activate client-side. */

export function saveForm(eventId: string, body: UpdateFormBody): Promise<FormResponse> {
  return apiFetch<FormResponse>(`/events/${eventId}/form`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function activateForm(eventId: string): Promise<FormResponse> {
  return apiFetch<FormResponse>(`/events/${eventId}/form/activate`, { method: "POST" });
}
