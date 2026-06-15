# 13 — Implementation Roadmap

> **Status:** Draft · **Depends on:** all of `00`–`12`
> The build order: how to turn these specs into working software as **vertical slices**, with a dependency graph, an MVP cut line, and a risk register. Authored against the `senior-architect` sequencing approach (thin end-to-end slices over horizontal layers).

---

## 1. Principles

- **Vertical slices, not horizontal layers.** Ship a thin DB→API→UI path for one capability before broadening — each milestone is demoable.
- **Walking skeleton first.** Stand up auth + one trivial end-to-end path before feature breadth, so integration risk is paid down early.
- **Security is in every slice**, not a later phase — each endpoint ships with its `@PreAuthorize` gate and an authorization test ([`09` §2.3](09-testing-strategy.md)).
- **Definition of Done** (every slice): spec-aligned · authz-gated · validated ([`07`](07-validation-and-error-handling.md)) · unit+integration tested · logged/audited where relevant · migration committed.

## 2. Dependency graph (what unblocks what)

```
M0 Foundations ─┬─▶ M1 Auth & Users ─┬─▶ M2 Org & Events ─┬─▶ M3 Delegation
                │                     │                    ├─▶ M4 Materials
                │                     │                    └─▶ M5 Dynamic Forms ─▶ M6 Registration+QR(email)
                │                     │                                                   └─▶ M7 Attendance (scan)
                └─────────────────────┴──────────────────────────────────▶ M8 Telegram ops / M9 Hardening / M10 Launch
```

## 3. Milestones

### M0 — Foundations (walking skeleton)
- Monorepo, Gradle + Next.js scaffolds, `docker-compose` (Postgres/Redis/MailHog/MinIO) ([`12` §3](12-devops-and-deployment.md)).
- Flyway `V1__init` for core tables ([`02`](02-database-schema.md)); JPA base entity + auditing; uniform error advice ([`07`](07-validation-and-error-handling.md)); health endpoints; CI skeleton ([`12` §6](12-devops-and-deployment.md)).
- **Demo:** app boots, `/actuator/health` green, one ping endpoint through FE.

### M1 — Auth & Users
- JWT issue/refresh-rotation/logout; Spring Security filter chain + method security; `EventSecurityService` skeleton ([`03`](03-api-routes-security.md), [`06`](06-backend-services-spec.md)).
- Forgot-password via Redis OTP + **Email** delivery ([`04` §2.1/§3](04-external-integrations.md)).
- **Admin user invite** (Add-User modal — name, email, role ∈ {`SUB_ADMIN`, `HANDLER`}, **no password**) → `UserCreatedEvent` → emailed **one-time invite code**; account is `PENDING_ACTIVATION` until activated ([`02` §5c](02-database-schema.md), [`06` §3a](06-backend-services-spec.md)). Account is global `MEMBER` + a `default_event_role` designation. User list columns: **Name · Email · Role · Active Status**. `/users` and `POST /users` gated `hasRole('ADMIN')`.
- Self-profile; bootstrap admin seed (created `ACTIVE`, env-injected — exempt from the invite flow).
- **Demo:** log in as admin, invite a user (no password), activate it by entering the emailed code on the login page → set password, then recover a password via emailed OTP. *(Authorization matrix tests start here.)*

### M2 — Organization & Events
- Org profile (Admin) + Rustfs presign upload for logo/banner ([`04` §4](04-external-integrations.md)).
- Event CRUD + scheduling (title/venue/description/start/end) + lifecycle `DRAFT→PUBLIC→ARCHIVED`; publish/archive/delete (Admin).
- **Event agenda** ([`02` §3.8](02-database-schema.md), [`03` §4.4](03-api-routes-security.md) "Events & agenda"): per-event `agenda_item` editing (`GET`/`PUT /events/{id}/agenda`, apply-template/reorder) + global `agenda_template` catalog (`GET /agenda-templates`). Event-scoped gates (`canView`/`canManage`); templates readable by any authenticated user.
- **Out of scope here (later slices):** members/delegation → M3; materials/tasks → M4; registration form → M5; guests/attendance → M6–M7.
- **Demo:** admin edits org branding, creates an event, schedules it, applies an agenda template, then publishes.

### M3 — Delegation (event-scoped roles)
- `event_assignment`: appoint sub-admin (Admin), add members/delegate handlers (manager); the two-layer authz fully exercised ([`03`](03-api-routes-security.md)).
- **Demo:** sub-admin manages their event only; blocked on others (403) and on delete-user/event/supply (403).
- **Status:** backend delivered early during the design build (P2): `EventAssignment` entity/repo/service, `GET/POST/DELETE /events/{id}/assignments`, and `EventSecurityService` now resolving real event roles from `event_assignment` (canView/canManage live). MANAGER appoint/remove are hard Admin-only; matrix covered by `AssignmentFlowIT`.

### M4 — Materials & workflow
- Main supply list (Admin); event materials; assignment; 5-state **state machine** + history ([`06` §5](06-backend-services-spec.md)).
- Handler "My Tasks" view + status controls.
- **Demo:** handler advances an assigned material; approval restricted to manager/admin; audit visible.

