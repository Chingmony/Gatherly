package com.gatherly.organization;

import com.gatherly.organization.dto.OrganizationResponse;
import com.gatherly.organization.dto.UpdateOrganizationRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Organization endpoints (docs/03 §4.3). Thin controller: {@code GET} is authenticated; {@code PUT}
 * delegates to {@link OrganizationService} which owns the {@code hasRole('ADMIN')} gate.
 */
@RestController
@RequestMapping("/api/v1/organization")
public class OrganizationController {

    private final OrganizationService organizationService;

    public OrganizationController(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }

    @GetMapping
    public OrganizationResponse get() {
        return OrganizationMapper.toResponse(organizationService.getProfile());
    }

    @PutMapping
    public OrganizationResponse update(@Valid @RequestBody UpdateOrganizationRequest req) {
        return OrganizationMapper.toResponse(organizationService.update(req));
    }
}
