# 06 — Backend Services Specification

> **Status:** Draft · **Depends on:** [`01`](01-architecture-layout.md) (packages), [`02`](02-database-schema.md) (entities), [`03`](03-api-routes-security.md) (endpoints/authz), [`04`](04-external-integrations.md) (email/Telegram)
> The service layer in detail: business rules, transaction boundaries, the security service, the material state machine, QR/ticket lifecycle, and scheduled jobs. Authored against `senior-backend` patterns (thin controllers, rich services, explicit transactions, idempotency).

---

## 1. Layering contract

```
Controller  →  Service  →  Repository  →  PostgreSQL
   (HTTP)      (rules,        (JPA)
                tx, authz)
                   │
                   ├─ EmailService / TelegramNotifier (after-commit, async)
                   ├─ QrService (render)
                   └─ EventSecurityService (authz checks)
```

- **Controller:** maps HTTP, validates request DTOs (`@Valid`), delegates to one service call, maps the result to a response DTO. No conditionals on business state.
- **Service:** owns `@Transactional` boundaries, business invariants, `@PreAuthorize` gates, and orchestration of side effects (email/Telegram) **after commit**.
- **Repository:** Spring Data JPA interfaces + custom queries (JSONB, event-scoped fetches with join-fetch to avoid N+1).
- **Mapping:** entity↔DTO via explicit mappers (MapStruct or hand-written); entities never serialized directly (no `password_hash`, no lazy-proxy leaks).

## 2. Transaction & side-effect rules

- One service method = one transaction (`@Transactional`); nested service calls join the same transaction.
- **External side effects never run inside the DB transaction.** Email sends and Telegram pushes are dispatched via `TransactionSynchronization` *after commit* (or an `@Async` task triggered post-commit) so a slow/failed integration can't roll back or block the user action.
- Reads use `@Transactional(readOnly = true)`.
- Idempotency for money-less but sensitive actions (attendance scan) is enforced by a DB unique constraint, not application checks alone (see §4).

## 3. Service catalog

| Service | Key responsibilities |
|---------|----------------------|
| `AuthService` | login, refresh-rotation, logout, forgot-password (OTP via Redis+Email), reset-password, **set-password (activation)** |
| `OtpService` | Redis OTP create/verify/consume ([`04` §3](04-external-integrations.md)) |
| `ActivationService` | mint / verify / consume the single-use set-password token (Redis, [`04` §3](04-external-integrations.md)) |
| `UserService` | global user **invite** (Admin, no password) + CRUD, self-profile, password change; publishes `UserCreatedEvent` |
| `OrganizationService` | singleton org profile; logo/banner key persistence (Rustfs presign in `StorageService`) |
| `EventService` | event CRUD, lifecycle `DRAFT→PUBLIC→ARCHIVED`, publish/delete (Admin), registration-QR token |
| `EventAssignmentService` | appoint sub-admin (Admin), add member/delegate handler (manager), revoke |
| `MaterialService` | material CRUD, assignment, **status transitions** (state machine §5), history writes |
| `SupplyItemService` | main supply list CRUD (Admin) |
| `RegistrationFormService` | build/edit JSONB schema (pre-live), activate (requires email+phone fields) |
| `RegistrationService` | public submit → validate vs schema → create submission + `checkin_token` → emit QR email + ops push |
| `AttendanceService` | organizer scan → `event_checkin` (idempotent), manual override, revoke, live attendance |
| `QrService` | generate QR PNG from `checkin_token` |
| `StorageService` | Rustfs presign (purpose-scoped authz), object validation |
| `EmailService` | QR-ticket + OTP transactional emails (templates) |
| `TelegramNotifier` | ops-channel forwarding (registration/attendance) |
| `DashboardService` | Admin Command Center aggregate (Admin-only, read-only) — lifecycle counts, registration momentum, bounded event-control feed (§11) |

## 3a. User invite → activation (worked example)

