package com.gatherly.service;

import com.gatherly.common.error.ApiException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.config.OtpProperties;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

/**
 * Redis-backed password-reset OTP ({@code docs/04} §3). OTPs are stored <strong>hashed</strong>
 * with TTL as the sole expiry; codes are single-use with capped attempts. Never persisted to
 * PostgreSQL.
 */
@Service
public class OtpService {

  private static final String PWD = "otp:pwd:";
  private static final String ATTEMPTS = "otp:attempts:";
  private static final String COOLDOWN = "otp:cooldown:";
  private static final String GRANT = "pwdreset:grant:";

  private final StringRedisTemplate redis;
  private final OtpProperties props;
  private final SecureRandom random = new SecureRandom();

  public OtpService(StringRedisTemplate redis, OtpProperties props) {
    this.redis = redis;
    this.props = props;
  }

  /**
   * Generate and store a fresh OTP. Returns the raw code for delivery by the email layer. Throws
   * {@link ErrorCode#RATE_LIMITED} if a resend cooldown is active.
   */
  public String issue(UUID userId) {
    if (Boolean.TRUE.equals(redis.hasKey(COOLDOWN + userId))) {
      throw new ApiException(ErrorCode.RATE_LIMITED, "Please wait before requesting another code.");
    }
    String otp = randomDigits(props.length());
    Duration ttl = Duration.ofSeconds(props.ttlSeconds());
    redis.opsForValue().set(PWD + userId, sha256(otp), ttl);
    redis.opsForValue().set(ATTEMPTS + userId, "0", ttl);
    redis
        .opsForValue()
        .set(COOLDOWN + userId, "1", Duration.ofSeconds(props.resendCooldownSeconds()));
    return otp;
  }

  /**
   * Verify a submitted OTP. On success issues a single-use reset grant (returned) and clears the
   * code. On too many attempts, clears the code and throws {@link ErrorCode#RATE_LIMITED}.
   */
  public String verify(UUID userId, String otp) {
    String storedHash = redis.opsForValue().get(PWD + userId);
    if (storedHash == null) {
      throw new ApiException(ErrorCode.VALIDATION_ERROR, "The code is invalid or has expired.");
    }
    Long attempts = redis.opsForValue().increment(ATTEMPTS + userId);
    if (attempts != null && attempts > props.maxAttempts()) {
      redis.delete(PWD + userId);
      redis.delete(ATTEMPTS + userId);
      throw new ApiException(
          ErrorCode.RATE_LIMITED, "Too many attempts. Please request a new code.");
    }
    if (!MessageDigest.isEqual(
        sha256(otp).getBytes(StandardCharsets.UTF_8),
        storedHash.getBytes(StandardCharsets.UTF_8))) {
      throw new ApiException(ErrorCode.VALIDATION_ERROR, "The code is incorrect.");
    }
    String grant = UUID.randomUUID().toString();
    redis.opsForValue().set(GRANT + userId, grant, Duration.ofSeconds(props.ttlSeconds()));
    redis.delete(PWD + userId);
    redis.delete(ATTEMPTS + userId);
    return grant;
  }

  /**
   * Issue a single-use reset grant directly, bypassing the OTP step. Used for admin-created
   * accounts: the grant is embedded in the welcome-email "set your password" link, so clicking it
   * lets the new member set a password without first requesting a code. Redeemed via {@link
   * #consumeGrant(UUID, String)} by the standard reset-password endpoint.
   */
  public String issueGrant(UUID userId, Duration ttl) {
    String grant = UUID.randomUUID().toString();
    redis.opsForValue().set(GRANT + userId, grant, ttl);
    return grant;
  }

  /** Atomically validate and consume a reset grant. Returns false if absent/mismatched. */
  public boolean consumeGrant(UUID userId, String grant) {
    String stored = redis.opsForValue().get(GRANT + userId);
    if (stored == null
        || !MessageDigest.isEqual(
            stored.getBytes(StandardCharsets.UTF_8), grant.getBytes(StandardCharsets.UTF_8))) {
      return false;
    }
    redis.delete(GRANT + userId);
    return true;
  }

  public int ttlMinutes() {
    return Math.max(1, props.ttlSeconds() / 60);
  }

  private String randomDigits(int length) {
    StringBuilder sb = new StringBuilder(length);
    for (int i = 0; i < length; i++) {
      sb.append(random.nextInt(10));
    }
    return sb.toString();
  }

  private static String sha256(String value) {
    try {
      MessageDigest md = MessageDigest.getInstance("SHA-256");
      return HexFormat.of().formatHex(md.digest(value.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException("SHA-256 unavailable", e);
    }
  }
}
