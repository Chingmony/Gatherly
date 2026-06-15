package com.gatherly.dto.event;

import java.time.Instant;
import java.util.UUID;

/**
 * Slim, public-safe view of a PUBLIC event for the unauthenticated discovery list ({@code
 * GET /public/events}). Deliberately omits internal fields (status, registration QR token,
 * createdBy, audit timestamps) to avoid leaking them to guests.
 */
public record PublicEventResponse(
    UUID id,
    String title,
    String slug,
    String description,
    String venue,
    Instant startsAt,
    Instant endsAt) {}
