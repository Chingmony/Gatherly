package com.gatherly.dto.storage;

/**
 * Presigned-upload result. The client PUTs the file to {@code uploadUrl}, then persists {@code
 * objectKey} on the owning entity ({@code PUT /organization} or {@code PUT /me}).
 */
public record PresignResponse(String uploadUrl, String objectKey, String publicUrl) {}
