package com.gatherly.dto.event;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;

/**
 * Admin creates an event ({@code POST /events}). Starts in {@code DRAFT}; slug is auto-generated.
 */
public record EventCreateRequest(
    @NotBlank @Size(max = 200) String title,
    @Size(max = 5000) String description,
    @Size(max = 300) String venue,
    Instant startsAt,
    Instant endsAt,
    Instant checkinOpensAt) {}
