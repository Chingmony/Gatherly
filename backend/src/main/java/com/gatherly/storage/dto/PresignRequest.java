package com.gatherly.storage.dto;

import com.gatherly.storage.StoragePurpose;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Presign request (docs/04 §4.4 step 1). {@code purpose} selects the key layout + authz gate;
 * {@code contentType}/{@code sizeBytes} are validated against the allowlist + max before signing.
 */
public record PresignRequest(
        @NotNull StoragePurpose purpose,
        @NotBlank String contentType,
        @Positive long sizeBytes
) {
}
