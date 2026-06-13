# 01 — Architecture Layout

> **Status:** Draft · **Depends on:** [`00-system-overview.md`](00-system-overview.md)
> Defines the physical/package structure of both apps and how the system talks to **Rustfs** (files) and **Redis** (OTP).

---

## 1. High-level topology

```
       Guest inbox (email → QR ticket)   Organizer browser (+ camera → scans guest QR)
                              Browser                    │
                                        │                │
              ┌─────────────────────────▼──────────────────────────┐
              │  Next.js 16  (App Router · shadcn/ui · Framer Motion)│
              │  • Server Components / Server Actions                │
              │  • proxy.ts  → JWT cookie guard (Next.js 16)         │
              │  • lib/api  → typed fetch client                     │
              └───────────┬─────────────────────────┬───────────────┘
                          │ HTTPS/JSON (JWT cookie)  │ presigned URL (direct upload/fetch)
                          ▼                          ▼
       ┌──────────────────────────────┐     ┌───────────────────────┐
       │  Spring Boot 4.x (Gradle)    │     │  Rustfs cluster        │
       │  Controller → Service → Repo │     │  (S3-compatible blobs) │
       │  Spring Security (JWT,        │     │  logos/banners/avatars │
       │   @PreAuthorize)             │◀────┤  presign issued by BE  │
       └───┬───────────┬─────────┬────┘     └───────────────────────┘
           │ JDBC      │ Redis   │ SMTP / HTTPS
           ▼           ▼         ▼
   ┌────────────┐ ┌─────────┐ ┌──────────────┐ ┌──────────────────┐
   │ PostgreSQL │ │ Redis   │ │ Email / SMTP │ │ Telegram Bot API │
   │ rel+JSONB  │ │ OTP+TTL │ │ QR + OTP mail│ │ ops channel only │
   └────────────┘ └─────────┘ └──────────────┘ └──────────────────┘
```

- **Stateless backend** — identity in a signed JWT; any instance serves any request.
- **Direct-to-Rustfs uploads** — the backend issues short-lived presigned URLs; large binaries never stream through the API.
- **QR ticket via email** — on registration the backend mints a per-guest `checkin_token`, renders its QR, and **emails it** to the guest (with an on-screen fallback). The **organizer** scans that QR in-browser to confirm attendance.
- **Telegram is outbound-only** — it just forwards registration/attendance to an ops channel; no webhook.
- **Redis** — exclusively for time-expiring OTP codes and (optionally) login rate-limit counters.

## 2. Monorepo layout

```
gatherly/
├── docs/                       # these specifications
├── frontend/                   # Next.js 16 app
├── backend/                    # Spring Boot 4.x (Gradle)
├── docker-compose.yml          # frontend + backend + postgres + redis (+ rustfs for local)
└── README.md
```

> Monorepo so FE/BE contract changes land atomically in one PR. CI builds each app independently (see `04` / future devops spec).

## 3. Frontend — Next.js 16 App Router structure

```
frontend/
├── app/
│   ├── layout.tsx                      # root layout, theme, Framer Motion provider
│   ├── globals.css
│   ├── (public)/                       # unauthenticated — guest journey (register only)
│   │   ├── events/[slug]/
│   │   │   └── register/page.tsx       # dynamic form render → on success: "QR ticket sent to your email" + on-screen QR fallback
│   │   ├── tickets/[token]/page.tsx    # guest views QR / ticket status / "resend email"
│   │   └── layout.tsx
│   ├── (auth)/                         # login / forgot-password / OTP
│   │   ├── login/page.tsx
│   │   ├── forgot-password/page.tsx    # request OTP
│   │   └── reset-password/page.tsx     # verify OTP + set new password
│   ├── (admin)/                        # Admin-only console
│   │   ├── users/                      # global user CRUD
│   │   ├── organization/page.tsx       # org profile (logo/banner upload → Rustfs)
│   │   ├── events/                     # propose/publish/delete
│   │   └── supply-list/                # main supply list CRUD
│   ├── (event)/                        # Admin + Sub-admin event workspace
│   │   └── events/[eventId]/
│   │       ├── overview/page.tsx
│   │       ├── members/page.tsx        # add members / delegate handlers
│   │       ├── materials/page.tsx
│   │       ├── agenda/page.tsx         # from templates
│   │       ├── form-builder/page.tsx   # dynamic registration form (pre-live)
│   │       ├── scan/page.tsx           # organizer QR scanner → confirm attendance (assigned staff)
│   │       └── guests/page.tsx         # attendance, live confirmed check-ins
│   ├── (handler)/                      # Handler view
│   │   ├── my-tasks/page.tsx           # assigned materials only
│   │   └── events/[eventId]/scan/page.tsx  # handler can also scan guest QR at the venue
│   └── api/                            # route handlers / BFF proxy if needed
├── components/
│   ├── ui/                             # shadcn/ui generated primitives
│   ├── form-renderer/                  # generic JSONB-schema field renderer
│   ├── qr/                             # guest QR display (fallback) + organizer camera scanner
│   └── motion/                         # Framer Motion wrappers/variants
├── lib/
│   ├── api/                            # typed fetch client (base URL, 401→refresh→retry)
│   ├── auth/                           # session helpers, role guards
│   ├── rustfs/                         # presigned-upload helper
│   └── validation/                     # zod schemas mirroring form field types
├── proxy.ts                            # JWT cookie check + route-group guards (Next.js 16)
├── next.config.ts
└── package.json
```

