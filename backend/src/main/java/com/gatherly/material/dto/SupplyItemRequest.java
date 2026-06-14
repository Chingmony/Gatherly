package com.gatherly.material.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/**
 * Create/update payload for a main supply catalog item (docs/03 §4.6). Admin-only mutation.
 * {@code active} defaults to {@code true} when omitted.
 */
public record SupplyItemRequest(
        @NotBlank @Size(max = 200) String name,
        String description,
        @Size(max = 50) String unit,
        @PositiveOrZero Integer defaultQuantity,
        Boolean active
) {
}
