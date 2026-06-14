/**
 * Auth surface — wraps `POST /api/v1/auth/*` (see backend `AuthController`).
 *
 * Tokens are delivered as httpOnly cookies by the backend; the browser stores and
 * replays them automatically (the client uses `credentials: "include"`), so nothing
 * here touches the access/refresh tokens directly. The login response body still
 * carries the user profile, which we persist for UI role-gating via `lib/auth/session`.
 */
import { apiFetch } from "./client";

/** Mirrors backend `GlobalRole`. Event-scoped roles (MANAGER/HANDLER) are NOT in the token. */
export type GlobalRole = "ADMIN" | "SUB_ADMIN" | "USER";

/** Mirrors backend `UserResponse`. */
export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  dateOfBirth: string | null;
  address: string | null;
  globalRole: GlobalRole;
  status: "ACTIVE" | "DISABLED" | string;
  createdAt: string;
  updatedAt: string;
}

/** Mirrors backend `LoginResponse`. */
export interface LoginResponse {
  tokenType: string;
  accessToken: string;
  expiresInSeconds: number;
  user: UserResponse;
}

/** Mirrors backend `VerifyOtpResponse`. */
export interface VerifyOtpResponse {
  resetToken: string;
  expiresInSeconds: number;
}

/**
 * Authenticate with email + password. On success the backend sets httpOnly
 * access/refresh cookies and returns the profile.
 * Errors: 401 `INVALID_CREDENTIALS`, 429 `RATE_LIMITED`.
 */
export function login(email: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

/**
 * Rotate the access token from the refresh cookie. Returns no body.
 * Errors: 401 `UNAUTHENTICATED` when the refresh cookie is missing/expired/rotated.
 */
export function refresh(): Promise<void> {
  return apiFetch<void>("/auth/refresh", { method: "POST" });
}

/**
 * Revoke the refresh token and clear the auth cookies. Idempotent — safe to call
 * without a valid session, so callers can fire-and-forget it on logout.
 */
export function logout(): Promise<void> {
  return apiFetch<void>("/auth/logout", { method: "POST" });
}

/**
 * Start the OTP password-reset flow. Always succeeds (202) with a neutral message
 * to prevent account enumeration. Errors: 429 `RATE_LIMITED`.
 */
export function forgotPassword(email: string): Promise<void> {
  return apiFetch<void>("/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

/**
 * Resend the OTP for an in-progress reset (the verify-otp "resend code" action).
 * Mirrors {@link forgotPassword}: always 202 with a neutral message; a 60s per-account
 * cooldown and the per-IP OTP limit throttle abuse. Errors: 429 `RATE_LIMITED`.
 */
export function resendOtp(email: string): Promise<void> {
  return apiFetch<void>("/auth/resend-otp", {
    method: "POST",
    body: { email },
  });
}

/**
 * Verify the emailed OTP and receive a short-lived, single-use reset grant token
 * to pass to {@link resetPassword}.
 * Errors: 401 `OTP_INVALID` (wrong code / too many attempts), `OTP_EXPIRED`.
 */
export function verifyOtp(email: string, otp: string): Promise<VerifyOtpResponse> {
  return apiFetch<VerifyOtpResponse>("/auth/verify-otp", {
    method: "POST",
    body: { email, otp },
  });
}

/**
 * Consume the reset grant and set a new password (min 8 chars).
 * Errors: 401 when the reset token is invalid/expired; 400 `VALIDATION_ERROR`.
 */
export function resetPassword(
  email: string,
  resetToken: string,
  newPassword: string,
): Promise<void> {
  return apiFetch<void>("/auth/reset-password", {
    method: "POST",
    body: { email, resetToken, newPassword },
  });
}
