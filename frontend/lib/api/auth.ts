/**
 * Auth endpoints (spec 03 §). `login` is wired to the backend; the OTP/reset
 * flows remain client-side stubs until their endpoints are wired.
 */
import { apiFetch } from './client'
import { signIn } from '@/lib/auth/session'

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
