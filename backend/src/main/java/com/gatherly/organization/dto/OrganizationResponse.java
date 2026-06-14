package com.gatherly.organization.dto;

import java.time.Instant;
import java.util.UUID;

/** Organization profile projection (docs/03 §4.3). Exposes object keys, not full URLs. */
public record OrganizationResponse(
        UUID id,
        String name,
        String description,
        String logoKey,
        String bannerKey,
        String contactEmail,
        String contactPhone,
        Instant createdAt,
        Instant updatedAt
) {
}
