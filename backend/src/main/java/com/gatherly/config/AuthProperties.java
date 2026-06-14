package com.gatherly.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

/**
 * Auth/security tunables (docs/03 §2.1, docs/04 §3.2). Bound from {@code gatherly.auth.*};
 * all secrets/values originate from environment variables (docs/12 §4).
 */
@ConfigurationProperties("gatherly.auth")
public record AuthProperties(Jwt jwt, Cookie cookie, Otp otp) {

    /** Access JWT: HS256 symmetric secret + token lifetimes (docs/03 §2.1). */
    public record Jwt(String secret, Duration accessTtl, Duration refreshTtl) {
    }

    /** Auth cookie attributes. {@code secure=false} only for local http dev (docs/03 §1). */
    public record Cookie(boolean secure, String sameSite, String domain) {
    }

    /** OTP lifecycle (docs/04 §3.2/§3.3). */
    public record Otp(int ttlSeconds, int maxAttempts, int resendCooldownSeconds,
                      int length, int grantTtlSeconds) {
    }
}
