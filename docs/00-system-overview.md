# 00 — System Overview

> **Project:** Gatherly — Event Management Platform
> **Status:** Draft (blueprint) · **Audience:** All contributors
> This is the north-star document. `01`–`04` refine the architecture, schema, API, and integrations described here.

---

## 1. Product vision

**Gatherly** streamlines the full lifecycle of an event — proposal, material/task preparation, and guest coordination — under a strict, auditable three-tier role hierarchy. An Admin holds full control and delegates the running of individual events to Sub-admins, who in turn assign concrete tasks to Handlers. When a guest registers, the system issues them a **unique personal QR ticket delivered to their email**; at the venue, an **organizer scans that QR to confirm attendance**, and the confirmation is forwarded in real time to a Telegram operations channel.

The product optimizes for **clear delegation boundaries** (who can do what, on which event, is never ambiguous) and **dynamic, zero-migration registration forms**.

## 2. Feature scope (v1)

| Area | Capability |
|------|-----------|
| **RBAC** | Three tiers: Admin, Sub-admin, User/Handler (+ public Guests). Method-level enforcement. |
| **Profiles** | One global Organization Profile (Admin-only): company name, logo, background banner. Personal profiles for all members. |
| **Events & agendas** | Event initiation with built-in default **agenda templates**; lifecycle `Draft → Public` (Public activates guest registration). |
| **Materials** | Items/tasks tracked across 5 states `[Pending, In Progress, Needs Review, Done, Issue]`, assignable to Handlers, with audit history. |
| **Dynamic forms** | Admins/Sub-admins fully build, update, and reorder registration form fields **before** an event goes live (JSONB-backed). |
| **Per-guest QR ticket** | On successful registration, the system generates a **unique QR ticket per guest** and **emails it** to the address they registered with (with an on-screen fallback). |
| **Organizer-scanned attendance** | At the venue, an organizer (assigned event staff) **scans the guest's QR** to confirm attendance — single-use, replay-safe. |
| **Email** | Delivers each guest their unique QR ticket; also delivers password-reset OTP codes. Guest **email** and **phone** are both collected at registration. |
| **Telegram** | Forwards registration/attendance confirmation to a dedicated ops channel/bot (real-time staff visibility). |
| **Auth security** | JWT session management; **Forgot Password** via **OTP** (Redis, time-expiring; delivered by email). |
| **File storage** | Profile pictures, org logo, and banners hosted on a **Rustfs** cluster. |

### Out of scope (v1)
- Multi-organization / true multi-tenant SaaS (architecture is **single-org, event-scoped**).
- Payments / ticketing.
- Native mobile apps (organizer QR scanning is web/camera-based).
- Third-party SSO / external IdP (auth is first-party JWT + OTP).

## 3. Personas

