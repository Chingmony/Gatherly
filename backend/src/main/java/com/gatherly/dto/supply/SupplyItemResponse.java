package com.gatherly.dto.supply;

import java.time.Instant;
import java.util.UUID;

/** Supply catalog item projection. */
public record SupplyItemResponse(
    UUID id,
    String name,
    String description,
    String unit,
    Integer defaultQuantity,
    boolean active,
    Instant createdAt,
    Instant updatedAt) {}
