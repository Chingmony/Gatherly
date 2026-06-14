package com.gatherly.dto.supply;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/** Create/update a main supply item (Admin). On create, {@code active} defaults to true if null. */
public record SupplyItemRequest(
    @NotBlank @Size(max = 200) String name,
    @Size(max = 2000) String description,
    @Size(max = 50) String unit,
    @PositiveOrZero Integer defaultQuantity,
    Boolean active) {}
