package com.gatherly.dto.storage;

import com.gatherly.domain.AssetPurpose;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/** Request a presigned upload URL ({@code docs/04} §4.4). */
public record PresignRequest(
    @NotNull AssetPurpose purpose, @NotBlank String contentType, @Positive long sizeBytes) {}
