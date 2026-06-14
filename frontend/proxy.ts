import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE } from '@/lib/auth/session'

// proxy.ts — per docs/05-frontend-spec.md §2 (replaces middleware.ts; Node.js runtime).
// UX guard only — the API is the real authority. Today it gates on a mock session
// cookie (lib/auth/session); swap to JWT verification when M1 lands.
//
// Public guest routes that live under /events/* must stay open:
//   /events/{id}            → public event detail
//   /events/{id}/register   → public registration
// Everything else the matcher catches (admin console + event workspace) requires
// a session, else we redirect to /login?next=…
const PUBLIC_EVENT = /^\/events\/[^/]+(\/register)?\/?$/

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_EVENT.test(pathname)) return NextResponse.next()

  const session = request.cookies.get(SESSION_COOKIE)
  if (!session) {
    const url = new URL('/login', request.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/users',
    '/users/:path*',
    '/supply-list',
    '/supply-list/:path*',
    '/guests',
    '/guests/:path*',
    '/scan',
    '/scan/:path*',
    '/organization',
    '/organization/:path*',
    '/events',
    '/events/:path*',
    '/my-tasks',
    '/my-tasks/:path*',
  ],
}
