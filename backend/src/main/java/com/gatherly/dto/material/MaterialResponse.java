package com.gatherly.dto.material;

import com.gatherly.domain.MaterialPriority;
import com.gatherly.domain.MaterialStatus;
import java.time.Instant;
import java.util.UUID;

/** Material projection. */
public record MaterialResponse(
    UUID id,
    UUID eventId,
    UUID catalogItemId,
    String name,
    String description,
    Integer quantity,
    String category,
    MaterialPriority priority,
    Instant dueAt,
    MaterialStatus status,
    UUID assignedTo,
    UUID createdBy,
    Instant createdAt,
    Instant updatedAt) {}
