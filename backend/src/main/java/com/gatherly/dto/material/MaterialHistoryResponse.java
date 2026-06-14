package com.gatherly.dto.material;

import com.gatherly.domain.MaterialStatus;
import java.time.Instant;
import java.util.UUID;

/** One audit entry in a material's status history. */
public record MaterialHistoryResponse(
    UUID id,
    MaterialStatus fromStatus,
    MaterialStatus toStatus,
    UUID changedBy,
    String note,
    Instant createdAt) {}
