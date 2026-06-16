package com.gatherly.dto.form;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/** Create/edit a reusable form template ({@code POST/PUT /form-templates}). */
public record FormTemplateRequest(
    @NotBlank @Size(max = 200) String name,
    @NotBlank @Size(max = 80) String eventType,
    @NotBlank @Size(max = 200) String title,
    @NotNull List<@Valid FormField> fields) {}
