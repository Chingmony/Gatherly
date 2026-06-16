---
paths:
  - "backend/**"
---

# Backend rules

Applies when working under `backend/` (Spring Boot 4.1.0, Java 21, Gradle 8.14 Groovy DSL). See `docs/06-backend-services-spec.md` and `docs/03-api-routes-security.md`.

> The cross-cutting **Three-tier RBAC** model and the **Critical gotchas** list remain canonical in `CLAUDE.md` — always-on. This file holds the day-to-day backend coding rules.

## Layering
- Strict layer contract: `Controller → Service → Repository` — no repository calls from controllers.
- Use **MapStruct** for DTO ↔ entity mapping; **Lombok** for entity/DTO boilerplate.

## Authorization
- All authorization is enforced via `@PreAuthorize` on **service methods** (not controllers) — this is the real authority.
- **Event-scoped roles are NOT in the JWT** — always check the `event_assignment` table via the `@eventSecurity` bean; never infer event role from the token. (JWT holds only the global role: `ADMIN` or `MEMBER`.)
- The role × action matrix (`docs/00-system-overview.md` §5) is release-blocking. Notably, `MANAGER` **cannot** delete users, events, or supply lists.

## Scheduled jobs
- Must be idempotent — use `SELECT … FOR UPDATE SKIP LOCKED` or **ShedLock** (already wired). Prevents double-send across multiple backend instances.

## Migrations
- Flyway runs on startup and **fails closed**. Files: `backend/src/main/resources/db/migration/`, named `V<n>__<desc>.sql`.
- **Expand/contract only** — no destructive changes in the same release.

## Commands (`backend/`)
- `./gradlew bootRun` (local dev) · `./gradlew build` · `./gradlew test` (JUnit 5 + Testcontainers)
- `./gradlew spotlessApply` (format) · `./gradlew spotlessCheck` (CI gate)