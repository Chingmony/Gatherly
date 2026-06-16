# Handler Mobile Design

The reference for designing handler-side UI in Gatherly. The Handler role is
**mobile-first** — handlers work events from a phone (scanning QR tickets,
updating material status on the floor). Every handler screen must be designed for
a thumb on a 360–430px-wide viewport first, then allowed to scale up.

> Stack: Next.js 16 App Router · React 19 · TypeScript strict · Tailwind +
> shadcn/ui only. Compose classes with `cn()`. No other component library.

---

## 1. Layout shell

The handler shell (`components/layout/app-shell.tsx`) renders, only when
`role === "handler"`:

- **Sidebar** (`sidebar.tsx`) — `hidden md:flex`. Desktop only; never visible on phones.
- **MobileNav** (`mobile-nav.tsx`) — `fixed bottom-0`, `md:hidden`, the primary
  handler navigation on mobile.
- **HandlerFab** (`handler-fab.tsx`) — floating scanner shortcut, `md:hidden`.
- **Topbar** (`topbar.tsx`) — back button appears on sub-pages (≥ 2 path segments).

**Breakpoint contract:** `md` (768px) is the divide. Below `md` = mobile shell
(bottom nav + FAB). At/above `md` = desktop shell (sidebar). Design and verify
both, but the mobile layout is the source of truth for handler screens.

## 2. Bottom navigation

`MobileNav` is `fixed bottom-0 left-0 right-0`, `z-50`, `height: 64`, `md:hidden`.

- **iOS safe area is mandatory:** `paddingBottom: env(safe-area-inset-bottom, 0px)`
  so the home indicator never overlaps tap targets.
- Tabs: Dashboard · Events · Tasks · Scanner · Settings. Keep to ≤ 5 — a 6th
  crowds the bar. Each tab is icon (20px) + 10px bold label, equal `flex-1` width.
- Active state: `--primary-soft` pill behind the icon, `--primary-hex` text.

## 3. Floating action button (FAB)

`HandlerFab` is the thumb-reachable shortcut to the check-in scanner (the
handler's primary action).

- `md:hidden`; **hidden on `/scanner` routes** (redundant there).
- Sits **above** the bottom nav and clears the safe area:
  `bottom: calc(64px + 22px + env(safe-area-inset-bottom, 0px))`.
- `zIndex: 55` — must be **above** the MobileNav (`z-50`) or the nav clips its
  lower half. (This was a real bug; keep the FAB above the nav.)
- 58×58px, `primary → green` gradient, white icon. Min touch target ≥ 44px.

## 4. Touch & input rules

- **Tap targets ≥ 44px.** Icon buttons use `h-11`/`w-11` or 42–44px squares.
- **Inputs must use `text-base` (16px)** — anything smaller triggers iOS Safari
  zoom-on-focus. Pair with `h-11`.
- Prefer `active:` feedback (e.g. `active:scale-95`) over hover on touch UI;
  hover styles are a desktop nicety, not a requirement.

## 5. Cards & lists

Handler content is card-based. Reference implementation: the event card in
`app/(app)/events/_components/handler-events.tsx`.

- **Event card** is a vertical card: `w-full sm:w-[240px]`, `rounded-[24px]`,
  fixed-height cover (`h-[210px]`) with the title overlaid bottom-left over an
  image→accent gradient, then a footer bar (date chip · venue · time/timezone).
  Status shows as a small pill top-right of the cover.
- Cover images render as a **`background-image` div**, not `<img>` — avoids the
  `@next/next/no-img-element` lint and keeps cropping simple. (When an `<img>` is
  unavoidable, add the eslint-disable line as in the Settings org card.)
- Truncate long text: `truncate` for single lines, `line-clamp-2` for blurbs.
  Never let user content blow out a card's height.
- Lists stack full-width on mobile; multi-column only at `sm:`+.

## 6. Color & status tokens

Use CSS variables, never hard-coded hex (except inside gradients/overlays where a
literal is unavoidable). Common tokens: `--surface`, `--surface-2/3`,
`--text-strong/muted/faint`, `--border-hex`, `--primary-hex`, `--green-600`, and
the `*-soft` background variants.

**`StatusBadge` variants are a closed set:** `green · blue · orange · violet ·
pink · teal · gray · danger · primary · default`. **There is no `red`** — use
`danger`. Reach for the shared `StatusBadge` rather than rolling a custom pill.

## 7. Reusable primitives

Prefer these over bespoke markup: `PageHeader`, `Card`/`CardContent`, `StatTile`,
`StatusBadge`, `EmptyState`, `Tabs`, `Separator`, `Button`, `Input`. Every list/
fetch screen needs explicit **loading**, **error**, and **empty** states (use
`EmptyState` for empty).

## 8. Role-adaptive pages

A handler often shares a route with admin/manager (e.g. `/events`, `/dashboard`,
`/settings`). Branch by role rather than gating controls one-by-one:

- Read the role from the `gatherly_role` cookie server-side (`cookies()` in the
  page) or `getRole()` from `lib/auth/session` client-side — it reads sessionStorage
  then falls back to the persistent `gatherly_role` cookie, so the role survives an
  installed-PWA (Add to Home Screen) launch where sessionStorage starts empty. Never
  read `sessionStorage` for the role directly. Render a dedicated `Handler*`
  component (see `events/page.tsx` → `HandlerEvents`, `dashboard/page.tsx` →
  `HandlerDashboard`).
- Handler views are **read-only** for anything the §5 matrix doesn't grant them
  write access to. No create/edit/delete controls on handler screens.
- `proxy.ts` + `lib/auth/route-access.ts` guard routes for UX only; the backend
  `@PreAuthorize` is the real authority. Keep the two route lists in lockstep.

## 9. Data fetching in handler views

- Use the `lib/api/*` wrappers (`apiFetch`), never raw `fetch`.
- When a screen makes several independent reads, fetch with `Promise.allSettled`
  (or per-call `.catch`) so one failing/forbidden read can't blank the whole page.
- Show the backend `ApiError.message` on failure; a 403 should surface as an
  inline error card, not a crash.

---

**When in doubt:** design it for a phone, keep it read-only unless the matrix says
otherwise, reuse the primitives, and verify both the `md:hidden` mobile shell and
the `md:` desktop shell.
