# 12 — DevOps & Deployment

> **Status:** Draft · **Depends on:** [`01`](01-architecture-layout.md) (repo layout), [`02`](02-database-schema.md) (Flyway), [`04`](04-external-integrations.md) (integration config), [`08`](08-observability-and-operations.md), [`10`](10-security-and-compliance.md)
> Build, containerization, CI/CD, environments, configuration/secrets, migrations, and release/rollback.

---

## 1. Repository & build

Monorepo ([`01` §2](01-architecture-layout.md)):
```
gatherly/
├── frontend/   # Next.js 16 — Node 20, pnpm/npm; `next build`
├── backend/    # Spring Boot 4.1.0 — Java 21, Gradle 8.14 (Groovy DSL); `./gradlew build`
├── docs/
├── .claude/skills/      # team-shared skills (review before trusting in CI — see 10 §8)
├── docker-compose.yml
└── .github/workflows/   # CI/CD pipelines
```
- **Backend:** Gradle **8.14** with the **Groovy** DSL (`build.gradle` / `settings.gradle`); wrapper committed (`gradle-wrapper.properties` pins 8.14). Spring Boot **4.1.0** on the Java **21** toolchain; produces an executable jar; Spring Boot Buildpacks or a Dockerfile for the image.
- **Frontend:** Node 20, lockfile committed; `next build` → standalone output for a slim runtime image.

## 2. Containerization

| Image | Base | Notes |
|-------|------|-------|
| `gatherly-backend` | eclipse-temurin:21-jre (distroless option) | non-root user; `JAVA_TOOL_OPTIONS` for container-aware heap; exposes 8080; healthcheck → `/actuator/health` |
| `gatherly-frontend` | node:20-slim (standalone) | non-root; exposes 3000; healthcheck → `/` |

- Multi-stage builds (build → slim runtime). Pin base image digests. Scan images in CI (Trivy/Grype) — fail on high CVEs ([`10` §8](10-security-and-compliance.md)).

## 3. Local development — `docker-compose.yml`

Services for a one-command local stack:
- `postgres:16` (volume), `redis:7`, **MailHog** (SMTP sink + web UI for QR/OTP emails), an **S3-compatible** store (MinIO) for Rustfs locally, plus `backend` and `frontend`.
- Telegram disabled locally (`TELEGRAM_ENABLED=false`) or pointed at a throwaway test channel.
- Backend waits for Postgres/Redis healthchecks; Flyway runs on boot.

## 4. Configuration & secrets

- **12-factor:** all config via environment variables; `application-{local,staging,prod}.yml` read from env (see [`01` §7](01-architecture-layout.md), [`04`](04-external-integrations.md) for the full catalog).
- **Secrets** (JWT key, SMTP, Telegram token, Rustfs keys, DB creds, bootstrap admin) come from a secret manager (cloud KMS/Secrets Manager/Vault) injected as env at runtime — **never** baked into images or committed.
- Feature flags: `EMAIL_ENABLED`, `TELEGRAM_ENABLED` per environment.
- Frontend public config (`NEXT_PUBLIC_*`) limited to non-secret values (API base URL, public asset base).

## 5. Database migrations (Flyway)

- Versioned SQL in `backend/src/main/resources/db/migration` (`V<n>__*.sql`), **forward-only** in shared envs ([`02` §8](02-database-schema.md)).
- Flyway runs automatically on backend startup; a **failed migration halts boot** (fail-closed) — the deploy stops rather than running on a half-migrated schema.
- **Expand/contract** for zero-downtime: additive change → deploy code that tolerates both → backfill → remove old in a later migration. No destructive change in the same release that depends on it.
- Seed migration (singleton org, default agenda templates, bootstrap admin) runs once; idempotent.

## 6. CI pipeline (`.github/workflows/ci.yml`)

On every PR:
1. **Backend:** `./gradlew build` → unit + integration (Testcontainers spin up Postgres/Redis) + Spotless/Checkstyle.
2. **Frontend:** install → `tsc --noEmit` → ESLint/Prettier → Vitest → `next build`.
3. **Authorization matrix + default-deny** suites must pass (release-blocking, [`09` §2.3](09-testing-strategy.md)).
4. **Security:** dependency scan (OWASP DC / `npm audit`), image scan on built images.
5. Artifacts: container images tagged with git sha.

Nightly/pre-release: full Playwright E2E against an ephemeral compose stack; load smoke ([`11` §8](11-performance-and-scalability.md)); ZAP baseline (optional).

## 7. CD & environments

| Env | Trigger | Purpose |
|-----|---------|---------|
| **Local** | developer | dev via compose |
| **CI** | PR | automated verification (ephemeral) |
| **Staging** | merge to `main` | auto-deploy; smoke + E2E; prod-like managed Postgres/Redis |
| **Production** | tag / manual approval | promote the staging-validated image |

- **Strategy:** rolling or blue-green (backend is stateless → easy). Health/readiness gates ([`08` §6](08-observability-and-operations.md)) control traffic shift.
- **Promote the same image** staging→prod (no rebuild); config differs by env only.

## 8. Release & rollback

- **Release:** tag → deploy backend (migrations apply, fail-closed) → deploy frontend → smoke check → shift traffic.
- **Rollback:** redeploy the previous image. Because migrations are **expand/contract**, the prior code runs against the new schema safely; never roll the DB backward — fix forward with a new migration if needed.
- Keep N previous images; document the one-command rollback in the runbook.

## 9. Backups & DR

- Managed Postgres automated backups + PITR; periodic restore drills.
- Redis is ephemeral (OTP/rate-limit/cache) — no backup needed; tolerate cold start.
- Rustfs: bucket versioning/replication per provider capability.
- Document RPO/RTO targets with ops.

## 10. Observability wiring

- Scrape `/actuator/prometheus`; ship JSON logs + OTLP traces to the chosen stack ([`08`](08-observability-and-operations.md)).
- Dashboards & alerts provisioned as code where possible.

## 11. Open questions

- **Hosting target** (managed K8s, ECS, Fly/Render, VMs)? *(Default: container platform with managed Postgres/Redis; decide per team ops.)*
- **Gradle image build** via Buildpacks vs Dockerfile? *(Default: Buildpacks for backend simplicity; Dockerfile if fine control needed.)*
- **Secret manager** choice tied to hosting. *(Default: the cloud-native one for the chosen platform.)*
