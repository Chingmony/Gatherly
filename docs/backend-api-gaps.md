# Backend API Gaps — Frontend Integration Notes

Tracked mismatches between what the frontend needs and what the current backend provides.
Each item describes the gap, the affected endpoint, and the recommended fix.

---

## GAP-001 — Email not updatable via `PUT /me`

**Severity:** Minor (UX limitation)
**Frontend page:** `/settings`
**Affected endpoint:** `PUT /me`

### Current backend behaviour

`SelfUpdateRequest` accepts only:

```java
public record SelfUpdateRequest(
    String fullName,
    String phone,
    Gender gender,
    LocalDate dateOfBirth,
    String address)
```

Email is not included — it cannot be changed by the user via self-service.

### Frontend workaround (applied)

The email `<Input>` on the Settings page is rendered as **read-only / disabled** with the note
_"Email address cannot be changed."_ The `PUT /me` call sends only `{ fullName }` (and will
include `phone`, `gender`, `dateOfBirth`, `address` once those fields are added to the UI).

### Recommended backend change (if email change should be supported)

Email is an auth credential — changing it should require re-verification. The suggested flow:

1. `POST /me/email` — accepts `{ newEmail }`, sends OTP to `newEmail`
2. `POST /me/email/confirm` — accepts `{ newEmail, otp }`, updates email on success

This is a **new endpoint pair** and needs product sign-off before implementation.
If email change is intentionally not supported, no backend change is needed — the current
read-only UI is the correct behaviour.

---

## GAP-002 — `PUT /me` only wired to `fullName` from the Settings form

**Severity:** Low (missing fields, not a bug)
**Frontend page:** `/settings`
**Affected endpoint:** `PUT /me`

### Context

`SelfUpdateRequest` supports `phone`, `gender`, `dateOfBirth`, and `address` but the current
Settings UI only exposes `fullName` (and read-only `email`).
The `PUT /me` call currently sends `{ fullName }` with all other fields omitted (treated as
`null` by the backend, which leaves them unchanged because `SelfUpdateRequest` fields are
all nullable).

### Action required

None on the backend side. When the frontend team adds phone / demographic fields to the
Settings form, the payload will include them automatically. The backend already handles them.

---

---

## GAP-003 — Profile image (avatar) upload — ✅ RESOLVED (implemented)

**Severity:** Medium (feature gap) → **Resolved 2026-06-15**
**Frontend page:** `/settings` (and the top-bar avatar)
**Endpoint:** `POST /api/v1/me/avatar` (new)

### What was implemented

A user can now upload a profile photo; it is stored in object storage (Rustfs) and rendered everywhere the user appears.

**Backend (`UserController`, `UserService`, `StorageService`, `RustfsClient`):**

