import { apiFetch } from "./client";
import type { AssignMemberBody, AssignmentResponse } from "./types";

/** Event delegation / members (docs/03 §4.5). Reads done server-side; mutations client-side. */

export function assignMember(eventId: string, body: AssignMemberBody): Promise<AssignmentResponse> {
  return apiFetch<AssignmentResponse>(`/events/${eventId}/assignments`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function removeAssignment(eventId: string, assignmentId: string): Promise<void> {
  return apiFetch<void>(`/events/${eventId}/assignments/${assignmentId}`, { method: "DELETE" });
}
