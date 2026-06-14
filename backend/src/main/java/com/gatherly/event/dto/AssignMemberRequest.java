package com.gatherly.event.dto;

import com.gatherly.user.domain.InviteRole;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Assign an existing member to an event (docs/03 §4.5). {@code role} reuses the invite designation
 * (SUB_ADMIN→MANAGER, HANDLER→HANDLER). Appointing a Sub-admin (MANAGER) is Admin-only; adding a
 * Handler requires {@code canManage} — enforced in the service.
 */
public record AssignMemberRequest(
        @NotNull UUID userId,
        @NotNull InviteRole role
) {
}
