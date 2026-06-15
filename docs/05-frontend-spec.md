# 05 — Frontend Specification

> **Status:** Draft · **Depends on:** [`01`](01-architecture-layout.md) (route tree), [`03`](03-api-routes-security.md) (API contract), [`02`](02-database-schema.md) (JSONB form schema)
> Detailed UI architecture for the **Next.js 16** app: design system, routing/guards, state & data-fetching, the dynamic form builder/renderer, and the organizer QR scanner. Authored against the `senior-frontend` methodology (React 19 server-first, accessibility, performance budgets).

---

## 1. Stack & principles

| Concern | Choice |
|---------|--------|
| Framework | Next.js 16 (App Router), React 19, TypeScript 5 (strict) |
| UI primitives | shadcn/ui (Radix under the hood) |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| Data validation | Zod (mirrors the backend DTO + JSONB field types) |
| Forms | React Hook Form + Zod resolver |
| Server state | React Server Components + Server Actions; TanStack Query only for highly-interactive client views (scanner, live attendance) |
| Icons | lucide-react |
| PWA | Web App Manifest (`app/manifest.ts`) + service worker (`public/sw.js`) — installable, online-only (no offline scan queue in v1) |

**Principles**
- **Server-first.** Default to Server Components; reach for `"use client"` only for interactivity (forms, scanner, live lists, motion).
- **The API is the source of authority.** Proxy/route guards are UX only; never trust client role checks for security (see [`03`](03-api-routes-security.md)).
- **One schema, one renderer.** The dynamic form is driven entirely by the JSONB `schema` from the API ([`02` §6](02-database-schema.md)) — no hard-coded attendee fields.
- **Accessibility is a requirement, not a polish step** (WCAG 2.1 AA target).

## 2. Routing & access control

Route groups (full tree in [`01` §3](01-architecture-layout.md)): `(public)`, `(auth)`, `(admin)`, `(event)`, `(handler)`.

`proxy.ts` (Next.js 16 — replaces the deprecated `middleware.ts`; runs on the **Node.js runtime** by default) matches everything except `(public)` and `(auth)`:
```ts
// pseudo — proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const access = request.cookies.get('access_token')
  if (!access) {
    const refreshed = await tryRefresh(request)        // calls /auth/refresh with refresh cookie
    if (!refreshed) return NextResponse.redirect(new URL('/login?next=' + request.nextUrl.pathname, request.url))
  }
  const role = decodeRoleClaim(access)                 // ADMIN | MEMBER (coarse only)
  if (request.nextUrl.pathname.startsWith('/admin') && role !== 'ADMIN')
    return NextResponse.redirect(new URL('/forbidden', request.url))
  return NextResponse.next()
}
export const config = { matcher: ['/admin/:path*','/events/:path*','/my-tasks/:path*','/organization/:path*'] }
```
- `proxy` only knows the **global** role (`ADMIN`/`MEMBER`). **Event-scoped** access (manager/handler on a specific event) is *not* decided here — the page's server fetch hits the API and renders `403`→a "not authorized for this event" state if denied. This keeps the client honest with the two-layer model in [`03`](03-api-routes-security.md).
- Because `proxy` now runs on the Node.js runtime by default, the refresh/claim-decode can use standard Node crypto/libraries — no edge-runtime constraints. Still treat it as **UX-only**: Server Actions are dispatched as POSTs to the route that uses them, so a `matcher` that excludes a path also skips its Server Functions — always re-verify auth inside each Server Action and server fetch, never rely on `proxy` alone (per Next.js Data Security guidance).
- **Route-level boundaries:** each route group provides `loading.tsx` (Suspense fallback during server fetch), `error.tsx` (recoverable render/fetch errors with a retry), and `not-found.tsx`. The server fetch's `403` renders the "not authorized for this event" state (a segment-level `forbidden`/not-authorized UI), distinct from `404` not-found — so denied event access and missing resources read differently.

## 3. Data fetching & the API client

`lib/api/` exposes a typed client used by Server Components, Server Actions, and (sparingly) client components.

- **Base:** wraps `fetch` with `credentials: 'include'`, base URL from env, JSON (de)serialization, and a typed `ApiError` carrying the uniform error body ([`07`](07-validation-and-error-handling.md)).
- **401 handling:** a single-flight refresh — on `401`, call `/auth/refresh` once, retry the original request; on refresh failure, redirect to login. In Server Components this happens during the request; in client code it's handled by a fetch wrapper.
- **Typing:** request/response types generated from the backend OpenAPI spec ([`03`](03-api-routes-security.md)) into `lib/api/types.gen.ts`, so FE/BE drift is caught at compile time.

