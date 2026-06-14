package com.gatherly.registration.dto;

import jakarta.validation.constraints.NotNull;
import tools.jackson.databind.JsonNode;

/**
 * Guest registration payload (docs/03 §4.9). {@code answers} is the keyed answer object validated
 * server-side against the event's active form schema (docs/07 §3); {@code email}+{@code phone} are
 * required by that schema.
 */
public record RegisterRequest(
        @NotNull JsonNode answers
) {
}
