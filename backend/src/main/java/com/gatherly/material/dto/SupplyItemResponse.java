package com.gatherly.material.dto;

import java.time.Instant;
import java.util.UUID;

/** A main supply catalog item (docs/03 §4.6). */
public record SupplyItemResponse(
        UUID id,
        String name,
        String description,
        String unit,
        Integer defaultQuantity,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
}
