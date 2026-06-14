import { apiFetch } from "./client";
import type { InviteUserBody, UserResponse } from "./types";

/** Client-side admin user mutations (docs/03 §4.2). Reads are done server-side (see server.ts). */

/** Invite a user — no password; the backend emails them a set-password link. */
export function inviteUser(body: InviteUserBody): Promise<UserResponse> {
  return apiFetch<UserResponse>("/users", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function deactivateUser(userId: string): Promise<void> {
  return apiFetch<void>(`/users/${userId}`, { method: "DELETE" });
}