**Conventions**
- **Route groups by audience** (`(public)`, `(auth)`, `(admin)`, `(event)`, `(handler)`) — the URL stays clean while access context is explicit.
- **`proxy.ts`** validates the access-token cookie on protected matchers, performs silent refresh, and redirects under-privileged users. It is a **UX guard only** — the API remains the real authority.
- **Server Components / Server Actions** do authenticated reads/writes, forwarding the JWT cookie. Mutations funnel through `lib/api`.
- **shadcn/ui** provides primitives in `components/ui`; **Framer Motion** lives in `components/motion` (shared variants for page/route transitions and micro-interactions).
- **Dynamic form rendering** (`components/form-renderer`) consumes the JSONB `schema` array from the API and draws fields generically (see [`02`](02-database-schema.md) §JSONB and [`03`](03-api-routes-security.md)).
- **QR flow split by audience:** guests only *register* in `(public)` and receive their QR **by email** (with an on-screen fallback); *scanning* a guest QR to confirm attendance is an authenticated **organizer** action under `(event)`/`(handler)` `scan/` pages calling `POST /events/{id}/attendance/scan`.

## 4. Backend — Spring Boot 4.x (Gradle) package architecture

Strict **layered architecture**; dependencies point downward only (Controller → Service → Repository). No business logic in controllers; no web concerns in repositories.

```
backend/
├── build.gradle(.kts)            # Gradle build + dependency management
├── settings.gradle(.kts)
└── src/main/
    ├── java/com/gatherly/
    │   ├── GatherlyApplication.java
    │   ├── config/               # SecurityConfig, CorsConfig, RedisConfig, RustfsConfig, MailConfig, JacksonConfig, OpenApiConfig
    │   ├── security/             # JwtAuthFilter, JwtService, EventSecurityService(@eventSecurity), UserPrincipal
    │   ├── common/               # error model (@RestControllerAdvice), pagination, BaseEntity, auditing
    │   ├── user/
    │   │   ├── UserController.java
    │   │   ├── UserService.java
    │   │   ├── UserRepository.java
    │   │   ├── domain/User.java
    │   │   └── dto/…
    │   ├── auth/                 # login, refresh, logout, forgot-password, OTP verify
    │   │   ├── AuthController.java
    │   │   ├── AuthService.java
    │   │   ├── OtpService.java          # Redis-backed (see §6)
    │   │   └── dto/…
    │   ├── organization/         # org profile (logo/banner → Rustfs)
    │   ├── event/                # event + event_assignment (delegation) + agenda
    │   ├── material/             # material, status history, main supply list
    │   ├── form/                 # registration_form (JSONB schema), submission, dynamic validation
    │   ├── registration/        # public registration, checkin_token + QR generation, emails ticket, lifecycle
    │   ├── attendance/          # organizer QR scan → event_checkin (1:1), manual override, revoke
    │   ├── storage/              # RustfsClient, presign service
    │   ├── integration/email/    # EmailClient (JavaMailSender), QR-ticket + OTP templates, sender
    │   └── integration/telegram/ # TelegramClient (ops sendMessage only), notifier
    └── resources/
        ├── application.yml
        ├── application-{local,prod}.yml
        └── db/migration/         # Flyway SQL (see 02)
```

