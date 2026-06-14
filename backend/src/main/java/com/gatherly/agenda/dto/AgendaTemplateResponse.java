package com.gatherly.agenda.dto;

import tools.jackson.databind.JsonNode;

import java.util.UUID;

/**
 * Global agenda template (docs/03 §4.4 GET /agenda-templates). {@code items} is the parsed JSON
 * array {@code [{title, durationMin, order}]} so the form-builder can apply it directly.
 */
public record AgendaTemplateResponse(
        UUID id,
        String name,
        JsonNode items,
        boolean isDefault
) {
}
