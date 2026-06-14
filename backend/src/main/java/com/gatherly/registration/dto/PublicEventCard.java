package com.gatherly.registration.dto;

import java.time.Instant;
import java.util.UUID;

/** A PUBLIC event as shown on the guest homepage grid (docs/03 §4.9, design GuestHome). */
public record PublicEventCard(
        UUID id,
        String slug,
        String title,
        String category,
        String venue,
        Instant startsAt,
        String coverGradient,
        String coverImageKey,
        long registered,
        Integer capacity
) {
}
