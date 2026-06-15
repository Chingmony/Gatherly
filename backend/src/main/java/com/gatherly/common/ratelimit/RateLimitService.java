package com.gatherly.common.ratelimit;

import com.gatherly.common.error.RateLimitExceededException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Redis fixed-window rate limiter (docs/10 §6, T10/T11). Counts requests per {@code bucket:key}
 * over a window; the window TTL is set on the first hit so counters self-expire. On overflow it
 * throws {@link RateLimitExceededException} → {@code 429 RATE_LIMITED} + {@code Retry-After}.
 *
 * <p>Fixed-window is intentional: simple, atomic ({@code INCR}), and adequate for abuse throttling
 * on the public/auth surface. It never persists anything beyond the short window.
 */
@Service
public class RateLimitService {

    private static final String PREFIX = "rl:";

    private final StringRedisTemplate redis;

    public RateLimitService(StringRedisTemplate redis) {
        this.redis = redis;
    }

    /**
     * Register one hit for {@code bucket:key}; throws if it exceeds {@code limit} within the window.
     *
     * @param bucket logical limit name (e.g. {@code "login"}, {@code "register"})
     * @param key    caller identity within the bucket (typically client IP)
     */
    public void check(String bucket, String key, int limit, Duration window) {
        String redisKey = PREFIX + bucket + ":" + key;
        Long count = redis.opsForValue().increment(redisKey);
        if (count != null && count == 1L) {
            redis.expire(redisKey, window); // first hit in this window → start the TTL
        }
        if (count != null && count > limit) {
            Long ttl = redis.getExpire(redisKey);
            long retryAfter = ttl == null || ttl < 0 ? window.toSeconds() : ttl;
            throw new RateLimitExceededException("Too many requests. Please try again later.", retryAfter);
        }
    }
}
