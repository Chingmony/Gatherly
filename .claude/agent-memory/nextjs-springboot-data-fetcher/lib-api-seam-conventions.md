---
name: lib-api-seam-conventions
description: How to add new endpoints to the lib/api seam; apiFetch wrapper contract; mock vs real swap pattern
metadata:
  type: project
---

All frontend data access routes through `frontend/lib/api/`. The central fetch primitive is `apiFetch<T>` in `frontend/lib/api/client.ts`.

## apiFetch contract
- Base URL: `(NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(/\/+$/, "") + "/api/v1"`
- Sends cookies with every request (`credentials: "include"`) — the JWT access token is in an httpOnly cookie path-scoped to `/api/v1`
- On 401, transparently POST `/auth/refresh` once (single-flight to prevent rotation race) and replays the request; a still-401 clears the role cookie and redirects to `/login`
- Unwraps the `{ success, message, data }` envelope and returns `data` as `T`
- Non-2xx throws `ApiError` with `.status`, `.code` (backend ErrorCode string), `.message`, `.fieldErrors[]`
- `/auth/*` endpoints are excluded from the refresh retry (they own their own 401s)

## Adding a new endpoint module
1. Create `frontend/lib/api/<domain>.ts`
2. Import `apiFetch` from `./client`
3. Define TypeScript interfaces mirroring the backend DTO (no Zod runtime parsing in the existing modules — type assertions only)
4. Export typed async functions that call `apiFetch<T>(path, opts)`
5. If the backend endpoint doesn't exist yet, use a mock-backed `Promise.resolve(MOCK_DATA)` and document the swap point in a JSDoc comment — do not call `apiFetch` until the backend is real

## Mock-backed swap pattern
```ts
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function listAgenda(eventId: string, signal?: AbortSignal): Promise<AgendaItem[]> {
  // When the backend lands, replace body with:
  // return apiFetch<AgendaItem[]>(`/events/${eventId}/agenda`, { signal })
  return Promise.resolve(MOCK_AGENDA.map((item) => ({ ...item })))
}
```
Callers don't change when you swap — only the function body changes.

## Existing modules (as of 2026-06-16)
`auth.ts`, `users.ts`, `client.ts`, `me.ts`, `forms.ts`, `assignments.ts`, `materials.ts`, `storage.ts`, `events.ts`, `tickets.ts`, `attendance.ts`, `agenda.ts`
