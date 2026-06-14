package com.gatherly.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Email to start the OTP reset flow. Response is always {@code 202} (no account enumeration). */
public record ForgotPasswordRequest(@NotBlank @Email String email) {}
