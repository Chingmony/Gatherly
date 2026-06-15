package com.gatherly.dto.event;

import com.gatherly.domain.EventStatus;
import java.time.Instant;
import java.util.UUID;

/** Event projection. {@code registeredCount} is derived (live submission count) for fill-rate UI. */
public record EventResponse(
    UUID id,
    String title,
    String slug,
    String category,
    Integer capacity,
    String description,
    String venue,
    String coverColor,
    String coverImageUrl,
    Instant startsAt,
    Instant endsAt,
    EventStatus status,
    long registeredCount,
    String registrationQrToken,
    Instant checkinOpensAt,
    UUID createdBy,
    Instant createdAt,
    Instant updatedAt) {}
