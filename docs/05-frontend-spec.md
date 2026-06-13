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

**Principles**
- **Server-first.** Default to Server Components; reach for `"use client"` only for interactivity (forms, scanner, live lists, motion).
- **The API is the source of authority.** Middleware/route guards are UX only; never trust client role checks for security (see [`03`](03-api-routes-security.md)).
- **One schema, one renderer.** The dynamic form is driven entirely by the JSONB `schema` from the API ([`02` §6](02-database-schema.md)) — no hard-coded attendee fields.
- **Accessibility is a requirement, not a polish step** (WCAG 2.1 AA target).

## 2. Routing & access control

Route groups (full tree in [`01` §3](01-architecture-layout.md)): `(public)`, `(auth)`, `(admin)`, `(event)`, `(handler)`.

`middleware.ts` matcher protects everything except `(public)` and `(auth)`:
```ts
// pseudo
export async function middleware(req) {
  const access = req.cookies.get('access_token')
  if (!access) {
    const refreshed = await tryRefresh(req)          // calls /auth/refresh with refresh cookie
    if (!refreshed) return redirect('/login?next=' + req.nextUrl.pathname)
  }
  const role = decodeRoleClaim(access)               // ADMIN | MEMBER (coarse only)
  if (req.nextUrl.pathname.startsWith('/admin') && role !== 'ADMIN')
    return redirect('/forbidden')
  return NextResponse.next()
}
export const config = { matcher: ['/admin/:path*','/events/:path*','/my-tasks/:path*','/organization/:path*'] }
```
- Middleware only knows the **global** role (`ADMIN`/`MEMBER`). **Event-scoped** access (manager/handler on a specific event) is *not* decided here — the page's server fetch hits the API and renders `403`→a "not authorized for this event" state if denied. This keeps the client honest with the two-layer model in [`04`](04-auth-and-authorization.md)/[`03`](03-api-routes-security.md).

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

## 7. Key screens by persona

| Persona | Screens |
|---------|---------|
| Admin | Users CRUD, Organization profile (logo/banner upload → Rustfs presign, [`04` §4](04-external-integrations.md)), Events (create/publish/delete), Supply list, plus all event workspace screens |
| Sub-admin | Assigned events workspace: overview, members/delegation, materials, agenda, form-builder, guests/attendance, scanner |
| Handler | My Tasks (assigned materials with status controls), assigned event read views, scanner |
| Guest | Public register page, ticket page (QR + status + resend) |

## 8. State management

- **Server state** (events, materials, submissions): RSC fetch + Server Actions + `revalidate*`. No global client store for server data.
- **Ephemeral UI state**: local `useState`/`useReducer` (dialogs, builder draft, scanner session).
- **Cross-cutting client state** (current user summary, theme): a thin React context hydrated from a server fetch; never the authority for permissions.
- **Live data** (attendance feed): TanStack Query with SSE subscription or short polling ([`11` §perf](11-performance-and-scalability.md) / [`08`](08-observability-and-operations.md)).

## 9. Accessibility & UX quality (senior-frontend checklist)

- Semantic HTML + ARIA via Radix/shadcn; full keyboard operability (builder drag has keyboard alternative).
- Visible focus rings; color is never the sole status signal (icon + text alongside status colors).
- Form fields: associated `<label>`, `aria-describedby` for errors, `aria-invalid`.
- Respect `prefers-reduced-motion`; target WCAG 2.1 AA contrast.
- Scanner: camera-permission and no-camera fallbacks; manual entry path.

## 10. Performance budgets (senior-frontend)

- Ship minimal client JS: server-render by default; code-split heavy client islands (scanner, builder) via dynamic import.
- Route-level JS budget target: < 130 KB gzip for interactive routes; public register page kept lean.
- Image optimization via `next/image` (Rustfs public URLs as remote patterns).
- Avoid waterfalls: parallel server fetches; stream with Suspense where useful.
- Memoize expensive client lists; virtualize long tables (submissions/attendance) when large.

## 11. Testing hooks (feeds [`09`](09-testing-strategy.md))

- Stable `data-testid` on key controls (form fields, status selects, scan result banner).
- The renderer and `buildZodSchema` are pure and unit-testable against schema fixtures.
- Playwright e2e covers: guest registration → ticket page; organizer scan happy/duplicate paths; role-gated route redirects.

## 12. Open questions

- **i18n** in v1? *(Default: English-only v1; structure copy via a `messages/` dict to allow later i18n.)*
- **SSE vs polling** for live attendance? *(Default: SSE if infra allows; fall back to 5s polling — decided in [`11`](11-performance-and-scalability.md).)*
- **PWA/offline scanner** for poor venue connectivity? *(Default: out of scope v1; note as a fast-follow.)*
