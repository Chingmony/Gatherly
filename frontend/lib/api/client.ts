/**
 * Single fetch seam for the Gatherly API.
 *
 * Every request goes through `apiFetch`, which:
 *  - targets the backend at `NEXT_PUBLIC_API_BASE_URL` + `/api/v1`,
 *  - sends the httpOnly auth cookies via `credentials: "include"` (access cookie is
 *    path-scoped to `/api/v1`, refresh to `/api/v1/auth` — the browser routes them),
 *  - on a 401 transparently rotates the access token via POST /auth/refresh and replays
 *    the request once (single-flight, so concurrent 401s share one refresh); a failed
 *    refresh ends the session and redirects to /login,
 *  - unwraps the backend success envelope ({ success, message, data, ... }) to `data`,
 *  - turns any non-2xx response into a thrown {@link ApiError} carrying the backend
 *    ErrorCode (e.g. `INVALID_CREDENTIALS`) so callers branch on `err.code`.
 */

const API_ROOT =
  (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(/\/+$/, "") +
  "/api/v1";

/** Field-level validation detail mirrored from the backend `FieldErrorDetail`. */
export interface FieldError {
  field: string;
  code: string;
  message: string;
}

/**
 * Thrown for any non-2xx response (and for network failures with status 0).
 * `code` is the backend ErrorCode name — switch on it instead of the message string.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: FieldError[];

  constructor(status: number, code: string, message: string, fieldErrors: FieldError[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

/** Backend success envelope (`com.gatherly.common.ApiResponse`). */
interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** JSON-serialisable request body; omitted for bodyless calls. */
  body?: unknown;
  signal?: AbortSignal;
}

// ── Transparent token refresh ────────────────────────────────────────────────

/**
 * In-flight POST /auth/refresh shared by every request that 401s while the access token
 * is expired. Single-flighting matters: the refresh token rotates on each use, so N
 * concurrent refreshes would invalidate all but the first and log the user out. The first
 * 401 starts the refresh; the rest await the same promise.
 */
let refreshInFlight: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  refreshInFlight ??= rawFetch("/auth/refresh", { method: "POST" })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

/**
 * Refresh failed — the refresh token is missing, expired, revoked, or already rotated, so
 * the session is unrecoverable. Drop the UI role cookie and bounce to /login. No-ops on the
 * server and when already on an auth route (avoids redirect loops).
 */
function forceReauth(): void {
  if (typeof window === "undefined") return;
  document.cookie = "gatherly_role=; Path=/; SameSite=Lax; Max-Age=0";
  if (!window.location.pathname.startsWith("/login")) {
    window.location.assign("/login");
  }
}

/** /auth/* endpoints own their 401s (bad credentials, expired OTP/grant) — never refresh-retry them. */
function managesOwnAuth(path: string): boolean {
  return path.startsWith("/auth/");
}

// ── Request primitives ───────────────────────────────────────────────────────

/** One HTTP round-trip. Maps a total network failure (no response) to a NETWORK_ERROR. */
async function rawFetch(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(API_ROOT + path, { credentials: "include", ...init });
  } catch {
    // No HTTP response at all — server down, DNS/CORS failure, or aborted.
    throw new ApiError(0, "NETWORK_ERROR", "Unable to reach the server. Please try again.");
  }
}

/**
 * Run `send`; if it 401s on a protected route, refresh the access token once and replay.
 * A still-401 response (or a failed refresh) ends the session.
 */
async function withRefresh(path: string, send: () => Promise<Response>): Promise<Response> {
  let res = await send();
  if (res.status === 401 && !managesOwnAuth(path)) {
    if (await refreshSession()) {
      res = await send();
    } else {
      forceReauth();
    }
  }
  return res;
}

/** Unwrap the success envelope to `data`, or throw {@link ApiError} for any non-2xx. */
function unwrap<T>(res: Response, payload: Record<string, unknown> | null): T {
  if (!res.ok) {
    const code = typeof payload?.error === "string" ? payload.error : "UNKNOWN";
    const message =
      typeof payload?.message === "string" ? payload.message : `Request failed (${res.status}).`;
    throw new ApiError(res.status, code, message, mapFieldErrors(payload?.fieldErrors));
  }
  return (payload as ApiEnvelope<T> | null)?.data as T;
}

/** Perform a JSON API call and return the unwrapped `data`, or throw {@link ApiError}. */
export async function apiFetch<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal } = opts;
  const res = await withRefresh(path, () =>
    rawFetch(path, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    }),
  );
  return unwrap<T>(res, await parseJson(res));
}

/**
 * Multipart upload (e.g. profile avatar). The browser sets the multipart boundary, so we
 * must not set Content-Type ourselves. Shares the transparent-refresh + envelope-unwrap path.
 */
export async function apiUpload<T>(path: string, form: FormData, signal?: AbortSignal): Promise<T> {
  const res = await withRefresh(path, () => rawFetch(path, { method: "POST", body: form, signal }));
  return unwrap<T>(res, await parseJson(res));
}

async function parseJson(res: Response): Promise<Record<string, unknown> | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function mapFieldErrors(raw: unknown): FieldError[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((f) => {
    const o = (f ?? {}) as Record<string, unknown>;
    return {
      field: String(o.field ?? ""),
      code: String(o.code ?? ""),
      message: String(o.message ?? ""),
    };
  });
}
