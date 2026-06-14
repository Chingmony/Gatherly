package com.gatherly.common.error;

import org.springframework.http.HttpStatus;

/**
 * Stable, machine-readable error codes mapped to HTTP status.
 *
 * <p>Catalog: {@code docs/07-validation-and-error-handling.md} §4 and {@code
 * docs/03-api-routes-security.md} §6. The {@code name()} is the wire value of the {@code error}
 * field — never rename a value without a contract change.
 */
public enum ErrorCode {
  VALIDATION_ERROR(HttpStatus.BAD_REQUEST),
  MALFORMED_REQUEST(HttpStatus.BAD_REQUEST),
  UNAUTHENTICATED(HttpStatus.UNAUTHORIZED),
  FORBIDDEN(HttpStatus.FORBIDDEN),
  NOT_FOUND(HttpStatus.NOT_FOUND),
  CONFLICT(HttpStatus.CONFLICT),
  NO_ACTIVE_FORM(HttpStatus.CONFLICT),
  ALREADY_CHECKED_IN(HttpStatus.CONFLICT),
  TICKET_INVALID(HttpStatus.CONFLICT),
  RATE_LIMITED(HttpStatus.TOO_MANY_REQUESTS),
  INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR);

  private final HttpStatus status;

  ErrorCode(HttpStatus status) {
    this.status = status;
  }

  public HttpStatus status() {
    return status;
  }
}
