package com.gatherly.organization;

import com.gatherly.organization.domain.Organization;
import com.gatherly.organization.dto.OrganizationResponse;

/** Hand-written mapping (docs/06 §1) — entities are never serialized directly. */
public final class OrganizationMapper {

    private OrganizationMapper() {
    }

    public static OrganizationResponse toResponse(Organization o) {
        return new OrganizationResponse(
                o.getId(),
                o.getName(),
                o.getDescription(),
                o.getLogoKey(),
                o.getBannerKey(),
                o.getContactEmail(),
                o.getContactPhone(),
                o.getCreatedAt(),
                o.getUpdatedAt());
    }
}
