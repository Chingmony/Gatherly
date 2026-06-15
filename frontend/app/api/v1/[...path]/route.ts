import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Server-side backend origin the proxy forwards to. Override per environment
// with BACKEND_URL; defaults to local dev.
const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8080";

async function handler(req: NextRequest): Promise<NextResponse> {
  const { pathname, search } = req.nextUrl;
  const target = `${BACKEND}${pathname}${search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    // Strip hop-by-hop and browser-only headers — this is a server-to-server call
    if (k === "host" || k === "origin" || k === "referer") return;
    headers.set(key, value);
  });
  // Explicitly ensure the cookie header is forwarded (carries the auth cookies).
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) headers.set("cookie", cookieHeader);

  const hasBody = req.method !== "GET" && req.method !== "HEAD";

  let backendRes: Response;
  try {
    backendRes = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? req.body : undefined,
      // @ts-expect-error Node.js fetch requires duplex for streaming request body
      duplex: hasBody ? "half" : undefined,
    });
  } catch {
    return NextResponse.json(
      { error: "NETWORK_ERROR", message: "Backend unreachable" },
      { status: 502 },
    );
  }

  const resHeaders = new Headers();
  backendRes.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "set-cookie") {
      resHeaders.set(key, value);
    }
  });
  // Preserve all Set-Cookie headers — .set() would drop duplicates
  const cookies = backendRes.headers.getSetCookie?.() ?? [];
  cookies.forEach((c) => resHeaders.append("set-cookie", c));

  return new NextResponse(backendRes.body, {
    status: backendRes.status,
    statusText: backendRes.statusText,
    headers: resHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