```
lib/api/
├── client.ts        # fetch wrapper, error mapping, refresh-retry
├── types.gen.ts     # generated from OpenAPI
├── events.ts        # typed endpoint fns: listEvents(), getEvent(id), ...
├── materials.ts
├── forms.ts
├── attendance.ts    # scan(eventId, token), liveAttendance(eventId)
└── auth.ts
```

**Mutations** use **Server Actions** that call the API and `revalidatePath`/`revalidateTag` the affected view. Highly-interactive views (scanner, live attendance) use TanStack Query against client endpoints for optimistic updates and polling/SSE.

### 3.1 Caching & revalidation convention

> **Why this is explicit:** in Next.js 16 `fetch` is **uncached by default**, and `revalidateTag` only invalidates fetches that were actually tagged. Leaving this implicit produces one of two bugs — stale views after a mutation, or no caching at all (refetch-everything, which blows the §10 perf budget). The convention below is mandatory, not optional.

- **Cache intent is set per fetch in `lib/api/client.ts`** via `next: { tags, revalidate }` (or `cache: 'no-store'`):
  - **Cacheable, slow-changing reads** — tag and cache: org profile (`org`), an event's active form schema (`event:{id}:form`). Mirrors the server-side cache in [`11` §4](11-performance-and-scalability.md).
  - **Per-user / authorization-sensitive reads** — `cache: 'no-store'` (never cache across users; see [`11` §4](11-performance-and-scalability.md)). Lists scoped by assignment, `/me`, submissions, live attendance.
- **Tag naming** — hierarchical and id-scoped so a mutation invalidates *exactly* the affected view:

  | Tag | Wraps |
  |-----|-------|
  | `event:{id}` | event detail/overview |
  | `event:{id}:materials` | materials list + history |
  | `event:{id}:form` | active form schema |
  | `event:{id}:submissions` | guest/attendance summaries |
  | `org` | organization profile/branding |

- **Each Server Action revalidates the narrowest tag(s) it affects** — e.g. `PATCH material status` → `revalidateTag('event:{id}:materials')`; `PUT form` → `revalidateTag('event:{id}:form')`; never a broad `revalidatePath('/')`.
- **Live data is *not* tag-driven** — the attendance feed uses TanStack Query (SSE/polling), not `revalidateTag`; keep its `staleTime`/refetch policy with the Query layer (§8).

## 4. Design system (shadcn/ui + Tailwind + Framer Motion)

- **Primitives** generated into `components/ui/` (Button, Input, Select, Dialog, Table, Toast, Tabs, Badge, Card, DropdownMenu, Form). Themed via Tailwind tokens + CSS variables; org branding (logo/banner colors from the org profile) feeds a theme provider.
- **Composite components** in `components/`:
  - `form-renderer/` — renders a JSONB schema into a live form (see §5).
  - `form-builder/` — admin/sub-admin drag-reorder field editor (see §5).
  - `qr/` — `QrTicket` (guest fallback display) and `QrScanner` (organizer camera).
  - `data-table/` — sortable/paginated table for users, events, submissions, materials.
  - `status-badge/` — material status + ticket status pills.
- **Motion (`components/motion/`)** — shared Framer Motion variants:
  - Page/route transitions (subtle fade/slide) honoring `prefers-reduced-motion`.
  - Micro-interactions: status-change pulse, toast slide-in, list item enter/exit (`AnimatePresence`).
  - **Rule:** animation never blocks interaction or gates content; all motion is opt-out under reduced-motion.

## 5. Dynamic form: builder & renderer

The defining UI feature. Two components, one schema contract ([`02` §6](02-database-schema.md)).

### 5.1 Form builder (`form-builder/`) — admin / sub-admin, pre-live
- Edits the `registration_form.schema` array: add/remove/reorder fields (drag handle), set `label`, `type`, `required`, `options`, `validation`.
- Supported field types map to inputs: `text/textarea/email/phone/number/date` → inputs; `select/multiselect` → dropdowns; `checkbox` → toggle.
- **Guardrails enforced client-side AND server-side:** an active form must include a required `email` field (QR delivery) and a required `phone` field (product requirement). The builder blocks "Activate" until both exist; the server re-checks on `POST .../form/activate`.
- Live preview pane renders the in-progress schema via the same renderer (§5.2) — WYSIWYG.
- Saves via Server Action → `PUT /events/{id}/form`; bumps `version`.

