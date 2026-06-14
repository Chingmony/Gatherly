package com.gatherly.storage.dto;

/**
 * Presign response (docs/04 §4.4 step 2): the client PUTs the file straight to {@code uploadUrl},
 * then commits {@code objectKey} back via {@code PUT /organization} or {@code PUT /me}.
 */
public record PresignResponse(
        String uploadUrl,
        String objectKey,
        String publicUrl
) {
}
