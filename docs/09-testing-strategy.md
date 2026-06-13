# 09 — Testing Strategy

> **Status:** Draft · **Depends on:** all of `00`–`08`
> How we prove Gatherly is correct and safe. Authored against the `senior-qa` methodology (test pyramid, coverage-gap analysis, fixtures, CI gates).

---

## 1. Test pyramid

```
            ▲  few   E2E (Playwright)         — critical user journeys, real browser
            │        Integration (Testcontainers, MockMvc, Greenmail)
            │  many  Unit (JUnit5/Vitest)     — pure logic, fast
            ▼
```

Most coverage at the bottom (fast, deterministic), a focused set of integration tests for the wiring that matters (authz, persistence, JSONB, integrations), and a thin layer of E2E for the journeys a user actually performs.

## 2. Backend tests (JUnit 5 + Spring)

### 2.1 Unit (no Spring context)
- Material **state machine** legality + role rules ([`06` §5](06-backend-services-spec.md)).
- **Dynamic form validation** against schema fixtures: required/type/options/constraints, mandatory email+phone ([`07` §3](07-validation-and-error-handling.md)).
- `checkin_token` generation entropy/format; QR payload.
- Mappers (entity↔DTO), ensuring `password_hash` never maps out.

### 2.2 Integration (Spring + Testcontainers)
- **PostgreSQL Testcontainer** (real Postgres, real Flyway migrations) — never H2, so JSONB/GIN/`CHECK` constraints are exercised.
- **Redis Testcontainer** — OTP lifecycle + rate-limit counters.
- **Greenmail / MailHog** — assert QR-ticket + OTP emails are sent with the right recipient/content.
- Telegram + Rustfs **stubbed** (WireMock / local S3-compatible) — assert outbound calls and retry behavior; never hit real third parties.
- `@SpringBootTest` + `MockMvc` for controller→service→repo slices: status codes, error contract ([`07`](07-validation-and-error-handling.md)), pagination.

### 2.3 Authorization test matrix (security-critical — gates release)
Drives directly off the RBAC matrix ([`00` §5](00-system-overview.md)) and `@PreAuthorize` catalog ([`03` §6](03-api-routes-security.md)). For each protected operation × each role:

| Scenario | Expected |
|----------|----------|
| Admin on any event | allow |
| Sub-admin (MANAGER) on **own** event | allow |
| Sub-admin on **another** event | `403` |
| Handler updates **assigned** material | allow |
| Handler updates **unassigned** material | `403` |
| Sub-admin deletes user / event / supply item | `403` |
| Sub-admin edits org profile | `403` |
| Unauthenticated hits protected route | `401` |
| Guest registers on PUBLIC+ACTIVE event | allow |
| Guest registers on DRAFT / inactive form | `403`/`409` |

A parametrized test enforces **default-deny**: every controller method on a non-`/public`, non-`/auth` path must resolve to a gated service method (fails CI if a new endpoint ships ungated).

### 2.4 Domain/flow integration
- Registration → submission + `checkin_token` + email sent + `PENDING→DELIVERED`.
- Organizer scan → `event_checkin` created, `CHECKED_IN`; **second scan → `409 ALREADY_CHECKED_IN`** (idempotency via unique constraint, including a concurrent double-scan test).
- Revoked / closed-window ticket → `409 TICKET_INVALID`.
- OTP: request → verify → reset; expired/over-attempt rejected; refresh-token rotation reuse revokes the chain.

## 3. Frontend tests

- **Unit/component (Vitest + React Testing Library):** form-renderer drives off schema fixtures; `buildZodSchema` parity with backend rules; status badges; scanner result states; MSW mocks the API.
- **Accessibility:** `jest-axe`/`axe-playwright` on key screens; keyboard-navigation tests for the form builder and dialogs.
- **E2E (Playwright):**
  - Guest: open register → submit → ticket page shows QR + "emailed" message.
  - Organizer: login → scanner → scan valid QR (✓), scan again (already checked in), scan invalid (rejected).
  - Role gating: handler can't reach admin routes; sub-admin can't see another event.
  - Admin: build a form (add field) → activate (blocked without email+phone) → publish event.

## 4. Test data & fixtures

- **Backend:** builder helpers (`aUser().admin()`, `anEvent().published()`, `aSubmission()`); Flyway runs on the Testcontainer; per-test transactional rollback or schema reset.
- **Seed parity:** the seed migration (singleton org, default agenda templates, bootstrap admin) is covered by a smoke test.
- **Frontend:** JSON schema + submission fixtures shared with renderer tests; MSW handlers mirror the OpenAPI contract.

## 5. Coverage & quality gates (CI)

| Gate | Threshold |
|------|-----------|
| Backend line/branch coverage | ≥ 80% line, ≥ 70% branch (services/security higher) |
| Frontend coverage | ≥ 75% on `lib/` and renderer/builder |
| Authorization matrix suite | 100% pass (release-blocking) |
| Default-deny endpoint test | pass (release-blocking) |
| Lint/format/type | ESLint + Prettier + `tsc --noEmit`; Spotless/Checkstyle |
| Build | `./gradlew build` + `next build` green |

Coverage measured but not gamed — the authorization matrix and idempotency tests matter more than a raw %.

## 6. Non-functional testing

- **Load** (see [`11`](11-performance-and-scalability.md)): k6/Gatling on registration + scan bursts (door rush) to validate p95 and the idempotency path under concurrency.
- **Security:** dependency scanning (OWASP DC / `npm audit`), and the threat-model checks in [`10`](10-security-and-compliance.md); optional ZAP baseline against a staging deploy.

## 7. CI execution

- PR pipeline: unit + integration (Testcontainers) + lint + type + frontend unit; fast feedback.
- Pre-merge/nightly: full E2E (Playwright) against an ephemeral compose stack; load smoke; security scans.
- Details in [`12` §CI/CD](12-devops-and-deployment.md).

## 8. Open questions

- **Contract testing** (OpenAPI-driven) between FE and BE beyond generated types? *(Default: generated types + a schema-diff check in CI; full Pact later if teams split.)*
- **E2E email assertion** via MailHog API in Playwright? *(Default: yes for the QR-delivery journey.)*
