# 03 — API Routes & Security

> **Status:** Draft · **Depends on:** [`00`](00-system-overview.md) (RBAC matrix), [`01`](01-architecture-layout.md), [`02`](02-database-schema.md)
> Definitive REST contract + Spring Security mapping. Every `@PreAuthorize` here realizes a row of the RBAC matrix in [`00` §5](00-system-overview.md).

---

## 1. Conventions

- **Base path:** `/api/v1`. JSON request/response. UTF-8.
- **Auth transport:** access JWT in an httpOnly `Secure` `SameSite=Strict` cookie; refresh token in a path-scoped cookie.
- **IDs:** UUIDs in paths.
- **Pagination:** `?page=&size=&sort=` → `{ content, page, size, totalElements, totalPages }`.
- **Errors (uniform):** `{ "timestamp", "status", "error": "<CODE>", "message", "fieldErrors": [...] }`.
- **Status codes:** `200/201/204` success; `400` validation; `401` unauthenticated; `403` authorization denied; `404` not found; `409` conflict; `429` rate-limited.
- **Public surface:** `/api/v1/public/**` and `/api/v1/auth/**` are unauthenticated; everything else requires a valid JWT, then a method gate.

## 2. JWT issuance & validation lifecycle

### 2.1 Tokens
- **Access JWT** — short-lived (**15 min**). Claims: `sub` (user id), `role` (`ADMIN`|`MEMBER`), `email`, `iat`, `exp`, `jti`. Signed HS256 (RS256 optional later). **Event-scoped roles are excluded** — resolved per request.
- **Refresh token** — opaque, long-lived (**7 days**), only its hash stored (`refresh_token` table). Rotated on every refresh.

### 2.2 Filter chain (Spring Security)
1. `JwtAuthenticationFilter` reads the access-token cookie, validates signature + `exp`, builds a `UserPrincipal`, and sets `Authentication` with authority `ROLE_<role>`.
2. `SessionCreationPolicy.STATELESS`; CSRF disabled (cookie auth is `SameSite=Strict`; see §7).
3. `authorizeHttpRequests`: `permitAll` for `/auth/**`, `/public/**`, `/actuator/health`; all else `authenticated()`.
4. Method security (`@EnableMethodSecurity`) runs `@PreAuthorize` gates on **service methods**.
5. `authenticationEntryPoint` → `401` JSON; `accessDeniedHandler` → `403` JSON.

### 2.3 Lifecycle flows
| Flow | Endpoint | Behavior |
|------|----------|----------|
| Login | `POST /auth/login` | verify BCrypt password, reject INACTIVE → set access + refresh cookies |
| Refresh (rotation) | `POST /auth/refresh` | validate refresh hash → revoke old, issue new pair; **reuse of a revoked token revokes the whole chain** |
| Logout | `POST /auth/logout` | revoke active refresh, clear cookies |
| Forgot password | `POST /auth/forgot-password` | issue OTP to Redis (TTL) — see [`04`](04-external-integrations.md) |
| Verify OTP | `POST /auth/verify-otp` | validate Redis OTP, return short-lived reset grant |
| Reset password | `POST /auth/reset-password` | consume reset grant, set new BCrypt hash, revoke all refresh tokens |

## 3. Authorization building blocks

- **Global gate:** `@PreAuthorize("hasRole('ADMIN')")`.
- **Self gate:** `@PreAuthorize("#userId == authentication.principal.id")`.
- **Event-scoped gates** (`@eventSecurity` bean — see [`01` §4.2](01-architecture-layout.md)):
  - `canManage(eventId, auth)` → Admin **or** MANAGER on that event.
  - `canView(eventId, auth)` → Admin **or** any assignment (MANAGER/HANDLER) on that event.
  - `canUpdateMaterial(materialId, auth)` → Admin, event MANAGER, **or** the Handler the material is assigned to.
- **Default-deny:** any authenticated endpoint lacking an explicit gate is a defect; an automated test asserts coverage.

## 4. REST API contract

### 4.1 Auth — `/auth/**` (public)
| Method | Path | Gate | Purpose |
|--------|------|------|---------|
| POST | `/auth/login` | public | issue tokens |
| POST | `/auth/refresh` | public (valid refresh cookie) | rotate tokens |
| POST | `/auth/logout` | authenticated | revoke refresh |
| POST | `/auth/forgot-password` | public | start OTP reset |
| POST | `/auth/verify-otp` | public | verify OTP → reset grant |
| POST | `/auth/reset-password` | public (valid grant) | set new password |

