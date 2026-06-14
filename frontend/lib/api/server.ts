import { cookies } from "next/headers";
import { ApiError, type ApiErrorBody } from "./client";

/**
 * Server-side (RSC / Server Action) fetch that forwards the caller's auth cookies to the backend
 * (docs/05 §3). Authorization-sensitive reads are never cached. The browser holds the backend's
 * httpOnly cookies (host-scoped to localhost in dev), which Next forwards here.
 */
function baseUrl(): string {
  const url =
    process.env.INTERNAL_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:8080/api/v1";
  return url.replace(/\/$/, "");
}

export async function serverFetch<T>(path: string): Promise<T> {
  const store = await cookies();
  const cookieHeader = store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const res = await fetch(`${baseUrl()}${path.startsWith("/") ? path : `/${path}`}`, {
    headers: { Accept: "application/json", Cookie: cookieHeader },
    cache: "no-store",
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
