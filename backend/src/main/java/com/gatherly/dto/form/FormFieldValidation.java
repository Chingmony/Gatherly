package com.gatherly.dto.form;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Optional per-field validation constraints ({@code docs/02} §6.1). {@code minLength}/{@code
 * maxLength} apply to text; {@code min}/{@code max} to numbers; {@code pattern} is a regex.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record FormFieldValidation(
    Integer minLength, Integer maxLength, Double min, Double max, String pattern) {}
