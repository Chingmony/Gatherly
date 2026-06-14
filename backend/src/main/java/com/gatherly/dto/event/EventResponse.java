package com.gatherly.dto.event;

import com.gatherly.domain.EventStatus;
import java.time.Instant;
import java.util.UUID;

/** Event projection. */
public record EventResponse(
    UUID id,
    String title,
    String slug,
    String description,
    String venue,
    Instant startsAt,
    Instant endsAt,
    EventStatus status,
    String registrationQrToken,
    Instant checkinOpensAt,
    UUID createdBy,
    Instant createdAt,
    Instant updatedAt) {}
