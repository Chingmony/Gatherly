# Handler Side Design rules

Applies to all handler-side pages (anything rendered for `role === "handler"`, or
shared routes in their handler variant).

# Design
- Designing pages or components for Handler role must also add responsiveness and mobile-first design principles, as many handlers may access the system via mobile devices while on the go.
- Follow this design document for consistent Mobile Design ref: **`frontend/docs/handler-mobile-design.md`** — read it before doing any handler UI work; it is the source of truth for the handler shell, bottom nav, FAB, cards, color tokens, and reusable primitives.

## Non-negotiables
- **Mobile-first.** Build for a 360–430px viewport first, then scale up. `md` (768px) is the divide: below = bottom nav + FAB shell, at/above = sidebar. Verify both.
- **Touch targets ≥ 44px;** inputs use `text-base` (16px) + `h-11` to avoid iOS zoom-on-focus.
- **Respect the iOS safe area** (`env(safe-area-inset-bottom)`) on fixed bottom elements; the FAB stays above the bottom nav (`z-55` > nav `z-50`).
- **shadcn/ui + Tailwind only**, composed with `cn()`. Reuse shared primitives (`PageHeader`, `Card`, `StatTile`, `StatusBadge`, `EmptyState`, `Tabs`, `Button`, `Input`).
- **CSS variable tokens, not hard-coded hex** (gradients/overlays excepted). `StatusBadge` has no `red` — use `danger`.
- **Handler screens are read-only** unless the §5 RBAC matrix grants write access — no create/edit/delete controls. Branch role-adaptive routes into a dedicated `Handler*` component.
- Every fetch screen has explicit **loading / error / empty** states; use `Promise.allSettled` for independent reads so one failure can't blank the page.
