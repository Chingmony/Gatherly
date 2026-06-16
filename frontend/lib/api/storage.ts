/**
 * Storage surface — brokers presigned uploads to Rustfs (S3-compatible). The API never proxies
 * file bytes: we ask the backend for a short-lived presigned PUT URL, upload the file straight to
 * storage, then persist the returned `objectKey` on the owning entity (e.g. a user's avatar).
 */
import { apiFetch } from "./client";

export type AssetPurpose = "ORG_LOGO" | "ORG_BANNER" | "USER_AVATAR" | "EVENT_COVER";

export interface PresignResponse {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string | null;
}

/** Ask the backend for a presigned PUT URL for a given purpose/content-type/size. */
export function presign(
  purpose: AssetPurpose,
  contentType: string,
  sizeBytes: number,
): Promise<PresignResponse> {
  return apiFetch<PresignResponse>("/storage/presign", {
    method: "POST",
    body: { purpose, contentType, sizeBytes },
  });
}

/**
 * Upload an image for a given purpose and return its storage object key. Flow: presign → PUT bytes
 * directly to Rustfs → return `objectKey` to persist on the owning entity. Throws on a non-2xx
 * upload.
 */
export async function uploadImage(file: File, purpose: AssetPurpose): Promise<string> {
  const { uploadUrl, objectKey } = await presign(purpose, file.type, file.size);
  const res = await fetch(toUploadTarget(uploadUrl), {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) {
    throw new Error(`Image upload failed (${res.status}).`);
  }
  return objectKey;
}

/**
 * The presigned PUT URL targets the object store over plain HTTP, which the browser blocks
 * as mixed content on the HTTPS site. Route it through the same-origin `/rustfs-proxy/*`
 * Route Handler (see `app/rustfs-proxy/[...path]/route.ts`), which re-issues the PUT to the
 * store server-side — so Node sets `Host` to the store host and the SigV4 signature (over
 * `content-type;host`) still validates. The path + query (where the signature lives) are
 * preserved verbatim. A non-`http://` URL (e.g. an HTTPS store, or local dev) is unchanged.
 */
function toUploadTarget(uploadUrl: string): string {
  if (!uploadUrl.startsWith("http://")) return uploadUrl;
  const u = new URL(uploadUrl);
  return `/rustfs-proxy${u.pathname}${u.search}`;
}

/** Upload a user profile image; returns its object key. */
export const uploadAvatar = (file: File) => uploadImage(file, "USER_AVATAR");

/** Upload an event cover image; returns its object key. */
export const uploadEventCover = (file: File) => uploadImage(file, "EVENT_COVER");

/** Upload the organization logo (ADMIN); returns its object key. */
export const uploadOrgLogo = (file: File) => uploadImage(file, "ORG_LOGO");

/** Upload the organization banner (ADMIN); returns its object key. */
export const uploadOrgBanner = (file: File) => uploadImage(file, "ORG_BANNER");
