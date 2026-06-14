package com.gatherly.security;

import com.gatherly.config.AuthProperties;
import com.gatherly.user.domain.GlobalRole;
import com.gatherly.user.domain.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

/**
 * Issues and validates the short-lived access JWT (HS256, docs/03 §2.1). Claims: {@code sub}
 * (user id), {@code role} ({@code ADMIN}|{@code MEMBER}), {@code email}, {@code jti}, plus
 * {@code iat}/{@code exp}. <b>Event-scoped roles are intentionally excluded</b> — resolved
 * per-request by {@code @eventSecurity}.
 */
@Service
public class JwtService {

    private static final String CLAIM_ROLE = "role";
    private static final String CLAIM_EMAIL = "email";

    private final SecretKey key;
    private final AuthProperties props;

    public JwtService(AuthProperties props) {
        this.props = props;
        this.key = Keys.hmacShaKeyFor(props.jwt().secret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        Instant exp = now.plus(props.jwt().accessTtl());
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim(CLAIM_ROLE, user.getGlobalRole().name())
                .claim(CLAIM_EMAIL, user.getEmail())
                .id(UUID.randomUUID().toString())
                .issuedAt(Date.from(now))
                .expiration(Date.from(exp))
                .signWith(key)
                .compact();
    }

    /**
     * Validates signature + expiry and maps the token to a {@link UserPrincipal}.
     *
     * @return the principal, or {@code null} if the token is missing/invalid/expired
     */
    public UserPrincipal parse(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }
        try {
            Claims c = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            return new UserPrincipal(
                    UUID.fromString(c.getSubject()),
                    c.get(CLAIM_EMAIL, String.class),
                    GlobalRole.valueOf(c.get(CLAIM_ROLE, String.class)));
        } catch (JwtException | IllegalArgumentException ex) {
            return null; // invalid/expired → treated as unauthenticated
        }
    }
}
