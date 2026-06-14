package com.gatherly.common.error;

import java.util.List;

/**
 * Base application exception carrying a stable {@link ErrorCode} and optional field-level errors.
 * Services throw this (or a subclass); {@link GlobalExceptionHandler} maps it to the uniform error
 * envelope.
 */
public class ApiException extends RuntimeException {

  private final transient ErrorCode code;
  private final transient List<FieldErrorDetail> fieldErrors;

  public ApiException(ErrorCode code, String message) {
    this(code, message, null);
  }

  public ApiException(ErrorCode code, String message, List<FieldErrorDetail> fieldErrors) {
    super(message);
    this.code = code;
    this.fieldErrors = fieldErrors;
  }

  public ErrorCode getCode() {
    return code;
  }

  public List<FieldErrorDetail> getFieldErrors() {
    return fieldErrors;
  }

  public static ApiException notFound(String message) {
    return new ApiException(ErrorCode.NOT_FOUND, message);
  }

  public static ApiException conflict(String message) {
    return new ApiException(ErrorCode.CONFLICT, message);
  }

  public static ApiException forbidden(String message) {
    return new ApiException(ErrorCode.FORBIDDEN, message);
  }
}
