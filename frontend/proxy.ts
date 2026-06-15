import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Route guard (docs/05 §2). Next.js 16 `proxy.ts` (the renamed middleware) running on the Node
 * runtime. <b>UX-only</b>: it checks the access-token cookie and the coarse global role to keep
 * the URL honest — the API remains the real authority (every Server Action / fetch re-verifies).
 *
 * Route groups like {@code (admin)} don't add a path segment, so the admin user console lives at
 * {@code /users}; the admin-only prefixes below are gated to the global ADMIN role.
 *
 * {@code /users} and {@code /organization} are intentionally NOT here — organizers (Sub-admin/
 * Handler) may VIEW them read-only; the API enforces that writes stay Admin-only.
 */
const ADMIN_PREFIXES = ["/dashboard", "/supply-items"];

export function proxy(request: NextRequest) {
  const access = request.cookies.get("access_token")?.value;
  const { pathname } = request.nextUrl;

  if (!access) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (ADMIN_PREFIXES.some((p) => pathname.startsWith(p)) && decodeRole(access) !== "ADMIN") {
    return NextResponse.redirect(new URL("/forbidden", request.url));
  }

  return NextResponse.next();
}

function decodeRole(jwt: string): string | null {
  try {
    const payload = jwt.split(".")[1];
    const json = Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    return (JSON.parse(json).role as string) ?? null;
  } catch {
    return null;
  }
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/users",
    "/users/:path*",
    "/organization",
    "/organization/:path*",
    "/supply-items",
    "/supply-items/:path*",
    "/events",
    "/events/:path*",
    "/my-tasks/:path*",
  ],
};
