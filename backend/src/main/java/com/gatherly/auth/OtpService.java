package com.gatherly.auth;

import com.gatherly.common.error.AppException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.common.error.RateLimitExceededException;
import com.gatherly.config.AuthProperties;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Redis-backed password-reset OTP lifecycle (docs/04 §3.3/§3.4). Stores only a <b>hash</b> of the
 * OTP, never the raw code; enforces a TTL, a resend cooldown, and capped verification attempts;
 * issues a short-lived single-use reset grant on success. Nothing here is persisted to Postgres.
 */
@Service
public class OtpService {

    private static final String OTP_KEY = "otp:pwd:";
    private static final String ATTEMPTS_KEY = "otp:attempts:";
    private static final String COOLDOWN_KEY = "otp:cooldown:";
    private static final String GRANT_KEY = "pwdreset:grant:";

    private final StringRedisTemplate redis;
    private final AuthProperties.Otp cfg;
    private final SecureRandom random = new SecureRandom();

    public OtpService(StringRedisTemplate redis, AuthProperties props) {
        this.redis = redis;
        this.cfg = props.otp();
    }

    /**
     * Generates and stores a fresh OTP for the user (default password-reset TTL) and returns the
     * <b>raw</b> code (for the caller to email). Honors the resend cooldown — a too-soon request
     * is rate-limited.
     */
    public String requestOtp(UUID userId) {
        return requestOtp(userId, cfg.ttlSeconds());
    }

    /**
     * As {@link #requestOtp(UUID)} but with an explicit lifetime. Invites use a longer window
     * ({@code gatherly.auth.otp.invite-ttl-seconds}) than password-reset codes, since the invitee
     * may not check their inbox immediately. Honors the resend cooldown.
     */
    public String requestOtp(UUID userId, long ttlSeconds) {
        if (Boolean.TRUE.equals(redis.hasKey(COOLDOWN_KEY + userId))) {
            Long ttl = redis.getExpire(COOLDOWN_KEY + userId);
            throw new RateLimitExceededException("Please wait before requesting another code.",
                    ttl == null || ttl < 0 ? cfg.resendCooldownSeconds() : ttl);
        }
        String otp = generateNumericOtp(cfg.length());
        Duration ttl = Duration.ofSeconds(ttlSeconds);
        redis.opsForValue().set(OTP_KEY + userId, hash(otp), ttl);
        redis.opsForValue().set(ATTEMPTS_KEY + userId, "0", ttl);
        redis.opsForValue().set(COOLDOWN_KEY + userId, "1", Duration.ofSeconds(cfg.resendCooldownSeconds()));
        return otp;
    }

    /**
     * Verifies an OTP. On success returns a single-use reset grant id (also stored in Redis with
     * its own TTL) and clears the OTP. On failure throws {@code OTP_EXPIRED}/{@code OTP_INVALID};
     * exceeding the attempt cap invalidates the code.
     */
    public String verifyOtp(UUID userId, String code) {
        String stored = redis.opsForValue().get(OTP_KEY + userId);
        if (stored == null) {
            throw new AppException(ErrorCode.OTP_EXPIRED, "The code has expired or is invalid. Request a new one.");
        }
        Long attempts = redis.opsForValue().increment(ATTEMPTS_KEY + userId);
        if (attempts != null && attempts > cfg.maxAttempts()) {
            invalidate(userId);
            throw new AppException(ErrorCode.OTP_INVALID, "Too many attempts. Request a new code.");
        }
        if (!constantTimeEquals(stored, hash(code))) {
            throw new AppException(ErrorCode.OTP_INVALID, "Incorrect code.");
        }
        String grant = UUID.randomUUID().toString();
        redis.opsForValue().set(GRANT_KEY + userId, grant, Duration.ofSeconds(cfg.grantTtlSeconds()));
        redis.delete(OTP_KEY + userId);
        redis.delete(ATTEMPTS_KEY + userId);
        return grant;
    }

    /** Validates and consumes a reset grant (single-use). */
    public boolean consumeGrant(UUID userId, String grant) {
        String stored = redis.opsForValue().get(GRANT_KEY + userId);
        if (stored == null || grant == null || !constantTimeEquals(stored, grant)) {
            return false;
        }
        redis.delete(GRANT_KEY + userId);
        return true;
    }

    private void invalidate(UUID userId) {
        redis.delete(OTP_KEY + userId);
        redis.delete(ATTEMPTS_KEY + userId);
    }

    private String generateNumericOtp(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(random.nextInt(10));
        }
        return sb.toString();
    }

    private String hash(String value) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    private boolean constantTimeEquals(String a, String b) {
        return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }
}
