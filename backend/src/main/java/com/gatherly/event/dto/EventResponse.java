package com.gatherly.event.dto;

import com.gatherly.event.domain.EventStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Event projection (docs/03 §4.4). */
public record EventResponse(
        UUID id,
        String title,
        String slug,
        String description,
        String venue,
        Instant startsAt,
        Instant endsAt,
        EventStatus status,
        String category,
        Integer capacity,
        List<String> tags,
        String coverGradient,
        String coverImageKey,
        Instant checkinOpensAt,
        UUID createdBy,
        Instant createdAt,
        Instant updatedAt
) {
}
