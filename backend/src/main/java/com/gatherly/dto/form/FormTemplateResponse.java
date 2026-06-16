package com.gatherly.dto.form;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Reusable form-template projection (schema deserialized into typed field definitions). */
public record FormTemplateResponse(
    UUID id,
    String name,
    String eventType,
    String title,
    List<FormField> fields,
    Instant createdAt,
    Instant updatedAt) {}