`UserService.invite(fullName, email, role)` — `@PreAuthorize("hasRole('ADMIN')")`:
```
@Transactional
1. assert email not already in use                         else 409 CONFLICT
2. role ∈ { SUB_ADMIN, HANDLER }                            else 400 VALIDATION_ERROR
3. user = save(User{ fullName, email,
        globalRole = MEMBER,                                // never ADMIN via this form
        defaultEventRole = (role==SUB_ADMIN ? MANAGER : HANDLER),
        passwordHash = null,
        status = PENDING_ACTIVATION })
4. publishEvent(new UserCreatedEvent(user.id))
5. commit
6. AFTER COMMIT (@TransactionalEventListener / @Async):
       token = ActivationService.mint(user.id)              // CSPRNG; Redis setpw:{hash}=userId, TTL
       EmailService.sendActivation(user, token)             // link to /auth/set-password?token=…
return UserResponse{ …, role(display), status=PENDING_ACTIVATION }
```

`AuthService.setPassword(token, newPassword)` — public:
```
@Transactional
1. userId = ActivationService.verify(token)                 ; if null → 404/409 (invalid/expired)
2. user = load(userId); assert status == PENDING_ACTIVATION else 409 CONFLICT (already active)
3. user.passwordHash = bcrypt(newPassword); user.status = ACTIVE
4. ActivationService.consume(token)                          // single-use
5. commit
```
- **No Admin-set passwords:** the Admin never knows or sets another user's secret; activation is user-driven.
- **Token safety:** high-entropy, single-use, time-expiring ([`04` §3](04-external-integrations.md)); resolved server-side; the email send happens after commit so a mail failure can't roll back user creation (retry sweep re-sends stuck invites, §7).

## 4. Attendance scan — idempotent, replay-safe (worked example)

`AttendanceService.scan(eventId, checkinToken, scanner)`:
```
@Transactional
1. submission = submissionRepo.findByCheckinToken(token)            ; if null → 404 NOT_FOUND
2. if submission.eventId != eventId                                  → 404 (don't leak)
3. if submission.qrStatus == REVOKED                                 → 409 TICKET_INVALID
4. if !withinCheckinWindow(event)                                    → 409 TICKET_INVALID
5. try:
       checkinRepo.save(EventCheckin{ submissionId, eventId,
            scannedBy=scanner.id, guestName, guestPhone, source=QR_SCAN, checkedInAt=now })
       submission.qrStatus = CHECKED_IN
   catch DataIntegrityViolation (UNIQUE submission_id):              → 409 ALREADY_CHECKED_IN
6. commit
7. AFTER COMMIT → TelegramNotifier.opsCheckin(checkin)               (async, best-effort)
return CheckinResult
```
- **Race safety:** the `UNIQUE(event_checkin.submission_id)` constraint ([`02` §3.11](02-database-schema.md)) is the source of truth — two simultaneous scans can't both succeed; the loser maps to `409 ALREADY_CHECKED_IN`.
- **Authorization:** gated by `@PreAuthorize("@eventSecurity.canView(#eventId, authentication)")` — any assigned staff (Admin/Manager/Handler) may scan.

## 5. Material state machine (enforcement)

States: `PENDING, IN_PROGRESS, NEEDS_REVIEW, DONE, ISSUE` ([`02` §5](02-database-schema.md)). `MaterialService.changeStatus(materialId, toStatus, note, actor)`:
```
@Transactional
@PreAuthorize("@eventSecurity.canUpdateMaterial(#materialId, authentication)")
1. m = load(materialId)
2. assert isLegalTransition(m.status, toStatus)        else 409 ILLEGAL_TRANSITION
3. assert handlerAllowed(actor, m, toStatus)           // handler can move own; approvals (→DONE) need manager/admin
4. from = m.status; m.status = toStatus
5. historyRepo.save({materialId, from, to=toStatus, changedBy=actor.id, note})
6. commit
```
- A transition table (`Map<Status, Set<Status>>`) defines legality; approvals (`NEEDS_REVIEW→DONE`, reopen `DONE→*`) restricted to event MANAGER/Admin even though a handler passed the `canUpdateMaterial` gate — enforced in step 3.
- Every transition is audited (`material_status_history`), satisfying real-time visibility + traceability.

## 6. Registration → QR ticket (worked example)

