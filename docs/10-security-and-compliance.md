# 10 — Security & Compliance

> **Status:** Draft · **Depends on:** [`03`](03-api-routes-security.md) (authz), [`04`](04-external-integrations.md) (integrations), [`06`](06-backend-services-spec.md), [`08`](08-observability-and-operations.md)
> Threat model, hardening requirements, secrets, PII handling, and audit. Authored against the `senior-security` methodology (STRIDE threat modeling + DREAD-style risk rating).

---

## 1. Security objectives

1. **Strict RBAC, server-enforced** — the three-tier hierarchy and event-scoping can't be bypassed via the client ([`03`](03-api-routes-security.md)).
2. **Account & session integrity** — JWT + refresh rotation; OTP recovery resistant to brute force.
3. **Protect guest PII** — email + phone collected, emailed QR tickets, ops-channel forwarding all minimized and access-controlled.
4. **Tamper-evident operations** — privileged actions and attendance are auditable.
5. **Safe by default** — default-deny authz, least privilege, secrets out of code.

## 2. Trust boundaries & data flows

```
[Guest browser] ──public──▶ (B1) Public API (/public/**, /auth/**)
[Org user browser] ──JWT──▶ (B2) Authenticated API
                                    │
                          (B3) Service layer ──▶ PostgreSQL (PII at rest)
                                    ├──▶ Redis (OTP/rate-limit)
                                    ├──▶ Email/SMTP (PII in transit: QR + OTP)
                                    ├──▶ Telegram (PII to ops channel)
                                    └──▶ Rustfs (images)
```
Boundaries: **B1** untrusted public input; **B2** authenticated but role-varying; **B3** trusted internal but PII-bearing toward external integrations.

## 3. STRIDE threat model (per asset/flow)

| # | Threat (STRIDE) | Asset/flow | Mitigation |
|---|-----------------|------------|------------|
| T1 | **S**poofing | login / session | BCrypt passwords; signed JWT; httpOnly+Secure+SameSite cookies; refresh rotation + reuse detection |
| T2 | **S**poofing | Telegram webhook (n/a now) | webhook removed — Telegram outbound-only ([`04` §2.2](04-external-integrations.md)) |
| T3 | **T**ampering | JWT claims (role escalation) | server-signed token; signature verified each request; role re-derived, never trusted from client |
| T4 | **T**ampering | event-scoped access | every event/material op passes `@eventSecurity`; `eventId` ownership re-checked server-side, not from client filters |
| T5 | **T**ampering | QR ticket forgery | `checkin_token` = 128-bit CSPRNG, opaque, server-resolved; unknown tokens → 404 |
| T6 | **R**epudiation | "I didn't check them in" / status change | audit: `event_checkin.scanned_by`, `material_status_history`, privileged `audit_log` ([`08` §5](08-observability-and-operations.md)) |
| T7 | **I**nfo disclosure | guest PII (email/phone) | TLS in transit; least-exposure DTOs; PII masked in logs; ops-channel membership restricted; retention policy (§7) |
| T8 | **I**nfo disclosure | cross-event enumeration | cross-event requests return `403`/`404`, never "exists-but-forbidden"; UUID ids (non-enumerable) |
| T9 | **I**nfo disclosure | password hash / tokens | never serialized; refresh tokens stored hashed; OTP stored hashed in Redis |
| T10 | **D**oS | login/OTP/registration/resend abuse | Redis rate limits + cooldowns; CAPTCHA option on public register (§6) |
| T11 | **D**oS | email bombing via resend | per-token + per-IP resend throttle ([`03` §7](03-api-routes-security.md)) |
| T12 | **E**levation | sub-admin doing admin actions | Admin-only gates (`hasRole('ADMIN')`) on user/event delete, publish, org profile, supply-list |
| T13 | **E**levation | handler editing others' materials | `canUpdateMaterial` checks `assigned_to`; approvals restricted to manager/admin |
| T14 | **T**ampering | file upload abuse (Rustfs) | presign with content-type allowlist + size cap; server validates object on confirm ([`04` §4](04-external-integrations.md)) |
| T15 | **S**poofing | QR replay (used ticket) | single-use: `UNIQUE(event_checkin.submission_id)` → `409 ALREADY_CHECKED_IN` |

## 4. DREAD-style risk rating (top items)

Scored 1–3 (Damage, Reproducibility, Exploitability, Affected, Discoverability), higher = worse.

