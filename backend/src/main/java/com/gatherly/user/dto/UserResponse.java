package com.gatherly.user.dto;

import com.gatherly.event.domain.EventRole;
import com.gatherly.user.domain.Gender;
import com.gatherly.user.domain.GlobalRole;
import com.gatherly.user.domain.UserStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/** Safe user projection — {@code passwordHash} is intentionally absent (docs/06 §1). */
public record UserResponse(
        UUID id,
        String email,
        String fullName,
        String phone,
        Gender gender,
        LocalDate dateOfBirth,
        String address,
        String avatarKey,
        GlobalRole globalRole,
        EventRole defaultEventRole,
        UserStatus status,
        /** Number of events this user is assigned to (admins: 0 — they implicitly cover all). */
        long assignedEventCount,
        /** The assigned event's name when {@link #assignedEventCount} is exactly 1, else null. */
        String assignedEventName,
        Instant createdAt,
        Instant updatedAt
) {
}
