package com.gatherly.form.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import tools.jackson.databind.JsonNode;

/**
 * Build/edit the registration form (docs/03 §4.8). {@code schema} is the ordered field-definition
 * array (docs/02 §6.1); it is persisted verbatim as JSONB. Only editable while the form is DRAFT.
 */
public record UpdateFormRequest(
        @Size(max = 200) String title,
        @NotNull JsonNode schema
) {
}