| Threat | D | R | E | A | Di | Total | Priority |
|--------|---|---|---|---|----|-------|----------|
| T4 event-scope bypass | 3 | 2 | 2 | 3 | 2 | **12** | Critical |
| T12 sub-admin elevation | 3 | 2 | 2 | 2 | 2 | **11** | Critical |
| T1 credential/session spoof | 3 | 2 | 2 | 2 | 1 | **10** | High |
| T5 QR forgery | 2 | 1 | 1 | 2 | 1 | **7** | Medium |
| T10/T11 DoS/abuse | 2 | 3 | 2 | 2 | 2 | **11** | High |
| T7 PII disclosure | 3 | 1 | 1 | 3 | 1 | **9** | High |

Criticals (T4, T12) are covered by the authorization test matrix ([`09` §2.3](09-testing-strategy.md)) as **release-blocking**.

## 5. Authentication & session hardening

- BCrypt (strength ≥ 10); generic `INVALID_CREDENTIALS` (no user-enumeration).
- Access JWT short-lived (15 min); refresh long-lived (7 d), **rotated**, hashed at rest, reuse ⇒ chain revoke.
- Cookies `httpOnly; Secure; SameSite=Strict`; access cookie path-scoped to API, refresh to the refresh endpoint.
- Logout + password reset revoke refresh tokens.
- OTP: 6-digit, hashed in Redis, single-use, TTL 300 s, ≤ 5 attempts, resend cooldown; forgot-password always returns `202` (no enumeration). Full lifecycle in [`04` §3](04-external-integrations.md).
- CSRF: `SameSite=Strict` mitigates; add double-submit CSRF token for cookie-auth mutations if any cross-site trigger path exists.

## 6. Input, abuse & transport

- **Validation** at every boundary ([`07`](07-validation-and-error-handling.md)); reject unknown JSONB keys; enforce field types/constraints.
- **Rate limiting** (Redis) on `/auth/login`, `/auth/forgot-password`, `/auth/verify-otp`, `/public/**` register, ticket `resend`.
- **CAPTCHA** (optional) on public registration if spam appears.
- **TLS everywhere**; HSTS at the edge; secure headers (CSP, X-Content-Type-Options, Referrer-Policy) on the frontend.
- **CORS** restricted to the known frontend origin with credentials.
- **SQL injection:** parameterized JPA/queries only; JSONB via bound params.
- **XSS:** React escaping by default; sanitize any rendered rich text; QR/email templates use safe interpolation.

## 7. Data protection & privacy (PII)

**PII inventory:**
| Data | Where | Sensitivity |
|------|-------|-------------|
| Guest email | `registration_submission.guest_email`, email channel | medium |
| Guest phone | `registration_submission.guest_phone`, Telegram ops channel | medium |
| Guest answers (JSONB) | `registration_submission.answers` | varies (admin-defined) |
| User email/phone/avatar | `user` | medium |

- **Minimization:** collect only what the admin's form needs; document why phone is required (check-in/ops).
- **In transit:** TLS to SMTP/Telegram/Rustfs/clients.
- **At rest:** rely on managed Postgres encryption-at-rest; secrets never in DB.
- **Access control:** ops Telegram channel membership restricted (PII visible there); admin-only exports.
- **Retention:** define a per-event retention window for submissions/check-ins (e.g. delete N days post-event) — *decision pending (§9)*; cascade deletes on event removal already defined ([`02` §3](02-database-schema.md)).
- **Right-to-erasure:** an admin action to delete a guest's submissions by email/phone (supports basic data-subject requests).

## 8. Secrets & supply chain

- All secrets via env / secret manager: JWT signing key, SMTP creds, Telegram bot token, Rustfs keys, DB creds, bootstrap admin. **Never** committed; rotated on schedule and on suspected compromise.
- Bootstrap admin credential injected at first deploy via env; force password change on first login.
- **Dependency scanning** in CI: OWASP Dependency-Check / `npm audit` / Gradle versions plugin; fail on high-severity CVEs.
- Pin versions; review transitive deps; (note: the team-shared `.claude/skills/` are third-party — review before trusting in CI).
- Container image scanning ([`12`](12-devops-and-deployment.md)).

## 9. Compliance posture & open questions

- Treat as **privacy-by-design**; if EU/▣ data subjects are in scope, align with GDPR basics (lawful basis = consent at registration; erasure; minimization). Confirm jurisdiction.
- **Open:** submission/check-in **retention window**? *(Default: 90 days post-event, then purge — confirm.)*
- **Open:** explicit **consent checkbox** required on every registration form? *(Default: yes — a required consent field template.)*
- **Open:** **CAPTCHA** on public registration from day one or only if abused? *(Default: ship without, add on signal.)*
- **Open:** field-level **encryption** for phone/email at rest beyond disk encryption? *(Default: no in v1; rely on managed encryption + access control.)*
