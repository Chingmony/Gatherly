import { apiFetch } from "./client";
import type { InviteUserBody, UpdateUserBody, UserResponse } from "./types";

/** Client-side admin user mutations (docs/03 §4.2). Reads are done server-side (see server.ts). */

/** Invite a user — no password; the backend emails them a set-password link. */
export function inviteUser(body: InviteUserBody): Promise<UserResponse> {
  return apiFetch<UserResponse>("/users", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Edit a user's profile, role, and status (Admin only). */
export function updateUser(userId: string, body: UpdateUserBody): Promise<UserResponse> {
  return apiFetch<UserResponse>(`/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

/** Hard-delete a user (Admin only; cannot delete self; 409 if still referenced by events). */
export function deleteUser(userId: string): Promise<void> {
  return apiFetch<void>(`/users/${userId}`, { method: "DELETE" });
}
