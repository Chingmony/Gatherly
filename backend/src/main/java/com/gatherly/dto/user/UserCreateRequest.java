package com.gatherly.dto.user;

import com.gatherly.domain.GlobalRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Admin creates a user ({@code POST /users}). */
public record UserCreateRequest(
    @NotBlank @Email @Size(max = 255) String email,
    @NotBlank @Size(min = 8, max = 100) String password,
    @NotBlank @Size(max = 200) String fullName,
    @Size(max = 30) String phone,
    @NotNull GlobalRole globalRole) {}
