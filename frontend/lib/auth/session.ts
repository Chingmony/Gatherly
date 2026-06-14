/**
 * Client-side session state for UI gating only — NOT a security boundary.
 *
 * The real session lives in httpOnly cookies the browser can't read; the API
 * (`@PreAuthorize`) is the authority. Here we only persist what the UI needs to
 * render: the user profile and a UI-role key. The existing shell reads the role
 * from `sessionStorage["gatherly_role"]` (see `components/layout/role-shell.tsx`),
 * so we keep writing that key.
 */
import { logout as logoutRequest, type GlobalRole, type UserResponse } from '@/lib/api/auth'
import type { Role } from '@/lib/roles'

const ROLE_KEY = 'gatherly_role'
const USER_KEY = 'gatherly_user'
const RESET_EMAIL_KEY = 'gatherly_reset_email'
const RESET_TOKEN_KEY = 'gatherly_reset_token'

/**
 * Map the backend global role to the UI role vocabulary. Event-scoped roles aren't
 * in the token, so a global `USER` is treated as the least-privileged `handler` for
 * UX; the API still enforces the real per-event permissions.
 */
export function toUiRole(role: GlobalRole): Role {
  switch (role) {
    case 'ADMIN':
      return 'admin'
    case 'SUB_ADMIN':
      return 'subadmin'
    default:
      return 'handler'
  }
}

/** Persist the signed-in user + UI role after a successful login. */
export function startSession(user: UserResponse): Role {
  const role = toUiRole(user.globalRole)
  sessionStorage.setItem(ROLE_KEY, role)
  sessionStorage.setItem(USER_KEY, JSON.stringify(user))
  return role
}

/** Where to land after login. Everyone has a dashboard; the shell adapts per role. */
export function landingFor(_role: Role): string {
  return '/dashboard'
}

/** Drop all client session state (call alongside the logout API). */
export function clearSession(): void {
  sessionStorage.removeItem(ROLE_KEY)
  sessionStorage.removeItem(USER_KEY)
  clearResetFlow()
}

/**
 * Revoke the refresh token server-side (clears the httpOnly cookies) and drop local
 * state. Best-effort: the backend logout is idempotent and we clear locally even if
 * the network call fails, so the user is always signed out from the UI's perspective.
 */
export async function performLogout(): Promise<void> {
  try {
    await logoutRequest()
  } catch {
    // ignore — logout must not get stuck on a network error
  }
  clearSession()
}

export function getUser(): UserResponse | null {
  const raw = sessionStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as UserResponse
  } catch {
    return null
  }
}

/**
 * Carry state across the three reset steps: forgot-password (email) →
 * verify-otp (exchanges the OTP for a single-use reset token) → reset-password
 * (consumes the token to set the new password). Stored in sessionStorage so it
 * clears on tab close; the backend remains the real authority on validity/expiry.
 */
export function setResetEmail(email: string): void {
  sessionStorage.setItem(RESET_EMAIL_KEY, email)
}

export function getResetEmail(): string {
  return sessionStorage.getItem(RESET_EMAIL_KEY) ?? ''
}

/** Persist the single-use reset grant returned by verify-otp for the reset-password step. */
export function setResetToken(token: string): void {
  sessionStorage.setItem(RESET_TOKEN_KEY, token)
}

export function getResetToken(): string {
  return sessionStorage.getItem(RESET_TOKEN_KEY) ?? ''
}

/** Drop the email + reset token once the flow completes or is abandoned. */
export function clearResetFlow(): void {
  sessionStorage.removeItem(RESET_EMAIL_KEY)
  sessionStorage.removeItem(RESET_TOKEN_KEY)
}
