package com.gatherly.dto.material;

import com.gatherly.domain.MaterialStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Handler/Manager/Admin drives a material transition ({@code PATCH /materials/{id}/status}). */
public record MaterialStatusChangeRequest(
    @NotNull MaterialStatus toStatus, @Size(max = 1000) String note) {}
