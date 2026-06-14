package com.gatherly.common.error;

/**
 * A single field-level validation failure inside {@link ErrorResponse#fieldErrors()}.
 *
 * @param field the offending field/property name
 * @param code a stable validation code (e.g. {@code REQUIRED}, {@code PATTERN})
 * @param message human-readable detail
 */
public record FieldErrorDetail(String field, String code, String message) {}
