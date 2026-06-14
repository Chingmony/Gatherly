package com.gatherly.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Submit the emailed OTP for verification → yields a short-lived reset grant. */
public record VerifyOtpRequest(@NotBlank @Email String email, @NotBlank String otp) {}
