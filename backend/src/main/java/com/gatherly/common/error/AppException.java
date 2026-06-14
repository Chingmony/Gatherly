package com.gatherly.common.error;

/**
 * Base for all Gatherly domain exceptions: pairs an {@link ErrorCode} with a human-readable
 * message so {@link GlobalExceptionHandler} can render the uniform contract without per-type
 * mapping. Subclasses pin the code for common cases.
 */
public class AppException extends RuntimeException {

    private final ErrorCode code;

    public AppException(ErrorCode code, String message) {
        super(message);
        this.code = code;
    }

    public ErrorCode code() {
        return code;
    }
}
