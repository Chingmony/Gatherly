package com.gatherly.dto.assignment;

import com.gatherly.domain.EventRole;
import java.time.Instant;
import java.util.UUID;

/** Event assignment projection, enriched with the assignee's identity. */
public record AssignmentResponse(
    UUID id,
    UUID eventId,
    UUID userId,
    String userEmail,
    String userFullName,
    EventRole eventRole,
    UUID assignedBy,
    Instant createdAt) {}
