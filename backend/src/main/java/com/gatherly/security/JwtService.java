package com.gatherly.security;

import com.gatherly.config.JwtProperties;
import com.gatherly.domain.GlobalRole;
import com.gatherly.domain.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Issues and validates HS256 access JWTs ({@code docs/03} §2.1). Claims: {@code sub} (user id),
 * {@code role}, {@code email}, {@code jti}, {@code iat}, {@code exp}. Event-scoped roles are
 * deliberately excluded — resolved per request by {@link EventSecurityService}.
 */
@Service
public class JwtService {

  private static final Logger log = LoggerFactory.getLogger(JwtService.class);

  /** HS256 needs a key ≥ 256 bits (RFC 7518 §3.2). Raw secrets shorter than this are weak. */
  private static final int MIN_SECRET_BYTES = 32;

  private final SecretKey key;
  private final Duration accessTtl;

  public JwtService(JwtProperties props) {
    this.key = Keys.hmacShaKeyFor(deriveKeyBytes(props.secret()));
    this.accessTtl = Duration.ofSeconds(props.accessTokenTtlSeconds());
  }

  /**
   * Derive a guaranteed 256-bit HMAC key from the configured secret via SHA-256. This lets the app
   * boot with any {@code JWT_SECRET} instead of throwing {@code WeakKeyException}, while a warning
   * surfaces a too-short (low-entropy) secret so it can be fixed. Production should still set a
   * long, random {@code JWT_SECRET}.
   */
  private static byte[] deriveKeyBytes(String secret) {
    byte[] raw = secret == null ? new byte[0] : secret.getBytes(StandardCharsets.UTF_8);
    if (raw.length < MIN_SECRET_BYTES) {
      log.warn(
          "JWT_SECRET is only {} bytes; HS256 expects >= {} bytes. Deriving a 256-bit key via"
              + " SHA-256 for now, but set a longer, random secret in production.",
          raw.length,
          MIN_SECRET_BYTES);
    }
    try {
      return MessageDigest.getInstance("SHA-256").digest(raw);
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException("SHA-256 unavailable", e);
    }
  }

  public String issueAccessToken(User user) {
    Instant now = Instant.now();
    return Jwts.builder()
        .subject(user.getId().toString())
        .claim("role", user.getGlobalRole().name())
        .claim("email", user.getEmail())
        .id(UUID.randomUUID().toString())
        .issuedAt(Date.from(now))
        .expiration(Date.from(now.plus(accessTtl)))
        .signWith(key)
        .compact();
  }

  /** Validate signature + expiry and rebuild the principal; empty if the token is invalid. */
  public Optional<UserPrincipal> parse(String token) {
    try {
      Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
      UserPrincipal principal =
          new UserPrincipal(
              UUID.fromString(claims.getSubject()),
              claims.get("email", String.class),
              GlobalRole.valueOf(claims.get("role", String.class)));
      return Optional.of(principal);
    } catch (JwtException | IllegalArgumentException ex) {
      return Optional.empty();
    }
  }

  public long accessTtlSeconds() {
    return accessTtl.toSeconds();
  }
}
