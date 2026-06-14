package com.gatherly.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Credentials for {@code POST /auth/login}. */
public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}
