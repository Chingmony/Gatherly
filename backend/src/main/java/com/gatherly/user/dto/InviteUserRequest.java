package com.gatherly.user.dto;

import com.gatherly.user.domain.InviteRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Admin "Add User" invite (docs/03 §4.2). No password — the user sets their own via the emailed
 * activation link. {@code role} is the Sub-admin/Handler designation; ADMIN is not invitable here.
 */
public record InviteUserRequest(
        @NotBlank @Size(max = 200) String fullName,
        @NotBlank @Email @Size(max = 255) String email,
        @NotNull InviteRole role
) {
}