### M5 — Dynamic forms
- Form builder (JSONB schema, drag-reorder, required email+phone guard) + renderer ([`05` §5](05-frontend-spec.md), [`02` §6](02-database-schema.md)); activation rules.
- **Demo:** sub-admin builds a custom form, previews, activates.
- **Status:** backend delivered early during the design build (P3): `registration_form` JSONB service, `GET/PUT /events/{id}/form` + `POST .../activate` (server-enforced required email+phone), public `GET /public/events/{slug}/form`. `FormFlowIT` green.

### M6 — Registration + QR ticket (email)  ◀ core differentiator
- Public registration; server-side answer validation; `checkin_token` generation; **QR emailed** to guest + on-screen fallback; ticket page ([`06` §6](06-backend-services-spec.md), [`04` §2.1](04-external-integrations.md)).
- **Demo:** guest registers on a Public event, receives the QR by email (MailHog locally).
- **Status:** registration backend delivered early during the design build (P4): `registration_submission`, public `GET /public/events`, `POST /public/events/{id}/register` (validate vs schema, capacity + one-per-email, CSPRNG `checkin_token`, `PENDING`), `GET /public/tickets/{token}`, and organizer `GET /events/{id}/submissions` (Manage Guests, canView). `RegistrationFlowIT` green. **Deferred to a later slice:** QR-by-email delivery + the organizer scan (M7) — this slice shows the QR on-screen only.

### M7 — Attendance (organizer scan)  ◀ core differentiator
- Organizer QR scanner UI ([`05` §6](05-frontend-spec.md)); `AttendanceService.scan` idempotent via unique constraint; manual override; revoke; live attendance ([`06` §4](06-backend-services-spec.md)).
- **Demo:** organizer scans a guest QR → confirmed; re-scan → already-checked-in; revoked → invalid.

### M8 — Telegram ops forwarding
- Outbound registration/attendance push to ops channel; after-commit + retry sweep ([`04` §2.2](04-external-integrations.md), [`06` §7](06-backend-services-spec.md)).
- **Demo:** check-ins appear in the Telegram ops channel within seconds.

### M9 — Hardening & operations
- Rate limiting, secure headers/CORS, dependency+image scans ([`10`](10-security-and-compliance.md)); observability (metrics/logs/traces/dashboards/alerts) ([`08`](08-observability-and-operations.md)); load test the door-rush ([`11` §8](11-performance-and-scalability.md)); full E2E green ([`09`](09-testing-strategy.md)).

### M10 — Launch
- Staging→prod promotion, migration runbook, backups/DR drill, rollback rehearsal ([`12`](12-devops-and-deployment.md)); SPF/DKIM/DMARC on the sending domain; retention/consent decisions resolved ([`10` §9](10-security-and-compliance.md)).

## 4. MVP cut line

**MVP = M0–M7** (+ minimal M9 hardening). That delivers the full differentiated loop: create/publish event → build form → guest registers → QR emailed → organizer scans to confirm attendance, all under strict RBAC.

**Fast-follow:** M8 Telegram ops feed, richer observability, agenda templating polish, exports, i18n, offline scan queue (IndexedDB + background sync).

## 5. Cross-cutting workstreams (run continuously)

- **Testing** ([`09`](09-testing-strategy.md)) — authorization matrix + idempotency tests grow with each slice.
- **Security** ([`10`](10-security-and-compliance.md)) — gate + threat-model review per slice; criticals (event-scope bypass, sub-admin elevation) covered by blocking tests.
- **DevOps** ([`12`](12-devops-and-deployment.md)) — CI from M0; staging auto-deploy from M2.
- **Observability** ([`08`](08-observability-and-operations.md)) — structured logging from M0; metrics/alerts mature by M9.

## 6. Risk register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| Event-scope authz bypass | Critical | Med | Central `@eventSecurity`; default-deny + matrix tests (release-blocking) |
| QR email deliverability | High | Med | SPF/DKIM/DMARC; reputable relay; on-screen + resend fallback; retry sweep |
| Door-rush concurrency double check-in | High | Low | DB unique constraint guarantees idempotency; concurrency load test |
| Dynamic-form data integrity | Med | Med | Server-side schema validation; required email+phone at activation |
| Scope creep into multi-tenant | Med | Med | Single-org locked ([`00`](00-system-overview.md)); revisit only post-MVP |
| Third-party skills in repo (`.claude/skills`) | Med | Low | Review `SKILL.md`/scripts before trusting in CI ([`10` §8](10-security-and-compliance.md)) |
| Integration outages (email/Telegram/Rustfs) | Med | Med | Degraded-tolerant readiness; after-commit async + retries |

## 7. Sequencing summary

> Build the **walking skeleton (M0–M1)** first to retire integration risk, then move **left-to-right through the guest value loop (M2→M7)** — each milestone demoable and fully gated/tested — deferring the ops feed and deep hardening (M8–M10) until the differentiated core works end to end.
