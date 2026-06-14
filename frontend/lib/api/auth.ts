/**
 * Auth endpoints (spec 03 §4.1). All endpoints are wired to the backend.
 * Tokens are delivered as httpOnly cookies by the backend; this module mirrors
 * the global role into the readable `gatherly_session` cookie via session helpers
 * so that proxy.ts can gate routes for UX without touching the httpOnly cookies.
 */
import { apiFetch } from './client'
import { signIn, signOut } from '@/lib/auth/session'

export interface Credentials {
  email: string
  password: string
}

// Mirror the backend enums verbatim (UserResponse — see backend dto/user).
export type GlobalRole = 'ADMIN' | 'MEMBER'
export type Gender = 'MALE' | 'FEMALE' | 'OTHER'
export type UserStatus = 'ACTIVE' | 'INACTIVE'

/** Authenticated user projection returned by /auth/login (UserResponse). */
export interface AuthUser {
  id: string
  email: string
  fullName: string
  phone: string | null
  gender: Gender | null
  dateOfBirth: string | null // ISO date (YYYY-MM-DD)
  address: string | null
  globalRole: GlobalRole
  status: UserStatus
  createdAt: string // ISO instant
  updatedAt: string // ISO instant
}

/** Body of a successful POST /api/v1/auth/login (inside the success envelope). */
export interface LoginResponse {
  tokenType: string // "Bearer"
  accessToken: string
  expiresInSeconds: number
  user: AuthUser
}

/**
 * Authenticate against the backend. On success the backend sets httpOnly
 * access/refresh cookies; we mirror the global role into the readable
 * `gatherly_session` cookie so proxy.ts can gate routes for UX.
 */
export async function login(credentials: Credentials): Promise<LoginResponse> {
  const data = await apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
  signIn(data.user.globalRole)
  return data
}

/**
 * Opaque single-use token returned by POST /auth/verify-otp.
 * Present this to POST /auth/reset-password together with the email.
 */
export interface VerifyOtpResponse {
  resetToken: string
  expiresInSeconds: number
}

/**
 * Silently refresh the access token using the httpOnly refresh cookie.
 * The backend rotates the refresh token on every call (spec 03 §4.1) — the new
 * pair is delivered as Set-Cookie headers, so no body is returned.
 * Call this when apiFetch receives a 401 to obtain a fresh access token before
 * retrying the original request.
 */
export async function refresh(): Promise<null> {
  return apiFetch<null>('/auth/refresh', { method: 'POST' })
}

/**
 * Terminate the current session. The backend invalidates the refresh token and
 * clears both httpOnly cookies; this function then clears the readable
 * `gatherly_session` cookie so the proxy guard immediately redirects to /login.
 */
export async function logout(): Promise<null> {
  const result = await apiFetch<null>('/auth/logout', { method: 'POST' })
  signOut()
  return result
}

/**
 * Start the forgot-password OTP flow (POST /auth/forgot-password).
 * The backend always responds 202 regardless of whether the email exists to
 * prevent account enumeration (spec 03 §4.1). data is null.
 */
export async function requestOtp(email: string): Promise<null> {
  return apiFetch<null>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

/**
 * Submit the emailed OTP code (POST /auth/verify-otp).
 * On success returns a short-lived, single-use resetToken the caller must pass
 * to resetPassword() together with the same email address.
 *
 * @param email - the address the OTP was sent to (must match backend record)
 * @param otp   - the code from the email (backend field name: otp, not "code")
 */
export async function verifyOtp(email: string, otp: string): Promise<VerifyOtpResponse> {
  return apiFetch<VerifyOtpResponse>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  })
}

/**
 * Consume a reset grant and set a new password (POST /auth/reset-password).
 * All three fields are required by the backend DTO; email acts as a second
 * factor alongside the resetToken to prevent token-swap attacks.
 *
 * @param email     - the account email (same one used in requestOtp / verifyOtp)
 * @param resetToken - the opaque grant returned by verifyOtp()
 * @param newPassword - must be 8–100 characters (backend @Size constraint)
 */
export async function resetPassword(
  email: string,
  resetToken: string,
  newPassword: string
): Promise<null> {
  return apiFetch<null>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, resetToken, newPassword }),
  })
}
