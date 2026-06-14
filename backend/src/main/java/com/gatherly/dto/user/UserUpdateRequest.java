package com.gatherly.dto.user;

import com.gatherly.domain.Gender;
import com.gatherly.domain.GlobalRole;
import com.gatherly.domain.UserStatus;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/** Admin updates a user ({@code PUT /users/{id}}). Null fields are left unchanged. */
public record UserUpdateRequest(
    @Size(max = 200) String fullName,
    @Size(max = 30) String phone,
    Gender gender,
    LocalDate dateOfBirth,
    @Size(max = 500) String address,
    GlobalRole globalRole,
    UserStatus status) {}
