import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { matchRule, LANDING } from '@/lib/auth/route-access'
import type { Role } from '@/lib/roles'

// proxy.ts — per docs/05-frontend-spec.md §2
// Runs on Node.js runtime (not edge). UX guard only — the API is the real authority.
//
// Signal: the JS-readable `gatherly_role` cookie set by `lib/auth/session.ts` on
// login. The httpOnly `access_token` is Path=/api/v1 and never reaches page routes,
// so this cookie is the only role hint the server sees. A spoofed cookie only
// changes which UI shell renders; the backend @PreAuthorize still gates all data.
const VALID: Role[] = ['admin', 'subadmin', 'handler']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const rule = matchRule(pathname)
  if (!rule) return NextResponse.next()

  const raw = request.cookies.get('gatherly_role')?.value
  const role = VALID.includes(raw as Role) ? (raw as Role) : null

  // Not signed in (no valid role cookie) → login.
  if (!role) return NextResponse.redirect(new URL('/login', request.url))

  // Signed in but this route isn't in the role's UI flow → its landing route.
  if (!rule.roles.includes(role)) {
    return NextResponse.redirect(new URL(LANDING[role], request.url))
  }

  return NextResponse.next()
}

// Explicit allowlist of protected routes. `/events/:id/register` (public) is
// never listed, so the public register flow is never proxied. `_next`, static,
// `/api`, auth and other public routes are likewise never matched.
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/tasks/:path*',
    '/settings/:path*',
    '/supply-list/:path*',
    '/organization/:path*',
    '/team/:path*',
    '/events',
    '/events/new/:path*',
    '/events/:id/workspace/:path*',
    '/events/:id/guests/:path*',
    '/events/:id/form-builder/:path*',
    '/events/:id/scanner/:path*',
  ],
}
