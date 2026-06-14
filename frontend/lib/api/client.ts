/**
 * Typed API client seam (spec 05 §3).
 *
 * This is the single boundary between the UI and the backend. Today the domain
 * modules (events.ts, materials.ts, …) return data from `lib/mock-data` so the
 * prototype runs without a backend. When the API exists:
 *
 *   1. Implement `apiFetch` below (base URL from env, `credentials: 'include'`,
 *      JSON (de)serialization, single-flight 401 → /auth/refresh → retry, and
 *      `next: { tags, revalidate }` cache intent per spec §3.1).
 *   2. Rewrite each domain module's body to `await apiFetch(...)` and make the
 *      exported accessors `async` (Promise-returning).
 *   3. Move data-consuming client components to server-fetched props, then
 *      delete `lib/mock-data.ts` / `lib/event-data.ts`.
 *
 * Until then accessors are synchronous and mock-backed, so components consume
 * them with no structural change.
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fieldErrors?: Record<string, string>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? ''

/** Whether the data layer is currently mock-backed (no real API wired). */
export const USING_MOCK_DATA = true

export interface FetchOptions extends RequestInit {
  /** Next.js cache intent — tags + revalidate (spec §3.1). */
  next?: { tags?: string[]; revalidate?: number | false }
}

/**
 * Placeholder fetch wrapper. Not used while `USING_MOCK_DATA` is true; wire it
 * up (and flip the flag) when the backend is available.
 */
export async function apiFetch<T>(_path: string, _options?: FetchOptions): Promise<T> {
  throw new ApiError(
    501,
    'NOT_IMPLEMENTED',
    'API client is not wired yet — data layer is mock-backed (see lib/api/client.ts).'
  )
}
