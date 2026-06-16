import type { NextRequest } from "next/server";

// Same-origin proxy for presigned object-store uploads. The backend issues presigned PUT
// URLs at http://<rustfs>:9000/... — a direct browser PUT from the HTTPS site is blocked as
// mixed content, and a plain next.config rewrite breaks the SigV4 signature (signed over
// content-type;host) because Vercel forwards a different Host. Re-issuing the request from a
// Node route handler fixes that: fetch() to the http origin sets Host to the store host
// automatically, so the signature validates. The path and query string (which carry the
// signature) are forwarded verbatim, and Content-Type is preserved (it's part of the sig).
//
// Note: runs as a serverless function, so the request body is subject to Vercel's ~4.5 MB
// limit — uploads larger than that will fail here even though the UI allows up to 5 MB.

const RUSTFS_ORIGIN = process.env.RUSTFS_ORIGIN ?? "http://96.9.81.187:9000";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function forward(req: NextRequest, method: "PUT" | "GET") {
  const url = new URL(req.url);
  const subPath = url.pathname.replace(/^\/rustfs-proxy/, "");
  const target = `${RUSTFS_ORIGIN}${subPath}${url.search}`;

  const headers: Record<string, string> = {};
  const contentType = req.headers.get("content-type");
  if (contentType) headers["content-type"] = contentType;

  const upstream = await fetch(target, {
    method,
    headers,
    body: method === "PUT" ? await req.arrayBuffer() : undefined,
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "application/octet-stream",
      "cache-control": "no-store",
    },
  });
}

export function PUT(req: NextRequest) {
  return forward(req, "PUT");
}

export function GET(req: NextRequest) {
  return forward(req, "GET");
}
