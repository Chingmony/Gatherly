package com.gatherly.event.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

/**
 * Create-event payload (docs/03 §4.4). Admin-only. {@code slug} is auto-generated from the title
 * (unique); status starts {@code DRAFT}. Times are optional and validated for ordering server-side.
 * {@code capacity} null = unlimited; {@code coverGradient} is a preset key a–f.
 */
public record CreateEventRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 5000) String description,
        @Size(max = 300) String venue,
        @Size(max = 60) String category,
        @PositiveOrZero Integer capacity,
        @Size(max = 12) List<@Size(max = 40) String> tags,
        @Pattern(regexp = "[a-f]") String coverGradient,
        String coverImageKey,
        Instant startsAt,
        Instant endsAt
) {
}
