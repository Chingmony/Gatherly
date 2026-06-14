# Gatherly — Event Management Platform

Single-organization event platform with strict three-tier RBAC (Admin → Sub-admin → Handler,
plus public Guests), dynamic JSONB registration forms, per-guest QR tickets emailed to guests,
and organizer-scanned attendance forwarded to a Telegram ops channel.

The authoritative design lives in [`docs/`](docs/) (`00`–`13`). This README is the operational
quick-start; the specs are the contract.

## Monorepo layout

```
gatherly/
├── docs/                 # normative specifications (source of truth)
├── backend/              # Spring Boot 4.x, Java 21, Gradle (layered: Controller → Service → Repository)
├── frontend/             # Next.js 16 (App Router), React 19, TypeScript, Tailwind
├── docker-compose.yml    # local stack: postgres, redis, mailhog, minio, backend, frontend
└── .github/workflows/    # CI
```

## Status

**M0 — Foundations (walking skeleton).** Boots end-to-end: Postgres + Flyway migrations,
uniform error contract, stateless security baseline, `/actuator/health`, a public
`/api/v1/ping` endpoint, and a Next.js page that calls it. See the milestone roadmap in
[`docs/13`](docs/13-implementation-roadmap.md).

## Quick start (Docker)

```bash
cp .env.example .env          # adjust as needed; never commit a populated .env
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080/api/v1 |
| Health | http://localhost:8080/actuator/health |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| MailHog (QR/OTP emails) | http://localhost:8025 |
| MinIO console (Rustfs local) | http://localhost:9001 |

The M0 demo: open the frontend — it should show **Backend: connected** with the ping payload.

## Local development (without Docker)

**Backend** (needs JDK 21; the Gradle toolchain auto-provisions it on first build):
```bash
cd backend
./gradlew bootRun            # run (point DB_URL/REDIS_HOST at local services or compose)
./gradlew build              # compile + tests (Testcontainers needs a running Docker daemon)
./gradlew test --tests "com.gatherly.ping.PingControllerIT"   # single test
```

**Frontend** (Node 20+):
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev                  # http://localhost:3000
npm run build                # production build
npm run typecheck            # tsc --noEmit
npm run lint                 # eslint
npm test                     # vitest
```

> Backend integration tests use **Testcontainers** (real Postgres, never H2 — `docs/09`), so a
> running Docker daemon is required for `./gradlew test`.

## Security model (the central constraint)

Two layers (`docs/00` §5, `docs/03`): a **global role** from the JWT (`ADMIN`/`MEMBER`) and
**event-scoped** ownership resolved per-request via `@eventSecurity`. Event roles are never in
the token. Every non-public endpoint is gated; the RBAC matrix is the source of truth.
