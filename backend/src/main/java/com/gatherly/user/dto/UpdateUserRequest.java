package com.gatherly.user.dto;

import com.gatherly.event.domain.EventRole;
import com.gatherly.user.domain.Gender;
import com.gatherly.user.domain.GlobalRole;
import com.gatherly.user.domain.UserStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/**
 * Admin edit of another user (docs/03 §4.2). Email is immutable; password changes go via reset.
 * {@code defaultEventRole} is the Sub-admin (MANAGER) / Handler (HANDLER) designation; ignored when
 * {@code globalRole} is ADMIN (admins have no event-role tier).
 */
public record UpdateUserRequest(
        @Size(max = 200) String fullName,
        @Size(max = 30) String phone,
        Gender gender,
        LocalDate dateOfBirth,
        @Size(max = 500) String address,
        @NotNull GlobalRole globalRole,
        EventRole defaultEventRole,
        @NotNull UserStatus status
) {
}