### 5.2 Form renderer (`form-renderer/`) — public guest registration
- Input: the form `schema` (fetched server-side). Output: a React Hook Form whose Zod schema is **derived at runtime** from the field definitions (`buildZodSchema(schema)`), so validation rules match the server exactly.
- Renders fields ordered by `order`; shows inline field errors; submits via `POST /public/events/{id}/register`.
- On success: shows "Your QR ticket has been emailed to {email}" plus the **on-screen QR fallback** (`QrTicket`, encoding `checkin_token`) and a link to `/tickets/{token}`.
- **React 19 action primitives:** drive Server-Action forms (renderer + builder §5.1) with **`useActionState`** for pending/returned-error state and **`useFormStatus`** for the submit button's pending/disabled UI — server `fieldErrors` ([`07`](07-validation-and-error-handling.md)) map back onto the RHF fields. This keeps a single source of truth for submit state instead of a parallel `useState` flag.

## 6. Organizer QR scanner (`qr/QrScanner`)

- Client component using the browser camera (`getUserMedia`) + a QR-decode library (e.g. `@zxing/browser`); manual token entry as a fallback.
- On decode → Server Action / client call `POST /events/{eventId}/attendance/scan { checkinToken }`.
- **Result states (with motion + sound/vibration cue):**
  - `201` → green "✓ {guestName} checked in".
  - `409 ALREADY_CHECKED_IN` → amber "Already checked in at {time}".
  - `409 TICKET_INVALID` / `404` → red "Invalid or revoked ticket".
  - `403` → "You're not assigned to this event."
- Keeps a running **session tally** and a live feed of recent scans; debounces duplicate rapid decodes of the same code.
- Available to assigned staff under `(event)/.../scan` and `(handler)/events/[id]/scan`.
- **Decode off the main thread** to protect the INP budget (§10): prefer the native `BarcodeDetector` API where available, else run `@zxing/browser` in a **Web Worker** — the per-frame decode loop must never block taps. Use `useOptimistic` for the tally so the UI responds instantly while the scan POST is in flight.

### 6.1 Installable PWA (handler scanner)

The scanner ships as an **installable PWA** so handlers can add it to a phone home screen and run it full-screen (standalone) for an app-like venue check-in experience. **Online-only in v1** — a scan still requires a network round-trip to `POST /events/{eventId}/attendance/scan`; an **offline scan queue is out of scope** (deferred fast-follow, see §12). This is the same "web/camera-based, no native app" stance as [`00`](00-system-overview.md) — a PWA *is* that installable web/camera approach.

