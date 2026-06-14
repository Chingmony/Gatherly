package com.gatherly.agenda.dto;

import java.util.List;
import java.util.UUID;

/** An event's full agenda (docs/03 §4.4 GET /events/{id}/agenda). */
public record AgendaResponse(
        UUID eventId,
        List<AgendaItemResponse> items
) {
}
