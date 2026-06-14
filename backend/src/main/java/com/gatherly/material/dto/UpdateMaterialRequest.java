package com.gatherly.material.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Edit a material's descriptive fields and assignment (docs/03 §4.7, {@code canManage}). Status is
 * <b>not</b> changed here — that flows through {@code PATCH /materials/{id}/status} so the state
 * machine and audit trail are always applied (docs/06 §5).
 */
public record UpdateMaterialRequest(
        @NotBlank @Size(max = 200) String name,
        String description,
        @PositiveOrZero Integer quantity,
        UUID catalogItemId,
        UUID assignedTo
) {
}
