/**
 * Prototype session helper. There is no backend yet, so "auth" is a mock cookie
 * set on sign-in and read by proxy.ts to gate authenticated routes. When M1
 * lands this is replaced by the real JWT access/refresh cookies (spec 03 §) —
 * the proxy guard and these call sites stay, only the token source changes.
 */
export const SESSION_COOKIE = 'gatherly_session'
export type SessionRole = 'ADMIN' | 'MEMBER'

const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

/** Set the mock session cookie (client-side). */
export function signIn(role: SessionRole = 'ADMIN') {
  document.cookie = `${SESSION_COOKIE}=${role}; path=/; max-age=${MAX_AGE}; samesite=lax`
}

/** Clear the mock session cookie (client-side). */
export function signOut() {
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`
}

/** Read the session role from document.cookie (client-side), if any. */
export function currentRole(): SessionRole | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${SESSION_COOKIE}=([^;]+)`))
  return (match?.[1] as SessionRole) ?? null
}
