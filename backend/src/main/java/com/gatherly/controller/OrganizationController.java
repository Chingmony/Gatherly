package com.gatherly.controller;

import com.gatherly.common.ApiResponse;
import com.gatherly.dto.organization.OrganizationResponse;
import com.gatherly.dto.organization.OrganizationUpdateRequest;
import com.gatherly.service.OrganizationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Organization profile ({@code docs/03} §4.3). Read = any authenticated user; edit = Admin. */
@Tag(
    name = "Organization",
    description =
        "The singleton organization profile (name, logo, banner, contact). Readable by any"
            + " authenticated user; editable by ADMIN only.")
@RestController
@RequestMapping("/organization")
public class OrganizationController {

  private final OrganizationService organizationService;

  public OrganizationController(OrganizationService organizationService) {
    this.organizationService = organizationService;
  }

  @Operation(
      summary = "Get the organization profile",
      description =
          "Returns the single org profile row. Any authenticated user (ADMIN, MANAGER, HANDLER).")
  @GetMapping
  public ApiResponse<OrganizationResponse> get() {
    return ApiResponse.ok("Organization retrieved successfully.", organizationService.get());
  }

  @Operation(
      summary = "Update the organization profile (Admin)",
      description =
          "Updates org name, description, logo/banner keys, and contact details. ADMIN only —"
              + " Sub-admins (MANAGER) are forbidden (403). Null fields are left unchanged.")
  @PutMapping
  public ApiResponse<OrganizationResponse> update(
      @Valid @RequestBody OrganizationUpdateRequest request) {
    return ApiResponse.ok(
        "Organization updated successfully.", organizationService.update(request));
  }
}
