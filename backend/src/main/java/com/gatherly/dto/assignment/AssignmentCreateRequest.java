package com.gatherly.dto.assignment;

import com.gatherly.domain.EventRole;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

/**
 * Appoint a user to an event role ({@code POST /events/{eventId}/assignments}). {@code MANAGER}
 * appointment is Admin-only; {@code HANDLER} requires manage rights ({@code docs/03} §4.5).
 */
public record AssignmentCreateRequest(@NotNull UUID userId, @NotNull EventRole eventRole) {}
