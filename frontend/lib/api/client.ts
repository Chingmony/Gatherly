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

/** All controllers sit behind /api/v1 (applied via backend WebMvcConfig). */
const API_PREFIX = '/api/v1'

/** Whether the data layer is currently mock-backed (no real API wired). */
export const USING_MOCK_DATA = true

export interface FetchOptions extends RequestInit {
  /** Next.js cache intent — tags + revalidate (spec §3.1). */
  next?: { tags?: string[]; revalidate?: number | false }
}

/** Backend uniform success envelope (spec 03 §5). */
interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
}

/** Backend uniform error envelope (spec 07 §2). */
interface ErrorEnvelope {
  success: false
  status: number
  error: string
  message: string
  fieldErrors?: { field: string; code?: string; message: string }[] | null
}

/** Collapse the backend's fieldErrors array into the field→message map ApiError expects. */
function toFieldMap(fieldErrors: ErrorEnvelope['fieldErrors']): Record<string, string> | undefined {
  if (!fieldErrors?.length) return undefined
  return fieldErrors.reduce<Record<string, string>>((acc, fe) => {
    acc[fe.field] = fe.message
    return acc
  }, {})
}

/**
 * Single boundary between the UI and the backend. Sends/receives JSON, attaches
 * cookies (`credentials: 'include'` — auth rides on the backend's httpOnly
 * access/refresh cookies), and normalizes the uniform envelope: returns
 * `data` on success, throws `ApiError` on failure.
 */
export async function apiFetch<T>(path: string, options?: FetchOptions): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
      credentials: 'include',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
  } catch {
    // Network failure / CORS / server down — no HTTP response at all.
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Unable to reach the server. Please try again.',
      undefined
    )
  }

  // 204 / empty body — nothing to parse.
  const text = await res.text()
  const body: unknown = text ? safeJsonParse(text) : null

  if (!res.ok || (isEnvelope(body) && body.success === false)) {
    const err = (body ?? {}) as Partial<ErrorEnvelope>
    throw new ApiError(
      res.status,
      err.error ?? 'ERROR',
      err.message ?? res.statusText ?? 'Request failed.',
      toFieldMap(err.fieldErrors)
    )
  }

  return (isEnvelope(body) ? body.data : body) as T
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function isEnvelope(body: unknown): body is ApiEnvelope<unknown> {
  return typeof body === 'object' && body !== null && 'success' in body
}
