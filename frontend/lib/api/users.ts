import { apiFetch } from "./client";
import type { CreateUserBody, UserResponse } from "./types";

/** Client-side admin user mutations (docs/03 §4.2). Reads are done server-side (see server.ts). */

export function createUser(body: CreateUserBody): Promise<UserResponse> {
  return apiFetch<UserResponse>("/users", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function deactivateUser(userId: string): Promise<void> {
  return apiFetch<void>(`/users/${userId}`, { method: "DELETE" });
}
