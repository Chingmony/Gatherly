/**
 * Typed fetch client (docs/05 §3). Wraps `fetch` with the API base URL, JSON handling,
 * credentialed cookies (for the JWT transport added in M1), and the uniform error body
 * (docs/07) surfaced as a typed {@link ApiError}.
 *
 * The single-flight 401 refresh-and-retry and OpenAPI-generated types (`types.gen.ts`) are
 * layered in alongside auth (M1); M0 establishes the wrapper and error mapping.
 */

/** The uniform error body returned by the backend (docs/07 §2). */
export interface ApiErrorBody {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  traceId: string;
  fieldErrors?: { field: string; code: string; message: string }[];
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly body: ApiErrorBody;

  constructor(body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.status = body.status;
    this.code = body.error;
    this.body = body;
  }
}

/**
 * Resolves the API base URL. Server-side code (RSC/Server Actions) prefers the internal
 * service URL (e.g. `http://backend:8080/api/v1` in docker); browser code uses the public one.
 */
function baseUrl(): string {
  const isServer = typeof window === "undefined";
  const internal = process.env.INTERNAL_API_BASE_URL;
  const publicUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const resolved = (isServer && internal) || publicUrl || "http://localhost:8080/api/v1";
  return resolved.replace(/\/$/, "");
}

export interface RequestOptions extends RequestInit {
  /** Next.js cache hints (docs/05 §3.1). Per-user reads should pass `cache: 'no-store'`. */
  next?: { tags?: string[]; revalidate?: number };
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${baseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    let parsed: ApiErrorBody;
    try {
      parsed = (await res.json()) as ApiErrorBody;
    } catch {
      parsed = {
        timestamp: new Date().toISOString(),
        status: res.status,
        error: "INTERNAL_ERROR",
        message: res.statusText || "Request failed.",
        path,
        traceId: "",
      };
    }
    throw new ApiError(parsed);
  }

  const text = await res.text();
  return (text ? (JSON.parse(text) as T) : (undefined as T));
}
