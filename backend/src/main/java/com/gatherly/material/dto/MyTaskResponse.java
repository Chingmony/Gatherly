package com.gatherly.material.dto;

import com.gatherly.material.domain.MaterialStatus;

import java.time.Instant;
import java.util.UUID;

/**
 * A Handler's assigned task with its owning-event context (docs/03 §4.7 — {@code GET /materials/mine}).
 * Powers the cross-event Handler "My Tasks" view (docs/05 §6); the event title is batch-loaded.
 */
public record MyTaskResponse(
        UUID id,
        UUID eventId,
        String eventTitle,
        String name,
        String description,
        Integer quantity,
        MaterialStatus status,
        Instant createdAt,
        Instant updatedAt
) {
}
