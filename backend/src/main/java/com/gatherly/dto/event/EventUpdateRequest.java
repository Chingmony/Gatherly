package com.gatherly.dto.event;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.Instant;

/** Manager/Admin edits event details ({@code PUT /events/{id}}). Null fields are left unchanged. */
public record EventUpdateRequest(
    @Size(max = 200) String title,
    @Size(max = 50) String category,
    @Positive Integer capacity,
    @Size(max = 5000) String description,
    @Size(max = 300) String venue,
    @Size(max = 20) String coverColor,
    @Size(max = 500) String coverImageUrl,
    Instant startsAt,
    Instant endsAt,
    Instant checkinOpensAt) {}
