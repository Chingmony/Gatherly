import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// proxy.ts — per docs/05-frontend-spec.md §2
// Runs on Node.js runtime (not edge). UX guard only — API is the real authority.
export async function proxy(request: NextRequest) {
  // const access = request.cookies.get('access_token')

  // if (!access) {
  //   // TODO M1: attempt silent refresh via /auth/refresh cookie, redirect to login on failure
  //   return NextResponse.redirect(
  //     new URL('/login?next=' + encodeURIComponent(request.nextUrl.pathname), request.url)
  //   )
  // }

  // TODO M1: decode role claim and enforce admin-only routes
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/events/:path*', '/my-tasks/:path*', '/organization/:path*'],
}
