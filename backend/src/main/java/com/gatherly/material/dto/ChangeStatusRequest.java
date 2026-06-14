package com.gatherly.material.dto;

import com.gatherly.material.domain.MaterialStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * The Handler's primary action — advance a material's workflow state (docs/03 §4.7,
 * {@code canUpdateMaterial}). Body is {@code { toStatus, note? }}; the service enforces the state
 * machine ({@code 409 ILLEGAL_TRANSITION}) and the elevated-transition rule, and writes history.
 */
public record ChangeStatusRequest(
        @NotNull MaterialStatus toStatus,
        @Size(max = 2000) String note
) {
}
