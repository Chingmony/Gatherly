package com.gatherly.material.dto;

import com.gatherly.material.domain.MaterialStatus;

import java.time.Instant;
import java.util.UUID;

/**
 * An event material/task with its current state and assignee display name (docs/03 §4.7). The name
 * is batch-loaded by the service to keep list reads N+1-free (docs/06 §8).
 */
public record MaterialResponse(
        UUID id,
        UUID eventId,
        UUID catalogItemId,
        String name,
        String description,
        Integer quantity,
        MaterialStatus status,
        UUID assignedTo,
        String assignedToName,
        UUID createdBy,
        Instant createdAt,
        Instant updatedAt
) {
}
