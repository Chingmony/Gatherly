package com.gatherly.dto.form;

import com.gatherly.domain.FormStatus;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Registration form projection (schema deserialized into typed field definitions). */
public record FormResponse(
    UUID id,
    UUID eventId,
    String title,
    FormStatus status,
    int version,
    List<FormField> fields,
    Instant createdAt,
    Instant updatedAt) {}
