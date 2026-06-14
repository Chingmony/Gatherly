package com.gatherly.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Per-IP rate-limit config bound from {@code app.rate-limit.*} ({@code docs/03} §7, {@code docs/04}
 * §3.3). Fixed 60-second windows via Redis counters; fails open if Redis is unavailable. Disabled
 * in profiles without Redis.
 *
 * @param enabled feature flag
 * @param loginPerMinute cap for {@code POST /auth/login}
 * @param otpPerMinute cap for {@code /auth/forgot-password} + {@code /auth/verify-otp}
 * @param registerPerMinute cap for public registration + ticket resend
 */
@ConfigurationProperties(prefix = "app.rate-limit")
public record RateLimitProperties(
    boolean enabled, int loginPerMinute, int otpPerMinute, int registerPerMinute) {}
