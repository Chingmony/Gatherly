---
paths:
  - "frontend/**"
---

# Frontend rules

Applies when working under `frontend/` (Next.js 16 App Router, React 19, TypeScript 5 strict). See `docs/05-frontend-spec.md` for routing, form builder/renderer, and QR scanner.

## Always
- **Before any Next.js work, read the relevant doc in `frontend/node_modules/next/dist/docs/`** — training data lags the framework; the bundled docs are the source of truth (see `frontend/AGENTS.md`).
- Default to **Server Components**; add `"use client"` only when interactivity is required (state, effects, event handlers, browser APIs).
- TypeScript strict mode — no `any`, no implicit returns.

## UI & forms
- **shadcn/ui + Tailwind CSS only** — no other component library. Compose classes with `cn()`.
- **Zod** for all validation, mirroring backend DTOs — validate against the same contract the API enforces.
- **React Hook Form + Zod resolver** for forms.

## Project specifics
- Config is `next.config.ts` (TypeScript), not `next.config.js`. Build is `next build --webpack`; output is `standalone`; PWA is enabled.
- Images come from Rustfs via presigned URLs — allowed hosts live in `next.config.ts` `remotePatterns` (`http://localhost:9000/gatherly/**`). Add new hosts there.
- `proxy.ts` guards routes by global role for **UX only** — never treat it as the security boundary. The backend `@PreAuthorize` is authoritative.

## Commands (`frontend/`)
- `npm run dev` — http://localhost:3000
- `npm run lint` / `npm run format:check` / `tsc --noEmit` — CI gates
- `npm test` (Vitest) · `npm run e2e` (Playwright)