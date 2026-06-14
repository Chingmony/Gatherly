package com.gatherly.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * OTP lifecycle config bound from {@code app.otp.*} ({@code docs/04} §3.2).
 *
 * @param ttlSeconds code lifetime (default 300)
 * @param maxAttempts verification attempts before lockout (default 5)
 * @param resendCooldownSeconds minimum gap between resends (default 60)
 * @param length number of digits (default 6)
 */
@ConfigurationProperties(prefix = "app.otp")
public record OtpProperties(
    int ttlSeconds, int maxAttempts, int resendCooldownSeconds, int length) {}
