/**
 * Single fetch seam for the Gatherly API.
 *
 * Every request goes through `apiFetch`, which:
 *  - targets the backend at `NEXT_PUBLIC_API_BASE_URL` + `/api/v1`,
 *  - sends the httpOnly auth cookies via `credentials: "include"` (access cookie is
 *    path-scoped to `/api/v1`, refresh to `/api/v1/auth` — the browser routes them),
 *  - unwraps the backend success envelope ({ success, message, data, ... }) to `data`,
 *  - turns any non-2xx response into a thrown {@link ApiError} carrying the backend
 *    ErrorCode (e.g. `INVALID_CREDENTIALS`) so callers branch on `err.code`.
 */

const API_ROOT =
  (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8083").replace(/\/+$/, "") +
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

/** Perform an API call and return the unwrapped `data`, or throw {@link ApiError}. */
export async function apiFetch<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal } = opts;

  let res: Response;
  try {
    res = await fetch(API_ROOT + path, {
      method,
      credentials: "include",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch {
    // No HTTP response at all — server down, DNS/CORS failure, or aborted.
    throw new ApiError(0, "NETWORK_ERROR", "Unable to reach the server. Please try again.");
  }

  const payload = await parseJson(res);

  if (!res.ok) {
    const code = typeof payload?.error === "string" ? payload.error : "UNKNOWN";
    const message =
      typeof payload?.message === "string" ? payload.message : `Request failed (${res.status}).`;
    throw new ApiError(res.status, code, message, mapFieldErrors(payload?.fieldErrors));
  }

  return (payload as ApiEnvelope<T> | null)?.data as T;
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
