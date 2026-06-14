package com.gatherly.common.error;

/**
 * A 409-class conflict carrying a specific code — e.g. {@link ErrorCode#ALREADY_CHECKED_IN},
 * {@link ErrorCode#TICKET_INVALID}, {@link ErrorCode#ILLEGAL_TRANSITION},
 * {@link ErrorCode#NO_ACTIVE_FORM}, or generic {@link ErrorCode#CONFLICT} (docs/07 §5).
 */
public class DomainConflictException extends AppException {

    public DomainConflictException(ErrorCode code, String message) {
        super(code, message);
    }
}
