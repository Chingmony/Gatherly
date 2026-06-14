package com.gatherly.common.error;

/**
 * A single field-level validation failure (docs/07 §2). {@code code} is a stable machine code
 * (e.g. {@code REQUIRED}, {@code PATTERN}); {@code message} is human-readable.
 */
public record ApiFieldError(String field, String code, String message) {
}
