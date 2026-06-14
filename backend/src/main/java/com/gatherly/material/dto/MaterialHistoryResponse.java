package com.gatherly.material.dto;

import com.gatherly.material.domain.MaterialStatus;

import java.time.Instant;
import java.util.UUID;

/**
 * One audited material status transition (docs/03 §4.7 — history). {@code fromStatus} is null for
 * the material's first row; {@code changedByName} is batch-loaded by the service.
 */
public record MaterialHistoryResponse(
        UUID id,
        UUID materialId,
        MaterialStatus fromStatus,
        MaterialStatus toStatus,
        UUID changedBy,
        String changedByName,
        String note,
        Instant createdAt
) {
}
