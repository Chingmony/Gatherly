/**
 * Current-user surface — wraps the authenticated `/api/v1/me` routes (profile, password,
 * avatar; see backend `MeController`). Every call requires a session; a 401 is handled by
 * the shared client (transparent token refresh, else redirect to /login).
 */
import { apiFetch, apiUpload } from "./client";
import type { UserResponse } from "./auth";

export type { UserResponse };

/** Fetch the signed-in user's profile. */
export function getMe(): Promise<UserResponse> {
  return apiFetch<UserResponse>("/me");
}

/**
 * Update editable profile fields. Send `null` (not `""`) for cleared enum/date fields —
 * the backend 400s on an empty string for `gender`/`dateOfBirth`.
 */
export function updateMe(body: {
  fullName?: string | null;
  phone?: string | null;
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  dateOfBirth?: string | null;
  address?: string | null;
}): Promise<UserResponse> {
  return apiFetch<UserResponse>("/me", { method: "PUT", body });
}

/** Change the account password. Errors: 400 `VALIDATION_ERROR`, 401 on a wrong current password. */
export function changePassword(body: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  return apiFetch<void>("/me/password", { method: "PUT", body });
}

/**
 * Upload a profile photo. The API brokers the file to object storage (the browser can't
 * reach Rustfs directly — no CORS) and returns the updated profile with a viewable
 * avatarUrl. Accepts PNG/JPEG/WebP up to 5 MB (enforced server-side too).
 */
export function uploadAvatar(file: File): Promise<UserResponse> {
  const form = new FormData();
  form.append("file", file);
  return apiUpload<UserResponse>("/me/avatar", form);
}