### 4.2 Users — `/users/**` (Admin-only CRUD)
| Method | Path | Gate |
|--------|------|------|
| GET | `/users` (list/search) | `hasRole('ADMIN')` |
| POST | `/users` | `hasRole('ADMIN')` |
| GET | `/users/{userId}` | `hasRole('ADMIN')` |
| PUT | `/users/{userId}` | `hasRole('ADMIN')` |
| DELETE | `/users/{userId}` | `hasRole('ADMIN')` — **Sub-admin forbidden** |
| GET | `/me` | authenticated |
| PUT | `/me` | `#userId == authentication.principal.id` |
| PUT | `/me/password` | self (requires current password) |

### 4.3 Organization — `/organization`
| Method | Path | Gate |
|--------|------|------|
| GET | `/organization` | authenticated |
| PUT | `/organization` | `hasRole('ADMIN')` — name/logo/banner |

### 4.4 Events & agenda — `/events/**`
| Method | Path | Gate |
|--------|------|------|
| GET | `/events` | authenticated (Admin: all; others: assigned only — service-scoped) |
| POST | `/events` | `hasRole('ADMIN')` |
| GET | `/events/{eventId}` | `@eventSecurity.canView(#eventId, authentication)` |
| PUT | `/events/{eventId}` | `@eventSecurity.canManage(#eventId, authentication)` |
| POST | `/events/{eventId}/publish` | `hasRole('ADMIN')` — Draft→Public |
| DELETE | `/events/{eventId}` | `hasRole('ADMIN')` — **Sub-admin forbidden** |
| POST | `/events/{eventId}/registration-qr/rotate` | `hasRole('ADMIN')` — new `registration_qr_token` (poster) |
| GET | `/events/{eventId}/registration-qr` | `@eventSecurity.canManage(...)` — **registration poster** QR (discovery only, not attendance) |
| GET | `/events/{eventId}/agenda` | `@eventSecurity.canView(...)` |
| PUT | `/events/{eventId}/agenda` | `@eventSecurity.canManage(...)` — apply template / reorder |
| GET | `/agenda-templates` | authenticated |

### 4.5 Event membership / delegation — `/events/{eventId}/assignments/**`
| Method | Path | Gate |
|--------|------|------|
| GET | `/events/{eventId}/assignments` | `@eventSecurity.canView(...)` |
| POST | `/events/{eventId}/assignments` (MANAGER) | `hasRole('ADMIN')` — appoint Sub-admin |
| POST | `/events/{eventId}/assignments` (HANDLER) | `@eventSecurity.canManage(...)` — add member/delegate handler |
| DELETE | `/events/{eventId}/assignments/{id}` | manage (MANAGER removal: Admin only) |

### 4.6 Main supply list — `/supply-items/**`
| Method | Path | Gate |
|--------|------|------|
| GET | `/supply-items` | authenticated (read) |
| POST | `/supply-items` | `hasRole('ADMIN')` |
| PUT | `/supply-items/{id}` | `hasRole('ADMIN')` |
| DELETE | `/supply-items/{id}` | `hasRole('ADMIN')` — **Sub-admin forbidden** |

### 4.7 Materials — `/events/{eventId}/materials/**`
| Method | Path | Gate |
|--------|------|------|
| GET | `/events/{eventId}/materials` | `@eventSecurity.canView(...)` |
| POST | `/events/{eventId}/materials` | `@eventSecurity.canManage(...)` |
| PUT | `/events/{eventId}/materials/{materialId}` | `@eventSecurity.canManage(...)` |
| PATCH | `/materials/{materialId}/status` | `@eventSecurity.canUpdateMaterial(#materialId, authentication)` |
| GET | `/materials/{materialId}/history` | `@eventSecurity.canView(material.eventId)` |
| DELETE | `/events/{eventId}/materials/{materialId}` | `@eventSecurity.canManage(...)` |

> `PATCH …/status` is the Handler's primary action — body `{ toStatus, note? }`; the service enforces the state machine ([`02` §5](02-database-schema.md)) and writes history.

