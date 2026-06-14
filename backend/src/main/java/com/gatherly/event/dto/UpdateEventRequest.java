package com.gatherly.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

/**
 * Update-event payload (docs/03 §4.4). Gated by {@code canManage}. Lifecycle status is changed via
 * the dedicated {@code publish}/{@code archive} endpoints, not here, so it is intentionally absent.
 */
public record UpdateEventRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 5000) String description,
        @Size(max = 300) String venue,
        Instant startsAt,
        Instant endsAt
) {
}
