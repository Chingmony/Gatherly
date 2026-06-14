# CLAUDE.md

This file provides system architecture guidance, tech stack limits, and automation commands to Claude Code (`claude.ai/code`) inside this repository workspace.

## Repository Status & Source of Truth

Gatherly is in the **blueprint phase**: the repository currently contains only the architecture design specification files under the `docs/` directory. There is **no `frontend/`, `backend/`, or `docker-compose.yml` yet**. Those are described in the specifications but not implemented. Before writing code, you must read the relevant design specification. When implementing code blocks, you are creating the structure the specifications prescribe from scratch, not modifying pre-existing code layouts.

The markdown files under `docs/` are **normative and represent our absolute contract boundaries.** They cross-reference each other systematically — follow those document links explicitly rather than guessing parameters. If an implementation change contradicts a specification file, you must update the specification document first within the exact same Git transaction.

## The Product Scope

Gatherly is a single-organization event-management platform with a strict three-tier role hierarchy (Admin → Sub-admin → Handler, plus public Guests). Admins retain total control and delegate individual *events* to Sub-admins, who delegate *materials/tasks* to Handlers. Guests register for Public events via an admin-built dynamic form, receive a **unique single-use QR ticket by email**, and at the venue an organizer **scans** the QR to confirm attendance — each confirmation is forwarded to a Telegram ops channel. Out of scope for v1: multi-tenant SaaS architectures, external payments processing, native mobile clients, and third-party SSO providers.

## Core Architectural Directives (Read these first)

- **Two-layer Authorization Model:** Mapped out in `docs/00-system-overview.md` and `docs/03-api-routes-security.md`. Layer 1 resolves the global role flag from the JWT payload (`hasRole('ADMIN')`). Layer 2 handles event-scoped resource ownership parsed per-request from the database table via `@PreAuthorize("@eventSecurity.canManage(eventId, auth)")`. Event roles are transient and **never** stored inside the token payload. Every single non-public endpoint must be gated. The four core sub-admin restrictions (cannot delete user, cannot delete event, cannot delete main supply lists, cannot edit company profile) are absolute boundaries that must never be bypassed.
- **Backend Packaging Structure:** Enforce Layered Architecture (Controller → Service → Repository). Dependency flows point down exclusively. No business rule verification inside controllers; no web context leaks inside repositories. **Authorization logic gates and `@Transactional` scopes reside strictly inside the Service layer.** Package components by feature domains under `com.gatherly.*` (`user/`, `auth/`, `event/`, `material/`, `form/`, etc.).
- **Zero-Migration Forms:** Form structures are backed by **JSONB database fields**, never custom relational tables. Frontend components generically compile arrays from schemas using Zod validation. The backend maps payloads directly against the JSON configurations. `email` and `phone` values are persistently mandatory.
- **Idempotent Ticket Lifecycles:** Registration issues a cryptographically secure `checkin_token` dispatched via `EmailService`. Scanning is an authenticated operator control wrapper. Attendance checking is **strictly single-use**. Token duplication checks must catch concurrency door-rush races via an absolute unique database index constraint catching a `409 ALREADY_CHECKED_IN` event.
- **Direct-to-Storage Asset Streaming:** Binary files (logos, banners, avatars) never traverse or stream directly through the Java heap memory. The application endpoints dispense short-lived, presigned S3 URLs pointing to a **Rustfs** storage cluster. The client engine uploads straight to storage and commits the resulting resource asset pointer key back to the application data model.
- **Secure Redis Key Management:** Redis coordinates temporary, time-expiring user password reset OTP allocations. You must store a **cryptographic hash** of the OTP code, never the plaintext password string. Database invalidation hooks must purge keys immediately upon successful utilization or verification exhaustion limits.

## Locked Tech Stack & Environment Constraints

- **Backend:** Spring Boot 4.x, Java 21, **Gradle Build System** (wrapper required)
- **Security Layer:** Spring Security, stateless state engines, HTTP-Only SameSite cookie JWT transport
- **Database Layer:** PostgreSQL 16 (GIN indexing for JSONB), **Flyway database migrations**
- **Caching Layer:** Redis 7 (OTP validation lifetimes)
- **Frontend Engine:** Next.js 16 (App Router paradigm), React 19, TypeScript, **shadcn/ui layout primitives**, **Framer Motion animations**

## Developer Build and Test Commands

### Backend Commands
- Build and Verify Stack: `./gradlew build` (Runs compiler, Checkstyle analysis, and test hooks)
- Execute Local Integration Pipeline: `./gradlew test`
- Targeted Test Profiling: `./gradlew test --tests "com.gatherly.attendance.AttendanceServiceTest"`
- Boot Local Application Instance: `./gradlew bootRun`

### Frontend Commands
- Install Packages: `npm install`
- Structural Type-Check Validation: `tsc --noEmit`
- Linter Profiling Pipeline: `npm run lint`
- Local Test Runner Executions: `npx vitest`
- Isolated Target Test Profiles: `npx vitest run path/to/file.test.ts`
- Compile Production Bundles: `npm run build`
- Playwright E2E Runs: `npx playwright test`

## Test Matrix Gating Requirements

- **No H2 Database Engines Permitted:** All integration execution routines must wire into live **Testcontainers running native PostgreSQL/Redis images** to match functional payload expectations. Email dispatchers must run mock Greenmail validations.
- **Release-Blocking Assertions:** CI configurations will completely halt trunk merges if there is any regression in the **Authorization Matrix Engine** or if any endpoint fails the automated **Default-Deny parametrization suite**.
- **Coverage Budgets:** Backend classes must satisfy a floor of ≥80% logic line and ≥70% branch expression limits. Client modules require ≥75% analytical code depth.

## Vertical Execution Sequencing Rules

Code development is structured strictly around thin vertical milestone slices (Database Schema -> API endpoint contracts -> UI Interface pages). Do not compile broad horizontal structural code loops. 

The custom project skill command `/build-milestone <M0-M10>` reads your context variables, references structural documentation patterns from `docs/13-implementation-roadmap.md`, writes matching schema tables, secures routes, and generates localized unit test blocks.

**Branch Rule:** Because milestones can be built in parallel tracks, always verify you are executing features inside an isolated Git feature branch workspace before proposing structural code writing.