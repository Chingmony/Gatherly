package com.gatherly.dto.form;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.gatherly.domain.FormFieldType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

/**
 * One field definition in a form schema ({@code docs/02} §6.1). {@code key} is unique within a form
 * and immutable once submissions exist; {@code order} drives render order; {@code options} is for
 * {@code select}/{@code multiselect}.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record FormField(
    @NotBlank String key,
    @NotBlank String label,
    @NotNull FormFieldType type,
    boolean required,
    int order,
    List<String> options,
    FormFieldValidation validation) {}
