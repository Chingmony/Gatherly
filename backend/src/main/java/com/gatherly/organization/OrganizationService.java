package com.gatherly.organization;

import com.gatherly.common.error.NotFoundException;
import com.gatherly.organization.domain.Organization;
import com.gatherly.organization.dto.UpdateOrganizationRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Singleton organization profile (docs/06 §3). Reads are open to any authenticated user (the
 * branding feeds the app theme, docs/05 §4); writes are Admin-only (docs/03 §4.3). The gate lives
 * here on the service layer (docs/06 §1).
 */
@Service
@Transactional
public class OrganizationService {

    private final OrganizationRepository organizations;

    public OrganizationService(OrganizationRepository organizations) {
        this.organizations = organizations;
    }

    @Transactional(readOnly = true)
    public Organization getProfile() {
        return organizations.findSingleton()
                .orElseThrow(() -> new NotFoundException("Organization profile not found."));
    }

    @PreAuthorize("hasRole('ADMIN')")
    public Organization update(UpdateOrganizationRequest req) {
        Organization org = getProfile();
        org.setName(req.name());
        org.setDescription(req.description());
        org.setLogoKey(req.logoKey());
        org.setBannerKey(req.bannerKey());
        org.setContactEmail(req.contactEmail());
        org.setContactPhone(req.contactPhone());
        return organizations.save(org);
    }
}
