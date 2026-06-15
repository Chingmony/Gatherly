package com.gatherly.publicsite;

import com.gatherly.agenda.dto.AgendaItemResponse;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Full public projection of a single PUBLIC event (docs/03 §4.9, design GuestEventDetail). Drives
 * the guest detail page: the hero (title/category/venue/dates/description/tags), the registration
 * gate ({@code registrationOpen} = an ACTIVE form exists), and the Schedule tab ({@code agenda}).
 * Read-only and unauthenticated — only ever built for events with status {@code PUBLIC}.
 */
public record PublicEventDetail(
        UUID id,
        String slug,
        String title,
        String category,
        String venue,
        Instant startsAt,
        Instant endsAt,
        String description,
        String coverGradient,
        long registered,
        Integer capacity,
        List<String> tags,
        boolean registrationOpen,
        List<AgendaItemResponse> agenda
) {
}
