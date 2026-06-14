package com.gatherly.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

/**
 * Create-event payload (docs/03 §4.4). Admin-only. {@code slug} is auto-generated from the title
 * (unique); status starts {@code DRAFT}. Times are optional and validated for ordering server-side.
 */
public record CreateEventRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 5000) String description,
        @Size(max = 300) String venue,
        Instant startsAt,
        Instant endsAt
) {
}
