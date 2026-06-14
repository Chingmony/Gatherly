package com.gatherly.material.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Create an event material/task (docs/03 §4.7, {@code canManage}). {@code catalogItemId} optionally
 * links a main supply item; {@code assignedTo} optionally names the Handler. New materials start
 * {@code PENDING} (status is never client-set on create).
 */
public record CreateMaterialRequest(
        @NotBlank @Size(max = 200) String name,
        String description,
        @PositiveOrZero Integer quantity,
        UUID catalogItemId,
        UUID assignedTo
) {
}
