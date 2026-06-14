package com.gatherly.service;

import com.gatherly.dto.organization.OrganizationResponse;
import com.gatherly.dto.organization.OrganizationUpdateRequest;

/** Singleton org profile: read (any authenticated user) + edit (Admin) ({@code docs/03} §4.3). */
public interface OrganizationService {

  OrganizationResponse get();

  OrganizationResponse update(OrganizationUpdateRequest request);
}
