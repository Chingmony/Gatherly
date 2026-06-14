package com.gatherly.dto.form;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/** Build/edit a form's schema while DRAFT ({@code PUT /events/{eventId}/form}). */
public record FormSchemaRequest(
    @NotBlank @Size(max = 200) String title, @NotNull List<@Valid FormField> fields) {}
