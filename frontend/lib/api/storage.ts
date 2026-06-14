import { apiFetch } from "./client";
import type { PresignBody, PresignResponse, StoragePurpose } from "./types";

/** Request a presigned PUT URL (docs/04 §4.4 step 1). */
export function presignUpload(body: PresignBody): Promise<PresignResponse> {
  return apiFetch<PresignResponse>("/storage/presign", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * Full upload flow (docs/04 §4.4): presign → PUT the file straight to Rustfs → return the object
 * key for the caller to persist via {@code PUT /organization} or {@code PUT /me}.
 */
export async function uploadAsset(file: File, purpose: StoragePurpose): Promise<string> {
  const { uploadUrl, objectKey } = await presignUpload({
    purpose,
    contentType: file.type,
    sizeBytes: file.size,
  });
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) {
    throw new Error("Upload to storage failed.");
  }
  return objectKey;
}
