package com.gatherly.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Self password change ({@code PUT /me/password}) — requires the current password. */
public record ChangePasswordRequest(
    @NotBlank String currentPassword, @NotBlank @Size(min = 8, max = 100) String newPassword) {}
