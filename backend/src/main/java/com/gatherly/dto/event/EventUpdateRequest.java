package com.gatherly.dto.event;

import jakarta.validation.constraints.Size;
import java.time.Instant;

/** Manager/Admin edits event details ({@code PUT /events/{id}}). Null fields are left unchanged. */
public record EventUpdateRequest(
    @Size(max = 200) String title,
    @Size(max = 5000) String description,
    @Size(max = 300) String venue,
    Instant startsAt,
    Instant endsAt,
    Instant checkinOpensAt) {}