- **Manifest** — `app/manifest.ts` returning `MetadataRoute.Manifest`: `name`/`short_name` handler-facing (e.g. "Gatherly Scan"), `display: 'standalone'`, `start_url` at the handler entry (e.g. `/my-tasks` or a `/scan` event-picker — the dynamic `events/[eventId]/scan` can't be a static `start_url`), `theme_color`/`background_color` from the org branding tokens (§4), and `icons` at 192×192 and 512×512. Served by Next at `/manifest.webmanifest`.
- **Service worker** — `public/sw.js`, registered client-side from a small client island (`navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })`) only when `'serviceWorker' in navigator`. Strategy: **cache-first for the app shell + static assets**; **network-only** for the scan POST and any auth-sensitive/API response — **never cache attendance or authorization-sensitive data** (aligns with [`11` §4](11-performance-and-scalability.md)).
- **Install prompt** — lightweight component with iOS "Add to Home Screen" instructions (no `beforeinstallprompt` on iOS Safari); hidden when already running standalone (`matchMedia('(display-mode: standalone)')`).
- **Online-only behavior** — detect connectivity via `navigator.onLine` + `online`/`offline` events; when offline show a clear "You're offline — scanning needs a connection" banner. The §6 scan result states are otherwise unchanged. No scan is silently dropped.
- **HTTPS** — service workers require TLS, already mandated by [`10` §6](10-security-and-compliance.md) ("TLS everywhere"). Local dev uses `next dev --experimental-https`.
- **Security headers** (`next.config.js`) — serve `/sw.js` with `Cache-Control: no-cache, no-store, must-revalidate`, the correct `Content-Type`, and a strict SW `Content-Security-Policy`; keep the existing CSP/security headers ([`10` §6](10-security-and-compliance.md)).
- **Bundle** — the SW-registration/install island stays out of the main bundle; the scanner is already code-split via dynamic import (§10).

## 7. Key screens by persona

| Persona | Screens |
|---------|---------|
| Admin | Users (invite via **Add-User modal** + CRUD, §7a), Organization profile (logo/banner upload → Rustfs presign, [`04` §4](04-external-integrations.md)), Events (create/publish/delete), Supply list, plus all event workspace screens |
| Sub-admin | Assigned events workspace: overview, members/delegation, materials, agenda, form-builder, guests/attendance, scanner |
| Handler | My Tasks (assigned materials with status controls), assigned event read views, scanner |
| Guest | Public register page, ticket page (QR + status + resend) |

## 7a. Admin user console & invite flow (M1)

The user console at `/users` (route group `(admin)`, Server Component using the cookie-forwarding
server fetch, [`03` §4.2](03-api-routes-security.md)):

- **List view** — a table with exactly four columns: **Name · Email · Role · Active Status**.
  - *Role* renders the global Admin, or the member's `default_event_role` designation (**Sub-admin** / **Handler**), as a pill badge.
  - *Active Status* renders `ACTIVE` / `INACTIVE` / `PENDING_ACTIVATION` as an icon+text pill (never color alone, §9). `PENDING_ACTIVATION` reads as "Pending" until the invite is accepted.
- **"Add User" button** opens an **input modal** (accessible dialog: focus-trap, `Esc` to close, `aria-modal`, labelled title) with fields:
  - **Name** (text), **Email** (email), **Role** dropdown — options **`SUB_ADMIN`** and **`HANDLER`** only (**no `ADMIN`**, **no password field**).
  - On submit → Server Action / client call `POST /users { fullName, email, role }`; on success close the modal, toast "Invite sent", and `revalidate`/refresh the list (the new row appears as *Pending*). Server `fieldErrors` map back onto the form ([`07`](07-validation-and-error-handling.md)).
- **Why no password:** the Admin never sets another user's secret. Creating the user emails them a one-time code; they redeem it on the login page and set their own password (docs/02 §5c).

**Login page (invite redemption)** — `(auth)/login` posts `{ email, password }`. When the password is an accepted invite code the backend returns `{ setupRequired, email, resetGrant }` (no session); the page detects this and routes to `set-password` carrying `email` + `grant`.

**Set-password page** — `(auth)/set-password` (invite activation) reads the `email` + `grant` query params, collects a new password (with confirm + strength rule mirroring the backend), and calls `POST /auth/reset-password { email, resetGrant, newPassword }`. Success → redirect to `/login`; missing/invalid grant → a clear "This request is invalid or has expired" state with a path back to sign in.

**Reset-password page** — `(auth)/reset-password` (forgot-password code entry) is **one step**: it collects the emailed 6-digit code (`OtpInput`, with a TTL countdown) plus the new password + confirm, then `verifyOtp` → `resetPassword` in sequence and redirects to `/login`. Invite uses set-password; reset uses this screen — both call the same `/auth/reset-password` grant endpoint.

## 8. State management

- **Server state** (events, materials, submissions): RSC fetch + Server Actions + `revalidate*`. No global client store for server data.
- **Ephemeral UI state**: local `useState`/`useReducer` (dialogs, builder draft, scanner session).
- **Cross-cutting client state** (current user summary, theme): a thin React context hydrated from a server fetch; never the authority for permissions.
- **Live data** (attendance feed): TanStack Query with SSE subscription or short polling ([`11` §perf](11-performance-and-scalability.md) / [`08`](08-observability-and-operations.md)).
- **TanStack Query conventions** (scanner, live attendance): hierarchical, id-scoped **query keys** mirroring the cache tags in §3.1 (e.g. `['event', id, 'attendance']`); explicit **`staleTime`** per view (live feed short, dropdowns longer); and **RSC hydration** via `dehydrate` on the server + `HydrationBoundary` on the client so the first paint reuses the server fetch instead of double-fetching. Query owns *only* the interactive client islands — server data stays on the RSC + `revalidateTag` path (§3.1).

## 9. Accessibility & UX quality (senior-frontend checklist)

- Semantic HTML + ARIA via Radix/shadcn; full keyboard operability (builder drag has keyboard alternative).
- Visible focus rings; color is never the sole status signal (icon + text alongside status colors).
- Form fields: associated `<label>`, `aria-describedby` for errors, `aria-invalid`.
- Respect `prefers-reduced-motion`; target WCAG 2.1 AA contrast.
- Scanner: camera-permission and no-camera fallbacks; manual entry path.

## 10. Performance budgets (senior-frontend)

**Core Web Vitals targets** — measured at **p75 on mid-tier mobile over congested venue WiFi/4G** (the real handler context). These are contracts, enforced in CI (below), not aspirations:

| Metric | Target (p75) | Why it bites here |
|--------|--------------|-------------------|
| **LCP** (load) | < 2.5 s | guests on the public register page; handlers opening the scanner |
| **INP** (responsiveness) | < 200 ms | the scanner decode loop must not block taps (§6) |
| **CLS** (visual stability) | < 0.1 | dynamic form + status pills must not shift layout |
| Interactive route **TTI** | < 2.5 s | aligns with [`11` §1](11-performance-and-scalability.md) |
| Route **JS budget** | < 130 KB gzip | interactive routes; public register kept lean |

- **Measure real-user vitals** with `useReportWebVitals` (`next/web-vitals`), beaconed to an analytics endpoint, so the p75 numbers above are tracked, not assumed.
- Ship minimal client JS: server-render by default; code-split heavy client islands (scanner, builder) via dynamic import; **Framer Motion is dynamically imported** and short-circuits under `prefers-reduced-motion` before loading variants.
- `next.config.js`: `experimental.optimizePackageImports: ['lucide-react']`; `images.formats: ['image/avif','image/webp']` with Rustfs `remotePatterns`; self-host fonts via **`next/font`** (zero layout shift → protects CLS).
- Image optimization via `next/image`; mark the LCP image `priority`.
- Avoid waterfalls: parallel server fetches; stream with Suspense where useful.
- Memoize expensive client lists; virtualize long tables (submissions/attendance) when large.
- The service worker (§6.1) must not regress the TTI budget; it precaches only the app shell + static assets, never data.

### 10.1 Enforcement (CI gates)

Budgets that aren't machine-checked rot on every PR. These gates run in the [`09`](09-testing-strategy.md)/[`12`](12-devops-and-deployment.md) pipeline and **fail the PR** on regression:

- **Lighthouse CI** (`lighthouserc.js`) on the login, public-register, and scanner routes — assert `performance ≥ 0.9`, `accessibility ≥ 0.9`, and the numeric CWV thresholds above (`largest-contentful-paint ≤ 2500`, `interaction-to-next-paint ≤ 200`, `cumulative-layout-shift ≤ 0.1`).
- **Bundle-size gate** (`size-limit`, or `@next/bundle-analyzer` for inspection) with the `130 KB` budget pinned per route group — a PR that exceeds it is blocked.

## 11. Testing hooks (feeds [`09`](09-testing-strategy.md))

- Stable `data-testid` on key controls (form fields, status selects, scan result banner).
- The renderer and `buildZodSchema` are pure and unit-testable against schema fixtures.
- Playwright e2e covers: guest registration → ticket page; organizer scan happy/duplicate paths; role-gated route redirects.
- PWA: install/standalone smoke + a Lighthouse "Installable" audit gate; the offline banner (§6.1) appears when the network drops.
- Performance/quality gates (§10.1) run in CI: Lighthouse CI (perf + a11y floors + CWV thresholds) and the `size-limit` bundle budget — both block the PR on regression.

## 12. Open questions

- **i18n** in v1? *(Default: English-only v1; structure copy via a `messages/` dict to allow later i18n.)*
- **SSE vs polling** for live attendance? *(Default: SSE if infra allows; fall back to 5s polling — decided in [`11`](11-performance-and-scalability.md).)*
- **Installable PWA** for the handler scanner: **in scope** (§6.1) — installable + online-only. The **offline scan queue** (IndexedDB queue + background-sync replay, incl. conflict handling for the non-idempotent scan: already-checked-in / revoked) remains a deferred fast-follow; [Serwist](https://github.com/serwist/serwist) is the candidate for that phase.
