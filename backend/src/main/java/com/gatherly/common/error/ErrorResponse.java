package com.gatherly.common.error;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import java.time.Instant;
import java.util.List;

/**
 * Uniform error envelope for every non-2xx response.
 *
 * <p>Contract: {@code docs/07-validation-and-error-handling.md} §2.2. Mirrors the success {@link
 * com.gatherly.common.ApiResponse} shape — {@code success} and {@code timestamp} are always
 * present; here {@code success} is {@code false}. Never leaks stack traces, SQL, or internal class
 * names.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonPropertyOrder({
  "success",
  "timestamp",
  "status",
  "error",
  "message",
  "path",
  "traceId",
  "fieldErrors"
})
public record ErrorResponse(
    boolean success,
    Instant timestamp,
    int status,
    String error,
    String message,
    String path,
    String traceId,
    List<FieldErrorDetail> fieldErrors) {

  public static ErrorResponse of(
      ErrorCode code, String message, String path, String traceId, List<FieldErrorDetail> fields) {
    return new ErrorResponse(
        false,
        Instant.now(),
        code.status().value(),
        code.name(),
        message,
        path,
        traceId,
        fields == null || fields.isEmpty() ? null : fields);
  }
}
