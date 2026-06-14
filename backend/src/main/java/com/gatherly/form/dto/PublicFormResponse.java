package com.gatherly.form.dto;

import tools.jackson.databind.JsonNode;

import java.util.UUID;

/**
 * Public, render-only view of an active registration form (docs/03 §4.9) — what a guest's browser
 * needs to build the form. No internal ids/status beyond what rendering + submission require.
 */
public record PublicFormResponse(
        UUID eventId,
        String eventTitle,
        String formTitle,
        JsonNode schema,
        int version
) {
}
