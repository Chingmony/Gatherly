import { apiFetch } from "./client";
import type { UserResponse } from "./types";

/** Client-side auth calls (docs/03 §4.1). Tokens are set as httpOnly cookies by the backend. */

/** Login returns this when an invited account's one-time code was accepted (docs/03 §4.1). */
export interface SetupRequired {
  setupRequired: true;
  email: string;
  resetGrant: string;
}

export type LoginResult = UserResponse | SetupRequired;

export function isSetupRequired(r: LoginResult): r is SetupRequired {
  return (r as SetupRequired).setupRequired === true;
}

/**
 * Sign in. For an active account the backend sets session cookies and returns the user. For an
 * invited account, the password field carries the one-time invite code; on a match the backend
 * returns {@link SetupRequired} (no session) and the caller routes to the set-password screen.
 */
export function login(email: string, password: string): Promise<LoginResult> {
  return apiFetch<LoginResult>("/auth/login", {
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

/**
 * Set a password using a one-time grant from {@link verifyOtp} or the invite-login flow. One call
 * for both: it activates an invited account and resets an existing account's password.
 */
export function resetPassword(email: string, resetGrant: string, newPassword: string): Promise<void> {
  return apiFetch<void>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, resetGrant, newPassword }),
  });
}
