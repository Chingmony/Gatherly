package com.gatherly.common.error;

import java.time.Instant;
import java.util.List;

/**
 * The uniform error body returned by every non-2xx response (docs/07 §2). Produced solely by
 * {@link GlobalExceptionHandler} (and the security entry-point/handlers). Never leaks stack
 * traces, SQL, or internal class names.
 */
public record ApiError(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        String traceId,
        List<ApiFieldError> fieldErrors
) {

    public static ApiError of(ErrorCode code, String message, String path, String traceId) {
        return new ApiError(Instant.now(), code.status().value(), code.name(), message, path, traceId, null);
    }

    public static ApiError of(ErrorCode code, String message, String path, String traceId,
                              List<ApiFieldError> fieldErrors) {
        return new ApiError(Instant.now(), code.status().value(), code.name(), message, path, traceId, fieldErrors);
    }
}
