package com.gatherly.agenda.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

/** A single agenda line in a replace request; order is the array index (docs/03 §4.4). */
public record AgendaItemRequest(
        @NotBlank @Size(max = 200) String title,
        Instant startsAt,
        Instant endsAt
) {
}
