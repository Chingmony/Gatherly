package com.gatherly.dto.organization;

import java.time.Instant;
import java.util.UUID;

/** Organization profile projection. {@code logoUrl}/{@code bannerUrl} are public Rustfs URLs. */
public record OrganizationResponse(
    UUID id,
    String name,
    String description,
    String logoKey,
    String bannerKey,
    String logoUrl,
    String bannerUrl,
    String contactEmail,
    String contactPhone,
    Instant updatedAt) {}
