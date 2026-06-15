# 14 — Runbooks & Launch (M10)

> **Status:** Draft · **Depends on:** [`08`](08-observability-and-operations.md) (ops), [`10`](10-security-and-compliance.md) (security/PII), [`12`](12-devops-and-deployment.md) (deploy)
> Operational runbooks and the launch checklist for promoting Gatherly to production. The M9 code-side
> hardening (rate limiting, secure headers, `audit_log`, structured logging, ShedLock, metrics,
> retention purge, right-to-erasure) lands in the backend; this file covers the **ops/launch** layer.

---

## 1. Environments & promotion

`.github/workflows/deploy.yml` builds immutable images on a `vX.Y.Z` tag, deploys to **staging**,
then promotes the **same images** to **production** behind a manual-approval gate (GitHub Environment
required reviewers). Never rebuild between staging and prod — promote the artifact that passed.

```
tag vX.Y.Z ─▶ build+push images ─▶ deploy staging ─▶ smoke test ─▶ [approval] ─▶ promote prod ─▶ smoke test
```

## 2. Migration runbook (Flyway)
- Migrations are **forward-only**; Flyway runs on app startup and a **failed migration halts boot**
  (fail-closed, docs/12 §5) — a bad migration stops the rollout rather than corrupting data.
- Before promoting: review the new `V*.sql` on staging; confirm `flyway_schema_history` is clean.
- If a migration fails on deploy: the new instances won't become ready; the LB keeps serving old
  instances. Roll back the deploy (§4), fix the migration, re-cut the tag, redeploy.
- Never edit an applied migration — add a new one.

## 3. Backup & DR drill
- **Postgres:** managed automated daily snapshots + PITR (WAL). Verify retention ≥ 30 days.
- **Restore drill (quarterly):** restore the latest snapshot into a scratch instance, run
  `flyway info`, boot the app against it, confirm `/actuator/health/readiness` is UP. Record RTO/RPO.
- **Redis:** ephemeral (OTP/rate-limit/locks) — no backup needed; a cold Redis only forces re-auth
  flows and a one-tick ShedLock gap, both safe.
- **Object store (Rustfs/S3):** enable bucket versioning; images are referenced by key in Postgres.

## 4. Rollback rehearsal
- Re-run `deploy.yml` via `workflow_dispatch` pinned to the **previous green tag** — images are
  immutable so this is deterministic.
- DB: forward-only means rollback = redeploy old app against the current schema; ensure the previous
  app version tolerates the newer schema (additive migrations make this safe). For destructive
  changes, gate behind a follow-up migration after the old version is fully drained.
- Rehearse on staging before every major release.

## 5. Email deliverability (SPF / DKIM / DMARC)
Required before launch so OTP + QR-ticket mail isn't spam-foldered (docs/08 §8):
- **SPF:** TXT on the sending domain authorizing the relay, e.g. `v=spf1 include:<relay> -all`.
- **DKIM:** publish the relay's public key at `<selector>._domainkey.<domain>`; enable signing.
- **DMARC:** start `v=DMARC1; p=none; rua=mailto:dmarc@<domain>` (monitor), then tighten to
  `p=quarantine` → `p=reject` once SPF+DKIM align. Watch aggregate reports.

## 6. Operational runbooks (ties to docs/08 §8)
- **QR emails not arriving:** check `gatherly.qr_email.failed` + `gatherly.retry_sweep.pending`;
  verify SPF/DKIM/DMARC (§5) and relay status; guests can still use the on-screen ticket page.
- **Telegram ops channel silent:** check `gatherly.telegram.ops.failed`, bot token + chat id; backlog
  drains via the (ShedLock-guarded) sweep on recovery.
- **Rate-limit false positives:** a shared NAT can trip per-IP limits; check `429` logs by IP and
  tune `gatherly.rate-limit.*`.
- **Check-in disputes:** query `event_checkin` + `audit_log` (e.g. `TICKET_REVOKED`) and the ticket's
  `revoked_by`/`revoked_at` by `guest_phone` / `checkin_token` prefix and `traceId`.
- **Migration failed on deploy:** see §2.

## 7. Launch checklist
- [ ] Secrets set in prod env/secret-manager (JWT key, SMTP, Telegram, Rustfs, DB) — none in code.
- [ ] Bootstrap admin injected; force password change on first login.
- [ ] SPF/DKIM/DMARC published and aligned (§5).
- [ ] CI green incl. dependency-scan + image-scan (Trivy) — no HIGH/CRITICAL (docs/10 §8).
- [ ] Authorization-matrix + default-deny suites green (release-blocking, docs/09 §2.3).
- [ ] Door-rush load test within thresholds (`loadtest/`, docs/11 §8).
- [ ] Observability live: dashboards (API latency/error, registration→delivery funnel, check-in rate),
      alerts wired (docs/08 §7), JSON logs shipping with `traceId`.
- [ ] Backup verified via restore drill (§3); rollback rehearsed (§4).
- [ ] Retention purge + right-to-erasure confirmed on staging (docs/10 §7).
- [ ] `/actuator/info`, `/actuator/prometheus`, Swagger locked down (M9); only health public.
