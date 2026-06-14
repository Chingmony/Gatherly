package com.gatherly.agenda.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Full-replace agenda payload (docs/03 §4.4 — "apply template / reorder"). The provided list
 * becomes the event's agenda in order; an empty list clears it.
 */
public record UpdateAgendaRequest(
        @NotNull @Valid @Size(max = 200) List<AgendaItemRequest> items
) {
}
