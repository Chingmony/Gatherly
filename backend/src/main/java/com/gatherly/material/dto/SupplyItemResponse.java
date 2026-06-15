package com.gatherly.material.dto;

import com.gatherly.material.domain.SupplyCategory;
import com.gatherly.material.domain.SupplyStatus;

import java.time.Instant;
import java.util.UUID;

/** A main supply catalog item with its derived stock {@code status} (docs/03 §4.6). */
public record SupplyItemResponse(
        UUID id,
        String name,
        String description,
        String sku,
        SupplyCategory category,
        String unit,
        int onHand,
        Integer lowStockThreshold,
        SupplyStatus status,
        Integer defaultQuantity,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
}
