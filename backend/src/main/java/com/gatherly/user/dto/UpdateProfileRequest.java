package com.gatherly.user.dto;

import com.gatherly.user.domain.Gender;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/** Self-service profile edit via {@code PUT /me} (docs/03 §4.2). Cannot change role/status/email. */
public record UpdateProfileRequest(
        @NotBlank @Size(max = 200) String fullName,
        @Size(max = 30) String phone,
        Gender gender,
        LocalDate dateOfBirth,
        @Size(max = 500) String address
) {
}
