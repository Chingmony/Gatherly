package com.gatherly.dto.material;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.util.UUID;

/**
 * Create/update an event material (Manager/Admin). Status is changed via the dedicated endpoint.
 */
public record MaterialRequest(
    @NotBlank @Size(max = 200) String name,
    @Size(max = 2000) String description,
    @PositiveOrZero Integer quantity,
    UUID catalogItemId,
    UUID assignedTo) {}
