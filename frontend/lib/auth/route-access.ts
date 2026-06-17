/**
 * Single source of truth for which UI role may visit which route — a strict
 * server-side mirror of the `roles` arrays in `components/layout/sidebar.tsx`.
 *
 * Consumed by `proxy.ts` (server-side route guard). This is a UX guard only;
 * the backend `@PreAuthorize` is the real authority. If sidebar nav access
 * changes, update `ROUTE_RULES` in lockstep.
 */
import type { Role } from '@/lib/roles'

const ALL: Role[] = ['admin', 'subadmin', 'handler']

export interface RouteRule {
  /** Tested against the pathname (no query string). */
  test: RegExp
  /** Roles allowed to view a route matching `test`. */
  roles: Role[]
}

/**
 * Ordered, first-match-wins. Specific `/events/[id]/*` sub-routes precede the
 * generic `/events` so scanner/form-builder/etc. win over the list rule.
 * `/events/[id]/register` is intentionally absent — it is public and the
 * proxy matcher never routes it here.
 */
export const ROUTE_RULES: RouteRule[] = [
  { test: /^\/events\/[^/]+\/scanner(\/|$)/, roles: ALL },
  { test: /^\/events\/[^/]+\/form-builder(\/|$)/, roles: ['admin', 'subadmin'] },
  { test: /^\/events\/[^/]+\/workspace(\/|$)/, roles: ['admin', 'subadmin'] },
  { test: /^\/events\/[^/]+\/guests(\/|$)/, roles: ['admin', 'subadmin'] },
  { test: /^\/events\/new(\/|$)/, roles: ['admin'] }, // create + publish are Admin-only (spec §5)
  // Handlers reach the events list and the read-only event detail (`/events/[id]`);
  // both are single-segment. Deeper `/events/[id]/edit` etc. fall through to the
  // generic admin/subadmin rule below.
  { test: /^\/events$/, roles: ALL },
  { test: /^\/events\/[^/]+$/, roles: ALL },
  { test: /^\/events(\/|$)/, roles: ['admin', 'subadmin'] },
  { test: /^\/dashboard(\/|$)/, roles: ALL },
  { test: /^\/tasks(\/|$)/, roles: ['subadmin', 'handler'] }, // admin blocked → dashboard
  { test: /^\/settings(\/|$)/, roles: ALL },
  { test: /^\/supply-list(\/|$)/, roles: ['admin'] },
  { test: /^\/organization(\/|$)/, roles: ['admin'] },
  { test: /^\/team(\/|$)/, roles: ['admin'] },
]

/** First rule whose `test` matches `pathname`, or `null` if none. */
export function matchRule(pathname: string): RouteRule | null {
  return ROUTE_RULES.find((r) => r.test.test(pathname)) ?? null
}

/**
 * Where each role lands after login and on forbidden-route redirects. Unified
 * on `/dashboard` today (the dashboard adapts per role); kept as a map so a
 * future per-role landing is a one-line change.
 */
export const LANDING: Record<Role, string> = {
  admin: '/dashboard',
  subadmin: '/dashboard',
  handler: '/dashboard',
}
