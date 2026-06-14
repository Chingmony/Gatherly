package com.gatherly.dto.registration;

import com.gatherly.dto.form.FormField;
import java.util.List;
import java.util.UUID;

/** Public view of an event's active registration form (schema for the guest renderer). */
public record PublicFormResponse(
    UUID eventId, String slug, String eventTitle, String formTitle, List<FormField> fields) {}
