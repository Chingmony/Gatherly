package com.gatherly.agenda.dto;

import java.time.Instant;
import java.util.UUID;

/** A persisted agenda line (docs/03 §4.4). */
public record AgendaItemResponse(
        UUID id,
        String title,
        String section,
        Instant startsAt,
        Instant endsAt,
        int position
) {
}
