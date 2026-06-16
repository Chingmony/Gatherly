---
name: image-uploads-api-brokered
description: Image uploads (avatar, event cover) go through API-brokered multipart, not the presigned-URL flow
metadata:
  type: project
---

Image uploads in Gatherly are **API-brokered multipart**, not the presigned PUT flow that CLAUDE.md gotcha #7 / `docs/04` describe. The browser cannot reach Rustfs directly (no CORS / private endpoint `96.9.81.187:9000`), so the frontend POSTs the file to the API, which stores it via `StorageService.store(AssetPurpose, bytes, contentType)` and persists the returned **object key**.

- Avatar: `POST /me/avatar` (multipart) → `AssetPurpose.USER_AVATAR`; `UserMapper` resolves the key to a presigned GET URL on read.
- Event cover: `POST /events/{eventId}/cover` (multipart) → `AssetPurpose.EVENT_COVER`; gated `@eventSecurity.canManage` (ADMIN or event MANAGER). `EventMapper` presigns the stored key on read (and passes through absolute http(s) URLs for back-compat). Added because admins could not upload a cover at create time — the event is created first (DRAFT), then the cover is uploaded.

**Why:** the presign endpoint (`POST /storage/presign`) exists but is effectively unused for these because direct browser→Rustfs uploads fail. **How to apply:** for any new image-upload feature, mirror this multipart pattern (store key, presign on read); set `spring.servlet.multipart.max-file-size` to match the 5 MB cap in `StorageServiceImpl`. The `cover_image_url`/`coverImageUrl` field stores an object **key**, not a URL.
