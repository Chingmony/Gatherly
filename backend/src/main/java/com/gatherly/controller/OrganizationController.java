package com.gatherly.controller;

import com.gatherly.common.ApiResponse;
import com.gatherly.dto.organization.OrganizationResponse;
import com.gatherly.dto.organization.OrganizationUpdateRequest;
import com.gatherly.service.OrganizationService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Organization profile ({@code docs/03} §4.3). Read = any authenticated user; edit = Admin. */
@RestController
@RequestMapping("/organization")
public class OrganizationController {

  private final OrganizationService organizationService;

  public OrganizationController(OrganizationService organizationService) {
    this.organizationService = organizationService;
  }

  @GetMapping
  public ApiResponse<OrganizationResponse> get() {
    return ApiResponse.ok("Organization retrieved successfully.", organizationService.get());
  }

  @PutMapping
  public ApiResponse<OrganizationResponse> update(
      @Valid @RequestBody OrganizationUpdateRequest request) {
    return ApiResponse.ok(
        "Organization updated successfully.", organizationService.update(request));
  }
}
