/**
 * Make an object-storage image URL safe to render on the deployed HTTPS site.
 *
 * Stored assets (avatars, event covers, org logo/banner) come back as
 * `http://<rustfs-host>:9000/...` presigned URLs. Referenced directly — a raw `<img>`
 * or a CSS `background-image: url(...)` — the browser blocks them as mixed content on
 * the HTTPS app. Routing them through Next's image optimizer makes the server fetch the
 * source and re-serve it same-origin over HTTPS.
 *
 * Local previews (`blob:`/`data:`) and already-secure (`https:`/relative) URLs are
 * returned unchanged. Components that use `next/image` directly don't need this — they
 * optimize automatically (just don't pass `unoptimized`); use this for raw `<img>` and
 * CSS backgrounds where the optimizer isn't applied for you.
 */
export function mediaUrl(url?: string | null, width = 1200): string | undefined {
  if (!url) return undefined;
  if (!url.startsWith("http://")) return url;
  return `/_next/image?url=${encodeURIComponent(url)}&w=${width}&q=75`;
}