### 4.8 Dynamic forms — `/events/{eventId}/form/**`
| Method | Path | Gate |
|--------|------|------|
| GET | `/events/{eventId}/form` | `@eventSecurity.canView(...)` |
| PUT | `/events/{eventId}/form` | `@eventSecurity.canManage(...)` — edit fields while DRAFT (pre-live) |
| POST | `/events/{eventId}/form/activate` | `@eventSecurity.canManage(...)` — requires a `phone` field |
| GET | `/events/{eventId}/submissions` | `@eventSecurity.canView(...)` — attendance/guest summaries |
| GET | `/events/{eventId}/submissions/export` | `@eventSecurity.canManage(...)` |

### 4.9 Public guest surface — `/public/**` (unauthenticated)
Guests **register only** here; they can never confirm their own attendance (that is an organizer scan, §4.10).

| Method | Path | Notes |
|--------|------|-------|
| GET | `/public/r/resolve?token={registrationQrToken}` | resolve an optional **poster** QR → event + active form schema (only if event PUBLIC + form ACTIVE) |
| GET | `/public/events/{slug}/form` | fetch active form schema |
| POST | `/public/events/{eventId}/register` | submit registration `answers` (`email` + `phone` required) → creates submission, generates `checkin_token`, **emails the QR ticket** to `guest_email` |
| GET | `/public/tickets/{checkinToken}` | guest views their ticket (QR shown on-screen + status `PENDING/DELIVERED/CHECKED_IN`) — token acts as the bearer secret |
| POST | `/public/tickets/{checkinToken}/resend` | re-send the QR ticket email (rate-limited) |

> Registration does **not** create an `event_checkin`. It mints the per-guest ticket and **emails the QR** to the address the guest registered with (see [`04` §2.1](04-external-integrations.md)); the response also returns the on-screen ticket page URL as an immediate fallback. Public endpoints verify event `status=PUBLIC` + form `status=ACTIVE`; otherwise `403/404`. Rate-limited (§7).

### 4.10 Attendance — organizer QR scan (authenticated)
The new check-in: an organizer scans the **guest's** QR at the venue.

| Method | Path | Gate |
|--------|------|------|
| POST | `/events/{eventId}/attendance/scan` | `@eventSecurity.canView(#eventId, authentication)` — any assigned staff (Admin/Manager/Handler) |
| POST | `/events/{eventId}/attendance/manual` | `@eventSecurity.canManage(#eventId, authentication)` — staff override without a QR |
| POST | `/events/{eventId}/tickets/{submissionId}/revoke` | `@eventSecurity.canManage(...)` — invalidate a ticket |
| GET | `/events/{eventId}/attendance` | `@eventSecurity.canView(...)` — live attendance list/counts |

> `scan` body is `{ checkinToken }`. The service resolves the token → submission, verifies it belongs to `#eventId`, is not `REVOKED`, and the check-in window is open; then creates the `event_checkin` (1:1 on submission) and flips `qr_status → CHECKED_IN`. A second scan returns `409 ALREADY_CHECKED_IN` with the original time. The scanning user is recorded as `scanned_by`. Successful confirmation triggers the outbound ops-channel Telegram push.

### 4.11 Telegram integration — `/integrations/telegram/**`
| Method | Path | Gate | Purpose |
|--------|------|------|---------|
| POST | `/events/{eventId}/telegram/test` | `@eventSecurity.canManage(...)` | send a test message to the ops channel |

> Telegram is now **outbound only** — there is no webhook. The bot's sole job is forwarding **registration and confirmed-attendance** events to the ops channel, fired automatically inside the respective services (not client-called). Per-guest QR delivery is by **email**, not Telegram (see [`04` §2.1](04-external-integrations.md)).

## 5. Representative payloads

**`PATCH /materials/{id}/status`**
```json
// request
{ "toStatus": "NEEDS_REVIEW", "note": "Ready for sign-off" }
// 200
{ "id": "…", "status": "NEEDS_REVIEW", "updatedAt": "…",
  "history": { "fromStatus": "IN_PROGRESS", "toStatus": "NEEDS_REVIEW", "changedBy": "…" } }
```