| Persona | Tier | Does | Cannot |
|---------|------|------|--------|
| **Admin** (Super Admin) | Global | Propose/approve events; global user CRUD; create/assign materials; appoint Sub-admins; design forms; create/edit/publish/**delete** any event, schedule, supply list; edit org profile | — (full control) |
| **Sub-admin** | Event-scoped manager | Assist on **assigned** events: track guest attendance, update event details, add event members, delegate Handlers, build forms | **Delete users, delete events, delete main supply lists** |
| **User / Handler** | Event-scoped executor | Update status/progress of **assigned** materials; view event details, guest summaries, supply lists; **scan guest QR to confirm attendance** at the venue | Create/delete events, forms; edit others' materials |
| **Guest** | Public (unauthenticated) | Register for a Public event (provides email + phone); receive a unique QR ticket by email; present it for scanning | Any authenticated action; self-check-in |

## 4. User stories

### Admin
- *As an Admin, I propose and approve an event so the organization can begin planning.*
- *As an Admin, I invite a new member by email — choosing a Sub-admin or Handler designation, with no password — so they activate their own account via an emailed set-password link.*
- *As an Admin, I appoint a Sub-admin to an event so its day-to-day running is delegated without surrendering global control.*
- *As an Admin, I design a custom registration form so each event collects exactly the attendee data it needs.*
- *As an Admin, I edit the organization profile (name, logo, banner) so branding is consistent.*
- *As an Admin, I publish an event so guest registration and QR-ticket issuance go live.*

### Sub-admin
- *As a Sub-admin, I update details and add members for my assigned event so it stays current.*
- *As a Sub-admin, I delegate materials to Handlers so responsibility is explicit.*
- *As a Sub-admin, I track guest attendance in real time so I know turnout.*
- *As a Sub-admin, I must be blocked from deleting users, events, or the main supply list so destructive global actions stay with the Admin.*

### Handler
- *As a Handler, I see only the materials assigned to me so my view is focused.*
- *As a Handler, I move a material from "In Progress" to "Needs Review" so my work can be checked.*
- *As a Handler, I flag an "Issue" with a note so blockers are visible in real time.*

### Organizer (Admin / Sub-admin / Handler at the venue)
- *As an organizer, I open the scanner and scan a guest's QR ticket to confirm their attendance instantly.*
- *As an organizer, when I scan a QR that was already used, I see a clear "already checked in" result with the original time, so duplicates are caught.*

### Guest
- *As a Guest, I register for an event with my email and phone so I can attend.*
- *As a Guest, I receive my unique QR ticket by email so I always have it on my phone.*
- *As a Guest, I present my QR at the door and an organizer scans it to confirm my attendance.*

### Cross-cutting
- *As any user, I recover access via a Forgot-Password flow using a one-time code (OTP) emailed to me.*
- *As the operations team, every registration and confirmed attendance appears in our Telegram channel instantly.*

## 5. RBAC security matrix (normative)

Legend: **✓** allowed · **own** only for events the user is assigned to (Sub-admin = MANAGER) · **assigned** only materials assigned to them · **self** only their own record · **—** denied. This matrix is the source of truth for the `@PreAuthorize` mappings in [`03-api-routes-security.md`](03-api-routes-security.md).

| Action | Admin | Sub-admin | Handler | Guest |
|--------|:-----:|:---------:|:-------:|:-----:|
| Login / refresh / logout | ✓ | ✓ | ✓ | — |
| Forgot-password / OTP verify | ✓ | ✓ | ✓ | — |
| Edit own profile / password | self | self | self | — |
| **Global user CRUD** | ✓ | — | — | — |
| Appoint / assign global role | ✓ | — | — | — |
| View org profile | ✓ | ✓ | ✓ | — |
| **Edit org profile (logo/banner/name)** | ✓ | — | — | — |
| Propose / create event | ✓ | — | — | — |
| Approve / publish (Draft→Public) event | ✓ | — | — | — |
| **Delete event** | ✓ | — | — | — |
| Edit event details | ✓ | own | — | — |
| Appoint Sub-admin to event | ✓ | — | — | — |
| Add event member / delegate Handler | ✓ | own | — | — |
| View event dashboard / details | ✓ | own | assigned | — |
| Manage agenda (from templates) | ✓ | own | — | — |
| **Main supply list — create/edit/delete** | ✓ | — | — | — |
| Supply list — read | ✓ | ✓ | own (read) | — |
| Add material to event | ✓ | own | — | — |
| Assign material to Handler | ✓ | own | — | — |
| Update material status/progress | ✓ | own | assigned | — |
| Build / update registration form (pre-live) | ✓ | own | — | — |
| View guest summaries / attendance | ✓ | own | assigned (read) | — |
| Register for event (receive QR ticket by email) | n/a | n/a | n/a | ✓ (Public event) |
| **Scan guest QR → confirm attendance** | ✓ | own | assigned | — |

> **Bold rows** are exactly the actions Sub-admins are forbidden from (delete users, delete events, delete main supply list, edit org profile), satisfying the strict restriction in the product requirements.

## 6. Locked technical decisions

| Decision | Choice |
|----------|--------|
| Backend | Spring Boot **4.x**, Java, **Gradle**, strict layered architecture (Controller → Service → Repository) |
| Security | Spring Security, **JWT**, method-level `@PreAuthorize` mapped to the matrix above |
| OTP | **Redis** with time-expiring (TTL) keys |
| File storage | **Rustfs** cluster (profile pictures, org logo, banners) |
| Frontend | **Next.js 16** (App Router), **shadcn/ui**, **Framer Motion** |
| Database | **PostgreSQL** — relational core + **JSONB** for dynamic forms |
| Tenancy | Single organization; **event-scoped** authorization |
| QR ticket delivery | **Email/SMTP** — per-guest QR ticket emailed on registration (also delivers OTP) |
| User onboarding | **Email invite** — Admin creates members with **no password** (role designation Sub-admin/Handler); the user activates via an emailed **set-password** link; account is `PENDING_ACTIVATION` until then |
| Real-time channel | **Telegram** Bot API — ops-channel forwarding of registration/attendance (outbound only) |
| Attendance | Per-guest **single-use QR ticket**; confirmed by **organizer scan** at the venue |

## 7. Success criteria

- An Admin stands up an event, appoints a Sub-admin, and walks away — the Sub-admin runs it but can never delete users/events/supply lists.
- A Handler logging in sees only their assigned materials and can advance their status — nothing else.
- An Admin builds a bespoke registration form in minutes; guests submit it; attendees appear live — with **no** database migration.
- A guest registers with email + phone, receives a unique QR ticket by email, and at the venue an organizer scans it to confirm attendance — with the confirmation appearing in the Telegram ops channel within seconds.
- A QR ticket cannot be used twice: a second scan reports the existing check-in rather than confirming again.
- Forgot-password works via a Redis-stored OTP (emailed) that expires.
- Authorization is enforced server-side; the UI never grants access the API would deny.

## 8. Document map

| # | Document | Focus |
|---|----------|-------|
| 00 | system-overview *(this)* | Vision, scope, user stories, RBAC matrix |
| 01 | [architecture-layout](01-architecture-layout.md) | FE/BE repo layouts, Rustfs interaction, email QR delivery, Redis OTP lifecycle |
| 02 | [database-schema](02-database-schema.md) | Tables, relationships, material enum, JSONB form structures |
| 03 | [api-routes-security](03-api-routes-security.md) | REST contract, `@PreAuthorize`, JWT lifecycle, registration/QR-scan/attendance routes |
| 04 | [external-integrations](04-external-integrations.md) | Email/SMTP (QR + OTP), Telegram ops forwarding, Redis OTP TTL, Rustfs client config |
| 05 | [frontend-spec](05-frontend-spec.md) | Next.js 16 UI: design system (shadcn/Framer Motion), guards, form builder/renderer, QR scanner, a11y/perf |
| 06 | [backend-services-spec](06-backend-services-spec.md) | Service layer: transactions, state machine, QR/ticket lifecycle, scheduled retry jobs |
| 07 | [validation-and-error-handling](07-validation-and-error-handling.md) | Validation layers, uniform error contract, domain error-code catalog |
| 08 | [observability-and-operations](08-observability-and-operations.md) | Logging, metrics, tracing, audit, health, alerting, runbooks |
| 09 | [testing-strategy](09-testing-strategy.md) | Test pyramid, Testcontainers, authorization matrix, Playwright e2e, CI gates |
| 10 | [security-and-compliance](10-security-and-compliance.md) | STRIDE/DREAD threat model, hardening, secrets, PII/retention, audit |
| 11 | [performance-and-scalability](11-performance-and-scalability.md) | SLOs, indexing, caching, door-rush concurrency, scaling model |
| 12 | [devops-and-deployment](12-devops-and-deployment.md) | Docker, CI/CD, environments, config/secrets, Flyway runbook, release/rollback |
| 13 | [implementation-roadmap](13-implementation-roadmap.md) | Milestones (M0–M10), MVP cut, dependency graph, risk register |
