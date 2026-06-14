package com.gatherly.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Consume a reset grant and set a new password ({@code docs/04} §3.4). */
public record ResetPasswordRequest(
    @NotBlank @Email String email,
    @NotBlank String resetToken,
    @NotBlank @Size(min = 8, max = 100) String newPassword) {}
