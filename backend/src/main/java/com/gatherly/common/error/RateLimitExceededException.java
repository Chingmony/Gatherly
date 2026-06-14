package com.gatherly.common.error;

/**
 * Throttled request → {@code 429 RATE_LIMITED} (+ {@code Retry-After}, docs/07 §5). Wired to
 * Redis counters on auth/public endpoints from M9; defined now to complete the catalog.
 */
public class RateLimitExceededException extends AppException {

    private final long retryAfterSeconds;

    public RateLimitExceededException(String message, long retryAfterSeconds) {
        super(ErrorCode.RATE_LIMITED, message);
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public long retryAfterSeconds() {
        return retryAfterSeconds;
    }
}
