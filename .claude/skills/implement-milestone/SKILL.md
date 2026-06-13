---
name: implement-milestone
description: Implements a Gatherly milestone (M0–M10) from the spec docs, following locked architectural decisions. Use when the user says "implement M<n>" or asks to start a milestone.
disable-model-invocation: false
---

When asked to implement a milestone, follow this process:

## Step 1: Read the milestone definition

Open `docs/13-implementation-roadmap.md` and find the milestone the user specified (M0–M10). Read its full scope: deliverables, vertical slices, and acceptance criteria.

## Step 2: Read the relevant spec docs

For each deliverable in the milestone, read the sections of `docs/` that cover it. Use the index in CLAUDE.md to pick the right docs. Always read:
- `docs/02-database-schema.md` for any new tables or JSONB structures
- `docs/03-api-routes-security.md` for new endpoints
- `docs/06-backend-services-spec.md` for service and state-machine logic
- `docs/05-frontend-spec.md` for new pages or components
- `docs/09-testing-strategy.md` for the test gates this milestone must satisfy

## Step 3: Confirm scope with the user

Before writing any code, summarize:
- What will be built (files, tables, endpoints, components)
- Which spec docs you read
- Any ambiguities or decisions not resolved by the specs

Ask the user to confirm before proceeding.

## Step 4: Implement in vertical slices

Implement one vertical slice at a time (DB migration → repository → service → controller → frontend). For each slice:
1. Write the Flyway migration first (if schema changes)
2. Implement backend top-down: entity → repository → service (with `@PreAuthorize`) → controller → DTO
3. Implement frontend: server component → client component if needed → Zod schema → React Hook Form
4. Write tests per `docs/09-testing-strategy.md`

## Locked decisions — never deviate from these

- Backend: Spring Boot 4.x, Java 21, Gradle, MapStruct, Testcontainers
- Frontend: Next.js 16 App Router, React 19, TypeScript strict, shadcn/ui, Tailwind, Zod, React Hook Form
- Auth: JWT HS256 (15-min access / 7-day rotating refresh), OTP hashed in Redis
- Authorization: `@PreAuthorize` on service methods is the authority — see `docs/00-system-overview.md` §5
- File storage: Rustfs presigned URLs — API never proxies binaries
- Migrations: Flyway, forward-only, expand/contract only
- Third-party calls (email, Telegram, Rustfs): after-commit via `TransactionSynchronization`

## After implementation

Run the relevant checks:
```bash
# Backend
./gradlew test
./gradlew spotlessCheck

# Frontend
tsc --noEmit
npm run lint
npm run format:check
npm test
```

If the milestone includes auth or RBAC changes, run `/check-rbac` to verify all `@PreAuthorize` gates match the authorization matrix.
