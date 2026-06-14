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

## GAP-003 — No profile image (avatar) endpoint

**Severity:** Medium (feature gap)
**Frontend page:** `/settings`
**Affected endpoint:** None — endpoint does not exist yet

### Current state

`UserResponse` has no `profileImageUrl` field. There is no endpoint to upload or retrieve a user avatar.

The Settings page currently shows a camera icon button on the avatar. Clicking it opens a local file picker and shows a **local preview only** (via `URL.createObjectURL`). The image is **not persisted** — it resets on page reload. The preview is purely UI scaffolding until the backend is ready.

### Required backend changes

Following the existing Rustfs presigned URL pattern (see `docs/04-external-integrations.md`):

**1 — DB migration**
```sql
ALTER TABLE users ADD COLUMN profile_image_url VARCHAR(2048);
```

**2 — Update `UserResponse`**
```java
String profileImageUrl  // nullable
```

**3 — New endpoint: get presigned upload URL**
```
POST /me/avatar/upload-url
Authorization: Bearer <token>
Request body: { "contentType": "image/jpeg" }   // or image/png, image/webp
Response:
{
  "uploadUrl": "https://rustfs.../presigned-put-url",
  "fileKey":   "avatars/<userId>/<uuid>.jpg"
}
```

**4 — New endpoint: confirm upload and save**
```
PUT /me/avatar
Authorization: Bearer <token>
Request body: { "fileKey": "avatars/<userId>/<uuid>.jpg" }
Response: UserResponse  (with profileImageUrl populated)
```

### Frontend integration plan (once backend is ready)

```
1. User clicks camera → picks file
2. POST /me/avatar/upload-url → { uploadUrl, fileKey }
3. PUT <uploadUrl> with file binary (direct to Rustfs, no auth header)
4. PUT /me/avatar with { fileKey }
5. Update me state with returned UserResponse.profileImageUrl
6. Pass profileImageUrl to <AvatarUser imageUrl={...} />
```

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
