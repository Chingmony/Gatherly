/**
 * Users surface — wraps the Admin user-management routes under `/api/v1/users`
 * (see backend `UserController`). ADMIN only; the `@PreAuthorize` gate on the
 * service is the real authority, so non-admins get a 403 here.
 */
import { apiFetch } from "./client";
import type { GlobalRole, UserResponse } from "./auth";

export type { GlobalRole, UserResponse };

/** Sort keys accepted by `GET /users` (mirrors backend `UserSort`). */
export type UserSort = "NAME" | "EMAIL" | "STATUS" | "CREATED_AT";

export interface ListUsersParams {
  search?: string;
  page?: number;
  size?: number;
  sort?: UserSort;
  direction?: "ASC" | "DESC";
}

/**
 * Paginated, searchable directory of all users. ADMIN only.
 * Returns just the page content (the unwrapped `data` array); page metadata is
 * dropped by `apiFetch`. Errors: 403 `FORBIDDEN` for non-admins.
 */
export function listUsers(params: ListUsersParams = {}): Promise<UserResponse[]> {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.page != null) q.set("page", String(params.page));
  if (params.size != null) q.set("size", String(params.size));
  if (params.sort) q.set("sort", params.sort);
  if (params.direction) q.set("direction", params.direction);
  const qs = q.toString();
  return apiFetch<UserResponse[]>(`/users${qs ? `?${qs}` : ""}`);
}

/**
 * Create a user. ADMIN only. The backend emails the temporary password plus a
 * set-your-password link to `email`. Errors: 409 `CONFLICT` if the email exists,
 * 400 `VALIDATION_ERROR` for invalid fields (password must be 8–100 chars).
 */
export function createUser(body: {
  email: string;
  password: string;
  fullName: string;
  phone?: string | null;
  globalRole: GlobalRole;
  avatarKey?: string | null;
}): Promise<UserResponse> {
  return apiFetch<UserResponse>("/users", { method: "POST", body });
}

/** Permanently delete a user. ADMIN only; cannot delete self (409 CONFLICT). */
export function deleteUser(userId: string): Promise<void> {
  return apiFetch<void>(`/users/${userId}`, { method: "DELETE" });
}

/** Partial update of a user (fullName, phone, gender, globalRole, status, …). ADMIN only. */
export function updateUser(
  userId: string,
  body: Partial<{
    fullName: string;
    phone: string | null;
    gender: "MALE" | "FEMALE" | "OTHER" | null;
    dateOfBirth: string | null;
    address: string | null;
    globalRole: GlobalRole;
    status: "ACTIVE" | "INACTIVE";
    avatarKey: string | null;
  }>,
): Promise<UserResponse> {
  return apiFetch<UserResponse>(`/users/${userId}`, { method: "PUT", body });
}
