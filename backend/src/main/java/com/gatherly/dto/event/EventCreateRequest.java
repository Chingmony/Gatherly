package com.gatherly.dto.event;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.Instant;

/**
 * Admin creates an event ({@code POST /events}). Starts in {@code DRAFT}; slug is auto-generated.
 */
public record EventCreateRequest(
    @NotBlank @Size(max = 200) String title,
    @Size(max = 50) String category,
    @Positive Integer capacity,
    @Size(max = 5000) String description,
    @Size(max = 300) String venue,
    @Size(max = 20) String coverColor,
    @Size(max = 500) String coverImageUrl,
    Instant startsAt,
    Instant endsAt,
    Instant checkinOpensAt) {}