- **`POST /api/v1/me/avatar`** — `multipart/form-data` with a `file` part. Validates type (PNG/JPEG/WebP) and size (≤ 5 MB), stores the object under key `user/{userId}/avatar/{uuid}.{ext}`, persists the key on the user, and returns the updated `UserResponse`. Self-scoped (`@PreAuthorize("#userId == authentication.principal.id")` on `UserService.updateAvatar`; `StorageService.store` is `isAuthenticated()`).
- **`UserResponse.avatarUrl`** (new field) — a short-lived **presigned GET URL** resolved in `UserMapper` from the stored `avatar_key` via `RustfsClient.presignGet(...)`. `null` when the user has no avatar. (The `avatar_key` column already existed in `V1__init.sql`; **no migration needed**.)
- **`SelfUpdateRequest.avatarKey`** added too, so `PUT /me` can also set the key (not used by the current UI, which uses the multipart endpoint).
- **`RustfsBucketInitializer`** — an `ApplicationRunner` that creates the storage bucket on startup if missing (best-effort, never blocks startup). The `gatherly` bucket did not previously exist.
- **`application.yml`** — `spring.servlet.multipart.max-file-size: 5MB` / `max-request-size: 6MB` (Spring's 1 MB default would reject avatars).

**Frontend:** the Settings camera button POSTs the file to `/me/avatar` (`uploadAvatar` in `lib/api.ts`) and renders `UserResponse.avatarUrl`; the top-bar `AvatarUser` also renders it.

### Design decision — API brokers the upload (deviation from "presigned direct upload")

The original plan (and `docs/04`) called for the browser to upload **directly** to Rustfs via a presigned PUT URL (the existing `POST /storage/presign` flow). **This cannot work with the current Rustfs deployment:** Rustfs returns no CORS headers and exposes no CORS configuration option (`rustfs server --help` has no CORS/origin flag; the `OPTIONS` preflight returns 200 with no `Access-Control-Allow-Origin`). The browser therefore blocks the cross-origin `localhost:3000 → localhost:9000` PUT ("Failed to fetch").

So the avatar upload is **proxied through the API** instead: the browser uploads to `POST /api/v1/me/avatar` (the API's CORS already allows the frontend origin with credentials) and the backend streams the bytes to Rustfs server-side via `RustfsClient.putObject(...)`. This intentionally deviates from the "API never proxies binaries" principle in `CLAUDE.md`/`docs/04` — acceptable for small (≤ 5 MB) avatars; the presigned-direct path remains available (`POST /storage/presign`) for any future flow once a CORS-capable object store is used. **Display** still uses a presigned GET URL directly in `<img>` (image GETs are not subject to CORS), so only the upload is proxied.

### Follow-ups (not done)

- Superseded avatar objects are not deleted on replacement (orphan blobs accumulate). `RustfsClient.deleteQuietly(oldKey)` exists; wire it into `updateAvatar` if cleanup is desired.
- `avatarUrl` is presigned per response (short TTL); admin user-list responses presign one URL per row. Fine at current scale; revisit if listing large user sets.
- To enable the spec's presigned **direct** upload later, deploy an object store whose bucket CORS can be configured to allow the frontend origin for `PUT`.

---

## GAP-004 — Proxy role guard relies on a client-set cookie (no server-readable role signal)

**Severity:** Low (UX guard hardening; not a security hole — API `@PreAuthorize` is the real authority)
**Frontend page:** `proxy.ts` (role-based route guarding for all authenticated routes)
**Affected endpoint:** `POST /auth/login`, `POST /auth/refresh`

### Context

`proxy.ts` now routes each UI role (`admin` / `subadmin` / `handler`) to its allowed routes and
redirects away from the rest. The proxy runs server-side and can only read cookies, but:

- The httpOnly `access_token` cookie is scoped `Path=/api/v1`, so it is **not sent on page-route
  requests** — the proxy never sees it.
- The UI role otherwise lives only in `sessionStorage`, which is not readable server-side.

### Frontend workaround (applied)

`lib/auth/session.ts` writes a **non-httpOnly** `gatherly_role` cookie (`Path=/`, `SameSite=Lax`,
7-day `Max-Age`) on login and clears it on logout. The proxy reads this cookie. Because it is a UX
guard only, a tampered cookie merely changes which UI shell renders — the backend still gates all
data via `@PreAuthorize`.

### Recommended backend change (optional hardening)

To make the guard non-spoofable, provide a server-trusted role signal the proxy can read at `Path=/`:

1. **Signed, readable role cookie** — on login/refresh, set a cookie at `Path=/` (e.g.
   `gatherly_role`) signed/HMAC'd by the backend (or a short-lived JWT containing only the global
   role), which the proxy verifies; **or**
2. **Session/role verify endpoint** — a lightweight `GET /auth/session` (or widen the `access_token`
   cookie path) the proxy can consult to obtain the authenticated role.

Either removes the reliance on a client-writable cookie. No backend work required for the current
UX-only behaviour to function.

---

## Already matched — no changes needed

| Endpoint | Frontend use | Status |
|---|---|---|
| `GET /me` | Load profile name + email on Settings page | ✓ Matches `UserResponse` |
| `PUT /me/password` | Update Password card — `{ currentPassword, newPassword }` | ✓ Matches `ChangePasswordRequest` |
| `GET /events?size=100` | Handler dashboard + tasks page | ✓ |
| `GET /events/{id}/materials?size=100` | Handler dashboard + tasks page | ✓ |
