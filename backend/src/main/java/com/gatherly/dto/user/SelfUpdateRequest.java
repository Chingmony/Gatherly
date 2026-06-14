package com.gatherly.dto.user;

import com.gatherly.domain.Gender;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/** A user edits their own profile ({@code PUT /me}). Role and status are not self-editable. */
public record SelfUpdateRequest(
    @Size(max = 200) String fullName,
    @Size(max = 30) String phone,
    Gender gender,
    LocalDate dateOfBirth,
    @Size(max = 500) String address,
    @Size(max = 512) String avatarKey) {}
