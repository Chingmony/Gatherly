package com.gatherly.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Activate an invited account by setting the first password (docs/03 §4.1, docs/06 §3a). */
public record SetPasswordRequest(
        @NotBlank String token,
        @NotBlank @Size(min = 8, max = 100) String newPassword
) {
}
