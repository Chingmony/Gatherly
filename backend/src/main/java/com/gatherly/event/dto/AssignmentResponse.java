package com.gatherly.event.dto;

import com.gatherly.event.domain.EventRole;

import java.time.Instant;
import java.util.UUID;

/** An event member/crew grant with the user's display info (docs/03 §4.5). */
public record AssignmentResponse(
        UUID id,
        UUID userId,
        String fullName,
        String email,
        EventRole eventRole,
        UUID assignedBy,
        Instant createdAt
) {
}