### 4.1 Layer responsibilities
| Layer | Responsibility |
|-------|----------------|
| **Controller** (`@RestController`) | HTTP mapping, request DTO validation (`@Valid`), response DTO mapping. Thin. |
| **Service** (`@Service`, `@Transactional`) | Business rules, transactions, and **authorization gates** via `@PreAuthorize` calling `@eventSecurity`. |
| **Repository** (`@Repository`, Spring Data JPA) | Persistence; custom JSONB / event-scoped queries. |
| **Cross-cutting** | `@RestControllerAdvice` uniform error contract; JPA auditing; structured logging. |

### 4.2 Authorization model (summary; full detail in [`03`](03-api-routes-security.md))
- **Layer 1 — global role** from the JWT: `hasRole('ADMIN')` for system-wide actions.
- **Layer 2 — event-scoped** via `@eventSecurity.canManage(eventId, auth)` / `canUpdateMaterial(materialId, auth)`, resolved per request from `event_assignment` / material ownership. Event roles are deliberately **not** in the token (many-valued, frequently changing).

## 5. Frontend ↔ Rustfs interaction (file/image storage)

Rustfs is an S3-compatible object store. Binaries (avatars, org logo, banners) **do not** pass through the Spring API; the API only brokers access via presigned URLs.

**Upload flow (e.g. org banner):**
1. FE (`lib/rustfs`) requests `POST /api/storage/presign` `{ purpose: "ORG_BANNER", contentType, size }`.
2. Backend (`storage` package) authorizes the action (`@PreAuthorize("hasRole('ADMIN')")` for org assets), validates content-type/size, generates an object key (e.g. `org/banner/{uuid}.png`), and returns a **short-lived presigned PUT URL** + the final object key.
3. FE uploads the file **directly** to Rustfs using the presigned PUT.
4. FE calls the relevant domain endpoint (e.g. `PUT /organization`) with the returned **object key**; backend persists the key/URL on the entity.

**Read flow:** backend stores the object key and serves either a public CDN-style URL (for public assets like logos/banners) or a short-lived presigned GET (for restricted assets). Decided per-asset in [`04`](04-external-integrations.md).

**Why presigned, not proxied:** keeps the stateless API off the binary hot path, scales storage independently, and avoids large multipart handling in Spring.

## 6. Backend ↔ Redis OTP lifecycle

Redis is used **only** for ephemeral, time-expiring OTP storage (and optionally login rate-limit counters). TTL rules are defined authoritatively in [`04`](04-external-integrations.md); the lifecycle is:

```
Forgot-password request
   └─ AuthService.requestOtp(email)
        ├─ verify account exists & active
        ├─ generate 6-digit OTP
        ├─ Redis SET  otp:pwd:{userId} = hash(otp)   EX <TTL>   (e.g. 300s)
        ├─ Redis SET  otp:attempts:{userId} = 0       EX <TTL>
        └─ deliver OTP to user (channel per 04)

OTP verification
   └─ AuthService.verifyOtp(email, code)
        ├─ GET otp:pwd:{userId}; if missing → expired/invalid
        ├─ INCR otp:attempts:{userId}; if > max → invalidate (DEL) & lock
        ├─ constant-time compare hash(code)
        ├─ on success → issue short-lived password-reset grant, DEL otp keys
        └─ on failure → return remaining attempts
```

- **Keys:** namespaced `otp:pwd:{userId}`, `otp:attempts:{userId}`. **Never** store the raw OTP — store a hash.
- **Expiry:** Redis TTL is the single source of expiry; no DB cleanup job needed.
- **Single-use:** keys deleted on success or attempt-exhaustion.
- **Config:** `RedisConfig` wires a `StringRedisTemplate`; `OtpService` owns all key naming and TTL constants (mirrored from `04`).

## 7. Environment & configuration

| Concern | Mechanism |
|---------|-----------|
| DB URL / credentials | env → `application-{profile}.yml` |
| JWT signing secret, access/refresh TTL | env (never committed) |
| Redis host/port, OTP TTL & max-attempts | env + `04` constants |
| Rustfs endpoint, access/secret keys, bucket | env |
| SMTP host/port, credentials, from-address (QR + OTP email) | env |
| Telegram bot token, ops channel/chat id | env |
| CORS allowed origin, cookie domain | env per environment |

Local development runs all backing services via `docker-compose.yml` (PostgreSQL, Redis, a mail sink like MailHog, optional Rustfs/MinIO-compatible). Production points at managed equivalents.