**`POST /public/events/{eventId}/register`** (guest registers → QR ticket emailed)
```json
// request
{ "answers": { "full_name": "Dara Sok", "email": "dara@example.com", "phone": "+855 12 345 678" } }
// 201
{ "submissionId": "…", "ticketStatus": "PENDING",
  "ticketUrl": "https://app.gatherly.example/tickets/tkt_9c1b…",
  "message": "Your QR ticket has been sent to dara@example.com. You can also view it at the link above." }
```

**`POST /events/{eventId}/attendance/scan`** (organizer scans guest QR)
```json
// request
{ "checkinToken": "tkt_9c1b…" }
// 201
{ "checkinId": "…", "guestName": "Dara Sok", "checkedInAt": "…",
  "ticketStatus": "CHECKED_IN", "scannedBy": "…", "telegramQueued": true }
// 409 on re-scan
{ "status": 409, "error": "ALREADY_CHECKED_IN",
  "message": "Guest already checked in at 2026-06-13T09:02:11Z." }
```

**`403` (sub-admin touching another event)**
```json
{ "timestamp": "…", "status": 403, "error": "FORBIDDEN",
  "message": "You are not assigned to manage this event." }
```

## 6. Error & status semantics

| Case | Code | `error` |
|------|------|---------|
| Validation / bad form answers | 400 | `VALIDATION_ERROR` (+ `fieldErrors`) |
| Missing/expired access token | 401 | `UNAUTHENTICATED` |
| Authenticated but gate denied | 403 | `FORBIDDEN` (never leak existence cross-event) |
| Unknown id / unresolvable QR token | 404 | `NOT_FOUND` |
| Duplicate (e.g. slug, assignment) | 409 | `CONFLICT` |
| Re-scan of an already-used ticket | 409 | `ALREADY_CHECKED_IN` |
| Scan of a revoked/closed-window ticket | 409 | `TICKET_INVALID` |
| Rate limit (login/OTP/public) | 429 | `RATE_LIMITED` |

> Frontend behavior on `401`: silent refresh-and-retry; if refresh fails → redirect to login.

## 7. Hardening

- **CSRF:** JWT in `SameSite=Strict` httpOnly cookies; if any state-changing request is cross-site-triggerable, add a double-submit CSRF token for cookie-auth mutations.
- **Rate limiting:** `/auth/login`, `/auth/forgot-password`, `/auth/verify-otp`, `/public/**` (registration), and `/public/tickets/{token}/resend` are rate-limited (Redis counters) to resist brute force / spam registrations / email-bombing.
- **QR ticket tokens:** `checkin_token` is high-entropy (≥128-bit), opaque, and single-use for attendance; resolved server-side only and treated as a bearer secret (anyone holding the QR/link can present the ticket, but confirmation still requires an authenticated organizer scan).
- **OTP:** Redis-only, hashed, single-use, capped attempts (TTL & limits in [`04`](04-external-integrations.md)).
- **Email:** QR/OTP emails sent only to the registered/on-file address; sending domain configured with SPF/DKIM/DMARC ([`04` §6](04-external-integrations.md)).
- **Audit:** log every `401`/`403` with `{user, route, eventId}`; material transitions recorded in history.
- **Secrets:** JWT secret, SMTP/email credentials, Telegram token, Rustfs keys, bootstrap Admin — all via env.

## 8. Test obligations (feed the future testing spec)

- Sub-admin of Event A → `403` on any Event B write; → `403` on delete user/event and supply-item delete.
- Handler → `403` updating a material not assigned to them; `PATCH status` succeeds only on assigned material and respects the state machine.
- Refresh rotation: reused refresh token revokes the chain.
- Public **registration** works only when event PUBLIC + form ACTIVE; rejects missing `email` or `phone`; creates a `PENDING` ticket and **emails the QR** (no `event_checkin` created).
- **QR delivery:** a successful registration sends the QR-ticket email and moves the ticket `PENDING → DELIVERED`; a mail failure leaves it `PENDING` and is retried (the on-screen ticket page still shows the QR).
- **Organizer scan:** assigned staff can scan; an unassigned user → `403`. Scanning a token from another event → `404/403`. First scan → `CHECKED_IN`; second scan → `409 ALREADY_CHECKED_IN`; revoked/closed-window → `409 TICKET_INVALID`. A `PENDING` (email-not-yet-delivered) ticket can still be scanned.
- OTP: expired/used/over-attempt codes rejected; successful verify yields a single-use reset grant.
