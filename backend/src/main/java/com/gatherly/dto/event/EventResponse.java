package com.gatherly.dto.event;

import com.gatherly.domain.EventCategory;
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
    EventCategory category,
    Integer capacity,
    String coverKey,
    String coverUrl,
    long registeredCount,
    long managerCount,
    long handlerCount,
    String registrationQrToken,
    Instant checkinOpensAt,
    UUID createdBy,
    Instant createdAt,
    Instant updatedAt) {}
