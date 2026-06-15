package com.gatherly.dto.material;

import com.gatherly.domain.MaterialPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;

/**
 * Create/update an event material (Manager/Admin). Status is changed via the dedicated endpoint.
 * {@code priority} defaults to {@code MEDIUM} when null; {@code category}/{@code dueAt} are optional.
 */
public record MaterialRequest(
    @NotBlank @Size(max = 200) String name,
    @Size(max = 2000) String description,
    @PositiveOrZero Integer quantity,
    UUID catalogItemId,
    UUID assignedTo,
    @Size(max = 50) String category,
    MaterialPriority priority,
    Instant dueAt) {}
