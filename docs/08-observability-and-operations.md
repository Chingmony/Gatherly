# 08 — Observability & Operations

> **Status:** Draft · **Depends on:** [`06`](06-backend-services-spec.md), [`07`](07-validation-and-error-handling.md), [`04`](04-external-integrations.md)
> Logging, metrics, tracing, audit, health, and operational runbooks so the system is debuggable and supportable in production.

---

## 1. Goals

- Any user-reported issue is traceable end-to-end via a single `traceId`.
- Operators can answer "is it healthy, is it fast, is it failing?" from dashboards, not log spelunking.
- Every privileged action and material/attendance change is attributable (audit).
- Integration failures (email, Telegram, Rustfs) are visible and self-healing where possible.

## 2. Structured logging

- **Format:** JSON logs (Logback + logstash encoder) — one event per line; ship to a central store.
- **Correlation:** an MDC `traceId` (and `spanId`) set by a request filter; propagated into async/post-commit tasks and included in the error contract ([`07` §2](07-validation-and-error-handling.md)).
- **Standard fields:** `timestamp, level, logger, traceId, userId (if auth), method, path, status, durationMs, message`.
- **Levels:** `INFO` for lifecycle/business events; `WARN` for handled anomalies (retry, denied); `ERROR` for unexpected failures with `traceId`; `DEBUG` off in prod.
- **Never log:** passwords, password hashes, raw OTP codes, JWTs/refresh tokens, full `checkin_token`s (log a prefix), or Rustfs secrets. Treat guest PII (email/phone) as sensitive — mask in non-essential logs.

## 3. Metrics (Micrometer → Prometheus)

| Metric | Type | Use |
|--------|------|-----|
| `http.server.requests` | timer (by route, status) | latency p50/p95/p99, error rate |
| `gatherly.registrations` | counter (by event) | demand/volume |
| `gatherly.checkins` | counter (by event, result) | attendance throughput, duplicate rate |
| `gatherly.qr_email.sent` / `.failed` | counter | delivery health |
| `gatherly.telegram.ops.sent` / `.failed` | counter | ops-forwarding health |
| `gatherly.otp.requested` / `.verified` / `.failed` | counter | auth-recovery health, abuse signal |
| `gatherly.retry_sweep.pending` | gauge | backlog of undelivered tickets/notifications |
| `jvm.*`, `hikaricp.connections.*`, `lettuce.*` | built-in | runtime/DB pool/Redis health |

Dashboards: API latency & error rate; registration→delivery funnel; check-in rate per event; integration failure counts; DB pool saturation.

## 4. Tracing

- OpenTelemetry (Micrometer Tracing) spans across controller → service → repository, plus spans for outbound email/Telegram/Rustfs/Redis calls.
- Export to an OTLP collector (Tempo/Jaeger). `traceId` shared with logs and the client error body for one-click pivot.

## 5. Audit logging (security/compliance overlap, see [`10`](10-security-and-compliance.md))

Distinct from app logs — an **append-only, queryable** record of who-did-what:
- **Material status changes** → persisted in `material_status_history` ([`02` §3.7](02-database-schema.md)) (actor, from→to, timestamp, note).
- **Attendance confirmations** → `event_checkin.scanned_by` + timestamp.
- **Privileged actions** (user CRUD, role changes, event publish/delete, supply-list mutation, sub-admin appointment, ticket revoke) → an `audit_log` stream (structured log channel and/or table) with `{actor, action, targetType, targetId, timestamp, traceId}`.
- Authentication failures and every `403` denial logged with `{userId, route, eventId}`.

## 6. Health & readiness

- `GET /actuator/health` (liveness) — public, shallow.
- `GET /actuator/health/readiness` — checks DB, Redis, and (degraded-tolerant) mail/Telegram/Rustfs reachability; gates load-balancer traffic.
- Integrations are **degraded-tolerant**: if Telegram/email is down, the app stays *ready* (core flows work; deliveries retry) — only DB/Redis outages mark it not-ready.
- `GET /actuator/info` exposes build/version (git sha) for support.

## 7. Alerting (suggested thresholds)

| Alert | Condition |
|-------|-----------|
| API error spike | 5xx rate > 2% over 5 min |
| Latency regression | p95 of key routes > 800 ms over 10 min |
| QR delivery failing | `qr_email.failed` rate > 10% or `retry_sweep.pending` rising 15+ min |
| Telegram backlog | `telegram.ops.failed` sustained, or `telegram_notified=false` backlog growing |
| DB pool exhaustion | Hikari active ≈ max, wait time climbing |
| OTP abuse | `otp.requested` spike from few IPs |
| Auth anomaly | surge in `INVALID_CREDENTIALS` / refresh-reuse revocations |

## 8. Operational runbooks (starter set)

- **QR emails not arriving:** check `qr_email.failed` + provider status; verify SPF/DKIM/DMARC; confirm sweep running; guests can still use the on-screen ticket page.
- **Telegram ops channel silent:** check `telegram.ops.failed`, bot token validity, chat id; backlog drains via sweep on recovery.
- **Check-in disputes:** query `event_checkin` + `material`/submission history by `guest_phone`/`checkin_token` prefix and `traceId`.
- **Refresh-token reuse detected:** chain auto-revoked ([`04`/`03`](03-api-routes-security.md)); advise user re-login; investigate source IP.
- **Migration failed on deploy:** Flyway halts startup; roll back deploy, fix migration, redeploy (see [`12`](12-devops-and-deployment.md)).

## 9. Open questions

- **Log/metrics/trace backend** — self-hosted (Loki/Prometheus/Tempo/Grafana) vs managed? *(Default: Grafana stack; revisit per ops capacity in [`12`](12-devops-and-deployment.md).)*
- **`audit_log` as a table** (queryable in-app by Admin) in addition to the log stream? *(Default: yes — a table for the privileged-action audit; admins may need to view it.)*
- **PII retention in logs** window? *(Default: mask in app logs; retention policy set in [`10`](10-security-and-compliance.md).)*
