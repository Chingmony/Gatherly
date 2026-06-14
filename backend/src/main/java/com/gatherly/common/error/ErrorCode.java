package com.gatherly.common.error;

import org.springframework.http.HttpStatus;

/**
 * Stable, machine-readable error codes (docs/07 §4). The {@code name()} is the contract the
 * frontend branches on; {@link #status} is the HTTP status it maps to. Messages are
 * human-readable and supplied per-throw (translatable).
 */
public enum ErrorCode {

    MALFORMED_REQUEST(HttpStatus.BAD_REQUEST),
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST),

    UNAUTHENTICATED(HttpStatus.UNAUTHORIZED),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED),
    OTP_INVALID(HttpStatus.UNAUTHORIZED),
    OTP_EXPIRED(HttpStatus.UNAUTHORIZED),

    FORBIDDEN(HttpStatus.FORBIDDEN),

    NOT_FOUND(HttpStatus.NOT_FOUND),

    CONFLICT(HttpStatus.CONFLICT),
    ALREADY_CHECKED_IN(HttpStatus.CONFLICT),
    TICKET_INVALID(HttpStatus.CONFLICT),
    ILLEGAL_TRANSITION(HttpStatus.CONFLICT),
    NO_ACTIVE_FORM(HttpStatus.CONFLICT),

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
