package com.gatherly.dto.organization;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

/** Admin updates the org profile ({@code PUT /organization}). Null fields are left unchanged. */
public record OrganizationUpdateRequest(
    @Size(max = 200) String name,
    @Size(max = 2000) String description,
    @Size(max = 512) String logoKey,
    @Size(max = 512) String bannerKey,
    @Email @Size(max = 255) String contactEmail,
    @Size(max = 25) String contactPhone) {}
