package com.gatherly.form.dto;

import com.gatherly.form.domain.FormStatus;
import tools.jackson.databind.JsonNode;

import java.time.Instant;
import java.util.UUID;

/** Registration form projection (docs/03 §4.8). {@code schema} returned parsed for the builder. */
public record FormResponse(
        UUID id,
        UUID eventId,
        String title,
        FormStatus status,
        JsonNode schema,
        int version,
        Instant createdAt,
        Instant updatedAt
) {
}
