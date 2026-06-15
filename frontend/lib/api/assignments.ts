/**
 * Event assignments surface — wraps `/api/v1/events/{eventId}/assignments`
 * (see backend `EventAssignmentController`). Lists the users delegated to an event with their
 * event-scoped role (MANAGER / HANDLER), and appoints/revokes them.
 */
import { apiFetch } from "./client";

/** Mirrors backend `EventRole`. */
export type EventRole = "MANAGER" | "HANDLER";

/** Mirrors backend `AssignmentResponse`. */
export interface AssignmentResponse {
  id: string;
  eventId: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  eventRole: EventRole;
  assignedBy: string | null;
  createdAt: string;
}

/** Users assigned to the event with their roles. Visible to ADMIN or anyone assigned. */
export function listAssignments(eventId: string): Promise<AssignmentResponse[]> {
  return apiFetch<AssignmentResponse[]>(`/events/${eventId}/assignments`);
}

/** Appoint a user to an event role. MANAGER is Admin-only; HANDLER needs manage rights. */
export function createAssignment(
  eventId: string,
  userId: string,
  eventRole: EventRole,
): Promise<AssignmentResponse> {
  return apiFetch<AssignmentResponse>(`/events/${eventId}/assignments`, {
    method: "POST",
    body: { userId, eventRole },
  });
}

/** Revoke an assignment. Revoking a MANAGER is Admin-only; HANDLER needs manage rights. */
export function revokeAssignment(eventId: string, assignmentId: string): Promise<void> {
  return apiFetch<void>(`/events/${eventId}/assignments/${assignmentId}`, { method: "DELETE" });
}
