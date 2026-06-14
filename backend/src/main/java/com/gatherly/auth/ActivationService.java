package com.gatherly.auth;

import com.gatherly.common.Hashing;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

/**
 * Single-use account-activation (set-password) tokens, stored hashed in Redis with a TTL
 * (docs/02 §5c, docs/04 §3). The raw token travels only in the emailed link; lookups resolve the
 * hash → user id server-side. Tokens are deleted on use.
 */
@Service
public class ActivationService {

    private static final String KEY = "setpw:";
    private static final int TOKEN_BYTES = 32;

    private final StringRedisTemplate redis;
    private final Duration ttl;

    public ActivationService(StringRedisTemplate redis,
                             @Value("${gatherly.auth.activation.ttl-seconds:259200}") long ttlSeconds) {
        this.redis = redis;
        this.ttl = Duration.ofSeconds(ttlSeconds);
    }

    /** Mints a token for the user and returns the <b>raw</b> value to embed in the email link. */
    public String mint(UUID userId) {
        String raw = Hashing.randomToken(TOKEN_BYTES);
        redis.opsForValue().set(KEY + Hashing.sha256Hex(raw), userId.toString(), ttl);
        return raw;
    }

    /** Resolves a raw token to its user id, or {@code null} if missing/expired. */
    public UUID verify(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return null;
        }
        String userId = redis.opsForValue().get(KEY + Hashing.sha256Hex(rawToken));
        return userId == null ? null : UUID.fromString(userId);
    }

    /** Invalidates the token (single-use). */
    public void consume(String rawToken) {
        if (rawToken != null && !rawToken.isBlank()) {
            redis.delete(KEY + Hashing.sha256Hex(rawToken));
        }
    }
}
