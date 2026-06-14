package com.gatherly.dto.user;

import com.gatherly.domain.Gender;
import com.gatherly.domain.GlobalRole;
import com.gatherly.domain.UserStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** Safe user projection — never includes {@code passwordHash}. */
public record UserResponse(
    UUID id,
    String email,
    String fullName,
    String phone,
    Gender gender,
    LocalDate dateOfBirth,
    String address,
    GlobalRole globalRole,
    UserStatus status,
    Instant createdAt,
    Instant updatedAt,
    String avatarUrl) {}
