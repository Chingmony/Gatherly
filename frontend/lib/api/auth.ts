/**
 * Auth endpoints (spec 03 §). Stubs for the prototype — the (auth) screens run
 * their flows client-side. Wire these to the backend (JWT cookies, Redis OTP)
 * for M1.
 */

export interface Credentials {
  email: string
  password: string
}

export async function login(_credentials: Credentials): Promise<void> {
  throw new Error('auth.login is not wired yet (M1).')
}

export async function logout(): Promise<void> {
  throw new Error('auth.logout is not wired yet (M1).')
}

/** Request a password-reset OTP for the given email. */
export async function requestOtp(_email: string): Promise<void> {
  throw new Error('auth.requestOtp is not wired yet (M1).')
}

/** Verify an OTP code; returns a short-lived reset grant on success. */
export async function verifyOtp(_email: string, _code: string): Promise<void> {
  throw new Error('auth.verifyOtp is not wired yet (M1).')
}

export async function resetPassword(_grant: string, _newPassword: string): Promise<void> {
  throw new Error('auth.resetPassword is not wired yet (M1).')
}
