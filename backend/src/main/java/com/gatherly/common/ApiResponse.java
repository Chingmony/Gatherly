package com.gatherly.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import java.time.Instant;

/**
 * Uniform success envelope wrapping every 2xx response body.
 *
 * <p>Contract defined in {@code docs/07-validation-and-error-handling.md} §2.1. {@code success} and
 * {@code timestamp} are always present; {@code pagination} appears only for paginated collections.
 *
 * @param <T> the payload type (a single resource object, or a collection)
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonPropertyOrder({"success", "message", "data", "pagination", "timestamp"})
public record ApiResponse<T>(
    boolean success, String message, T data, PageMeta pagination, Instant timestamp) {

  /** Single-resource success with a custom message. */
  public static <T> ApiResponse<T> ok(String message, T data) {
    return new ApiResponse<>(true, message, data, null, Instant.now());
  }

  /** No-content success (e.g. 204 / delete) with a message and {@code null} data. */
  public static <T> ApiResponse<T> ok(String message) {
    return new ApiResponse<>(true, message, null, null, Instant.now());
  }

  /** Paginated-collection success: {@code data} is the page content, plus a {@link PageMeta}. */
  public static <T> ApiResponse<T> page(String message, T data, PageMeta pagination) {
    return new ApiResponse<>(true, message, data, pagination, Instant.now());
  }
}
