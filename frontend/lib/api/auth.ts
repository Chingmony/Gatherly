import { apiFetch } from "./client";
import type { UserResponse } from "./types";

/** Client-side auth calls (docs/03 §4.1). Tokens are set as httpOnly cookies by the backend. */

export function login(email: string, password: string): Promise<UserResponse> {
  return apiFetch<UserResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function logout(): Promise<void> {
  return apiFetch<void>("/auth/logout", { method: "POST" });
}

export function forgotPassword(email: string): Promise<void> {
  return apiFetch<void>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function verifyOtp(email: string, code: string): Promise<{ resetGrant: string }> {
  return apiFetch<{ resetGrant: string }>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export function resetPassword(email: string, resetGrant: string, newPassword: string): Promise<void> {
  return apiFetch<void>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, resetGrant, newPassword }),
  });
}

/** Activate an invited account: set the first password using the emailed token. */
export function setPassword(token: string, newPassword: string): Promise<void> {
  return apiFetch<void>("/auth/set-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
}