`RegistrationService.register(eventId, answers)`:
```
@Transactional
1. event = load(eventId); assert event.status == PUBLIC          else 403/404
2. form  = activeFormFor(event);  assert form != null            else 409 NO_ACTIVE_FORM
3. validateAnswers(answers, form.schema)                          // 07 validation; 400 on failure
4. checkinToken = secureRandom(32 bytes, base64url)
5. submission = save(RegistrationSubmission{ eventId, formId, answers,
        guestEmail=answers.email, guestPhone=answers.phone,
        checkinToken, qrStatus=PENDING, formVersion=form.version })
6. commit
7. AFTER COMMIT (async):
       png = QrService.render(checkinToken)
       EmailService.sendQrTicket(submission, png)  → on success submission.qrStatus=DELIVERED, qrDeliveredAt=now
       TelegramNotifier.opsRegistered(submission)
return { submissionId, ticketUrl }
```
- Token generation uses a CSPRNG; `checkin_token` is treated as a bearer secret ([`10`](10-security-and-compliance.md)).
- Email/Telegram failures don't fail registration; retried by sweeps (§7).

## 7. Scheduled jobs (`@Scheduled`)

| Job | Cadence | Action |
|-----|---------|--------|
| QR-email retry sweep | every 1–2 min | re-send tickets stuck in `PENDING` past a grace window; flip to `DELIVERED` on success; cap attempts |
| Telegram ops retry sweep | every 1–2 min | re-push rows with `telegram_notified=false`; flip on success |
| Refresh-token cleanup | hourly | delete expired/revoked `refresh_token` rows |
| (Optional) event auto-archive | daily | move long-past `PUBLIC` events to `ARCHIVED` |

- Jobs are **idempotent** and safe under multiple instances (use `SELECT ... FOR UPDATE SKIP LOCKED` or ShedLock to avoid double-send across a horizontally-scaled deployment — see [`11`](11-performance-and-scalability.md)).

## 8. Repository patterns

- **Avoid N+1:** list endpoints use `@EntityGraph`/`join fetch` (e.g. event + assignments, material + assignee).
- **Event-scoped queries:** repositories accept `eventId` and the caller's identity is checked by the service gate, not by trusting client filters.
- **JSONB:** native queries with `@>` containment for attendee discovery; GIN-indexed ([`02` §7](02-database-schema.md)).
- **Pagination:** `Pageable` everywhere a collection can grow (users, submissions, materials, attendance).

## 11. Dashboard aggregation — Command Center (worked example)

`DashboardService.commandCenter()` powers the Admin **Command Center** ([`05` §7](05-frontend-spec.md)). Admin-only, `@Transactional(readOnly = true)`, gate on the service method.

- **Lifecycle** counts (`draft` / `live` / `completed=ARCHIVED`) come from **one grouped DB count** over all events — correct regardless of the row cap below.
- **Registration momentum** is org-wide: `count(submissions)`, `count(qr_status=CHECKED_IN)`, and `sum(capacity)` (capacity-`null` = unlimited, excluded) → `fillPct` clamped to 100.
- **Event Control feed** is **bounded** (`≤200`, most-recent-first) so the dashboard never scans unbounded ([`11`](11-performance-and-scalability.md)). Per-event registration counts, check-in counts, and managers (first `MANAGER` assignment) are each **one batched query** over the row set — **no N+1** — and manager display names are batch-loaded by id.
- **`materialHealth` + `critical`** are backed by the material/task domain (§5) — returned as `null`/empty until it lands; the client renders an explicit "not tracked yet" state (never fabricated numbers; the API is the source of authority, [`05` §1](05-frontend-spec.md)).

## 9. Configuration & beans

- `SecurityConfig` (filter chain, method security), `RedisConfig`, `MailConfig` (JavaMailSender), `RustfsConfig` (S3 client), `AsyncConfig` (task executor for post-commit side effects), `JacksonConfig` (JSONB/`JsonNode` mapping, `Instant` serialization).
- `EventSecurityService` registered as `@eventSecurity` for SpEL in `@PreAuthorize` ([`03` §3](03-api-routes-security.md)).

## 10. Open questions

- **MapStruct vs manual mappers?** *(Default: MapStruct for boilerplate, hand-written for sensitive projections.)*
- **ShedLock for scheduled jobs** now or only when scaling >1 instance? *(Default: add ShedLock from the start — cheap insurance.)*
- **QR library** choice (ZXing vs Nayuki)? *(Default: ZXing — mature, well-supported.)*
