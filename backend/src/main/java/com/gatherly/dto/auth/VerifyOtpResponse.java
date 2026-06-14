package com.gatherly.dto.auth;

/**
 * Result of a successful OTP verification: an opaque, single-use reset grant the client presents to
 * {@code POST /auth/reset-password}.
 */
public record VerifyOtpResponse(String resetToken, long expiresInSeconds) {}
