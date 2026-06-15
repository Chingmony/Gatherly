package com.gatherly.material.dto;

import com.gatherly.material.domain.SupplyCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/**
 * Create/update payload for a main supply catalog item (docs/03 §4.6). Admin-only mutation.
 * {@code onHand} defaults to {@code 0} and {@code active} to {@code true} when omitted.
 */
public record SupplyItemRequest(
        @NotBlank @Size(max = 200) String name,
        String description,
        @Size(max = 40) String sku,
        SupplyCategory category,
        @Size(max = 50) String unit,
        @PositiveOrZero Integer onHand,
        @PositiveOrZero Integer lowStockThreshold,
        @PositiveOrZero Integer defaultQuantity,
        Boolean active
) {
}
