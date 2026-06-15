import type { UserResponse } from "./types";

// Backend lives under the /api/v1 prefix. The httpOnly access_token cookie is scoped to
// Path=/api/v1, so calls MUST include this prefix or the cookie is never sent → 401.
const BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(/\/+$/, "") +
  "/api/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("gatherly_access_token");
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init?.headers as Record<string, string> | undefined),
  };
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    ...init,
    headers,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? `HTTP ${res.status}`);
  return json as T;
}

/**
 * Upload a profile photo. The browser can't reach object storage directly (Rustfs sends no CORS
 * headers), so the API brokers it: we POST the file as multipart to /me/avatar and the backend
 * stores it and returns the updated profile (with a viewable avatarUrl). Don't set Content-Type —
 * the browser adds the multipart boundary.
 */
export async function uploadAvatar(file: File): Promise<UserResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/me/avatar`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? `HTTP ${res.status}`);
  return (json as { data: UserResponse }).data;
}
