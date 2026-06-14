---
name: design-implement
description: >-
  Fetch a Claude design (api.anthropic.com/v1/design/...) and implement it into the
  Gatherly stack. Use when asked to "implement the Claude design", "build the design",
  or given a design handoff URL. Covers fetching the design archive, summarizing intent
  + tokens, mapping the design onto the codebase's theme, and translating HTML/CSS into
  Next.js 16 / React 19 / TypeScript / shadcn / Framer Motion — never dropping raw
  prototype files in as-is.
---

# Design → Gatherly implementation

A repeatable flow for turning a Claude design handoff into production code in this repo,
while holding the architectural boundaries in `CLAUDE.md` and `docs/`.

## 1. Fetch & read first
- The design URL is an authenticated endpoint that returns a **gzip archive**, not HTML.
  `WebFetch` it — the binary is saved locally; extract with `tar xzf <file>` and read the
  `design_handoff_gatherly/` (or `export/src/`) bundle.
- Read in this order (per the handoff README): `README.md` (intent, roles, screens) →
  `styles.css` (**design tokens** — start here) → `data.js` (entity shapes) →
  `ui.jsx` (shell) → the specific `views_*.jsx` for the screen.
- **Summarize before coding:** layout, components, exact tokens (hex/spacing/radii/
  shadows/type), and which surfaces it covers. Note deviations from `docs/` scope
  (e.g. payments are out of v1).

## 2. Map design tokens onto our theme — do not copy raw CSS
- Canonical tokens live in `frontend/app/globals.css` (handoff names `--primary`,
  `--surface`, `--text`, `--radius-*`, `--shadow-*`, light + dark). Legacy `--ac/--bo/--ca`
  names are kept as `var()` aliases so older screens re-skin automatically.
- Translate prototype patterns to: **Next.js 16 App Router** (server-first RSC; `"use
  client"` only for interactivity), **shadcn-style primitives** in `components/ui/`,
  **Tailwind** with `var(--token)`, **Framer Motion** (reduced-motion-safe `Reveal` /
  `.view-anim`), **Zod-from-JSONB-schema** for dynamic forms, `lucide-react` icons,
  `next/font` for Plus Jakarta Sans + DM Mono.

## 3. Propagate through the stack only where a surface needs it
- New/changed fields or contracts → update the relevant `docs/` spec **in the same
  commit**, add a **forward-only Flyway migration** (use the `flyway-migration` charter),
  and update entity/DTO/mapper/service. Keep forms **JSONB/Zod-driven — no relational
  form tables** (`email` + `phone` always required).

## 4. Hold the boundaries (every increment)
- Every new/changed endpoint is **default-deny**, gated on the **service layer**
  (`@PreAuthorize`). Run the `authz-reviewer` charter after route/authz changes.
- Enforce the four absolute sub-admin restrictions (no delete user/event/supply-list,
  **no edit org profile**). Public routes are only `/public/**` + `/auth/**`.
- Binary assets go **direct-to-Rustfs via presigned URLs**, never through the heap.
- After new query methods, run the `db-query-reviewer` charter; after building UI, run
  the `frontend-design-reviewer` charter.

## 5. Work in committed, verifiable increments
- Phase the work (theme → schema → backend slices → frontend surfaces → verify). Commit
  each phase; run `./gradlew test` (Testcontainers) + `npm run build` before moving on;
  redeploy the docker stack so surfaces are clickable as they land.

> The named project sub-agents (`flyway-migration`, `authz-reviewer`, `db-query-reviewer`,
> `frontend-design-reviewer`) are read-only auditors — drive them at their triggers and
> fix what they flag before committing.
