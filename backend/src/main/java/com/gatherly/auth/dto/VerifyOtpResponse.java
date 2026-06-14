package com.gatherly.auth.dto;

/** Returned on successful OTP verification: a single-use grant the client passes to reset-password. */
public record VerifyOtpResponse(String resetGrant) {
}
