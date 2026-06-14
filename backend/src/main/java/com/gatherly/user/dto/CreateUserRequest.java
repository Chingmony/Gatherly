package com.gatherly.user.dto;

import com.gatherly.user.domain.Gender;
import com.gatherly.user.domain.GlobalRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreateUserRequest(
        @NotBlank @Email @Size(max = 255) String email,
        @NotBlank @Size(min = 8, max = 100) String password,
        @NotBlank @Size(max = 200) String fullName,
        @Size(max = 30) String phone,
        Gender gender,
        LocalDate dateOfBirth,
        @Size(max = 500) String address,
        @NotNull GlobalRole globalRole
) {
}
