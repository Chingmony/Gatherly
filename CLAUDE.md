@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Gatherly is a single-organization event management platform with three-tier RBAC and guest check-in via unique QR tickets emailed at registration. The full specification lives in `docs/` (14 documents, `00`–`13`). **The docs are the source of truth** — always read the relevant spec before implementing a feature.

## Repository layout

The monorepo has frontend and backend code merged and actively developed (through ~M9). Layout:

```
gatherly/
├── docs/               # Architecture specs (source of truth)
├── frontend/           # Next.js 16 App Router
├── backend/            # Spring Boot 4.1.0
└── docker-compose.yml  # Postgres, Redis, MailHog, Rustfs
```

## Commands

### Backend (`backend/`)
```bash
./gradlew bootRun           # local dev
./gradlew build             # compile + test + package
./gradlew test              # JUnit 5 + Testcontainers
./gradlew spotlessApply     # format (run before committing)
./gradlew spotlessCheck     # format check (CI gate)
```

### Frontend (`frontend/`)
```bash
npm install
npm run dev                 # http://localhost:3000
npm run build               # = next build --webpack, standalone output
npm run lint                # ESLint (CI gate)
npm run format:write        # Prettier
npm run format:check        # Prettier check (CI gate)
tsc --noEmit                # type check (CI gate)
npm test                    # Vitest unit/component
npm run e2e                 # Playwright E2E
```

### Full stack
```bash
docker-compose up           # Postgres 16, Redis 7, MailHog, Rustfs (infra only; backend/frontend run locally)
```

Flyway migrations run automatically on backend startup. Files go in `backend/src/main/resources/db/migration/` named `V<n>__<desc>.sql`. Migrations are **expand/contract only** — no destructive changes in the same release.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Backend | Spring Boot 4.1.0, Java 21, Gradle 8.14 (Groovy DSL) |
| Frontend | Next.js 16 App Router, React 19, TypeScript 5 strict |
| UI | shadcn/ui + Tailwind CSS (no custom component lib) |
| Database | PostgreSQL 16 + JSONB (Flyway migrations) |
| Auth | JWT HS256 — 15-min access token, 7-day rotating refresh |
| OTP/cache | Redis 7 (hashed OTP + TTL expiry, rate limiting) |
| File storage | Rustfs S3-compatible — presigned PUT/GET URLs only, API never proxies binaries |
| Email | JavaMailSender + Thymeleaf HTML templates |
| Ops notifications | Telegram Bot API — outbound only, no webhook |

## Code style & conventions

Domain rules live in `.claude/rules/` (auto-loaded alongside this file):
- **`.claude/rules/git.md`** — branches, PRs, commit style, test-before-commit, merge-conflict policy (repo-wide)
- **`.claude/rules/frontend.md`** — Next.js/React/TS conventions (scoped to `frontend/`)
- **`.claude/rules/backend.md`** — Spring layering, authorization, jobs, migrations (scoped to `backend/`)

The cross-cutting RBAC model and critical gotchas below remain canonical here.

## Three-tier RBAC

Authorization uses two layers:

1. **Global role** (in JWT): `ADMIN` or `MEMBER`
2. **Event-scoped role** (in `event_assignment` table, checked per-request by `@eventSecurity` bean): `MANAGER` or `HANDLER`

Public unauthenticated users are treated as `GUEST` for public event registration only.

**`@PreAuthorize` on service methods is the real authority.** Next.js `middleware.ts` guards routes by global role for UX only.

The normative RBAC matrix is in `docs/00-system-overview.md` §5. The authorization matrix test suite is **release-blocking** — every role × action combination must pass.

Sub-admins (`MANAGER`) **cannot** delete users, events, or supply lists — this is a hard product requirement enforced by the test suite.

## Critical gotchas

1. **Event-scoped roles are not in the JWT** — always check `event_assignment` table via `@eventSecurity`, never infer from the token alone
2. **Dynamic form schema is JSONB** — validate server-side against the stored schema; `email` and `phone` are always required regardless of schema
3. **QR `checkin_token` is CSPRNG 128-bit** — render as PNG, send in transactional email, provide on-screen fallback
4. **Attendance scan is idempotent** — `UNIQUE(event_checkin.submission_id)` DB constraint prevents double check-in; concurrent race → `409 ALREADY_CHECKED_IN`
5. **Refresh token rotation** — invalidate the previous token on rotation to prevent reuse after compromise
6. **OTP stored hashed in Redis** — never store raw OTP; TTL is the sole expiry mechanism
7. **Rustfs presigned URLs** — API issues short-lived PUT/GET URLs; frontend uploads/downloads directly
8. **Third-party integrations (email, Telegram, Rustfs) are after-commit** — via `TransactionSynchronization`; failures do not roll back the DB transaction
9. **Flyway fails closed** — a failed migration halts backend startup
10. **Scheduled jobs need ShedLock from day one** — prevents double-send when running multiple backend instances
11. **Postgres** — Now hosted on `96.9.81.187:5434` (DB name is `gartherly`)

## Spec doc index

| # | Document | Read when… |
|---|----------|-----------|
| `02` | `database-schema.md` | designing tables, JSONB structures, indices |
| `03` | `api-routes-security.md` | implementing endpoints, JWT lifecycle, error codes |
| `05` | `frontend-spec.md` | Next.js routing, form builder/renderer, QR scanner |
| `06` | `backend-services-spec.md` | service layer, state machines, QR lifecycle, async |
| `07` | `validation-and-error-handling.md` | validation rules, uniform error contract |
| `09` | `testing-strategy.md` | test pyramid, Testcontainers, auth matrix, E2E |
| `13` | `implementation-roadmap.md` | M0–M10 milestones; MVP = M0–M7 |

## Git conventions

See `.claude/rules/git.md` (branches, PRs, commit style, test-before-commit, merge-conflict policy).

## Environment variables

Never committed. See `docs/04-external-integrations.md` for the full list. Required backend vars: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `REDIS_HOST`, `REDIS_PORT`, `SMTP_HOST`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `RUSTFS_ENDPOINT`, `RUSTFS_ACCESS_KEY`, `RUSTFS_SECRET_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_OPS_CHAT_ID`. Frontend: `NEXT_PUBLIC_API_BASE_URL`.
