package com.gatherly.service;

import com.gatherly.common.error.ApiException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.domain.Organization;
import com.gatherly.dto.organization.OrganizationResponse;
import com.gatherly.dto.organization.OrganizationUpdateRequest;
import com.gatherly.integration.rustfs.RustfsClient;
import com.gatherly.repository.OrganizationRepository;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link OrganizationService} implementation over the singleton {@code organization} row (seeded by
 * {@code V3}). Asset-key changes best-effort validate existence and clean up the superseded object,
 * but a storage outage never blocks the profile update ({@code docs/04} §4.5).
 */
@Service
public class OrganizationServiceImpl implements OrganizationService {

  private static final Logger log = LoggerFactory.getLogger(OrganizationServiceImpl.class);

  private final OrganizationRepository organizationRepository;
  private final RustfsClient rustfsClient;

  public OrganizationServiceImpl(
      OrganizationRepository organizationRepository, RustfsClient rustfsClient) {
    this.organizationRepository = organizationRepository;
    this.rustfsClient = rustfsClient;
  }

  @Override
  @PreAuthorize("isAuthenticated()")
  @Transactional(readOnly = true)
  public OrganizationResponse get() {
    return toResponse(load());
  }

  @Override
  @PreAuthorize("hasRole('ADMIN')")
  @Transactional
  public OrganizationResponse update(OrganizationUpdateRequest request) {
    Organization org = load();
    if (request.name() != null) {
      org.setName(request.name());
    }
    if (request.description() != null) {
      org.setDescription(request.description());
    }
    if (request.contactEmail() != null) {
      org.setContactEmail(request.contactEmail());
    }
    if (request.contactPhone() != null) {
      org.setContactPhone(request.contactPhone());
    }
    if (request.logoKey() != null && !request.logoKey().equals(org.getLogoKey())) {
      validateObject(request.logoKey());
      String old = org.getLogoKey();
      org.setLogoKey(request.logoKey());
      rustfsClient.deleteQuietly(old);
    }
    if (request.bannerKey() != null && !request.bannerKey().equals(org.getBannerKey())) {
      validateObject(request.bannerKey());
      String old = org.getBannerKey();
      org.setBannerKey(request.bannerKey());
      rustfsClient.deleteQuietly(old);
    }
    return toResponse(org);
  }

  private Organization load() {
    return organizationRepository
        .findFirstByOrderByCreatedAtAsc()
        .orElseThrow(
            () ->
                new ApiException(ErrorCode.NOT_FOUND, "Organization profile is not initialized."));
  }

  /** Best-effort: reject a key that is confirmed missing; tolerate a storage outage. */
  private void validateObject(String key) {
    try {
      if (!rustfsClient.objectExists(key)) {
        throw new ApiException(
            ErrorCode.VALIDATION_ERROR, "The uploaded object does not exist: " + key);
      }
    } catch (ApiException e) {
      throw e;
    } catch (RuntimeException e) {
      log.warn("Could not verify object {} (storage unavailable); persisting key anyway", key);
    }
  }

  private OrganizationResponse toResponse(Organization org) {
    return new OrganizationResponse(
        org.getId(),
        org.getName(),
        org.getDescription(),
        org.getLogoKey(),
        org.getBannerKey(),
        rustfsClient.publicUrl(org.getLogoKey()),
        rustfsClient.publicUrl(org.getBannerKey()),
        org.getContactEmail(),
        org.getContactPhone(),
        Objects.requireNonNullElse(org.getUpdatedAt(), org.getCreatedAt()));
  }
}
