package com.gatherly.controller;

import com.gatherly.common.ApiResponse;
import com.gatherly.dto.form.FormResponse;
import com.gatherly.dto.form.FormSchemaRequest;
import com.gatherly.security.UserPrincipal;
import com.gatherly.service.RegistrationFormService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Dynamic form builder ({@code docs/03} §4.8). Gates live on {@link RegistrationFormService}. */
@RestController
@RequestMapping("/events/{eventId}/form")
public class FormController {

  private final RegistrationFormService formService;

  public FormController(RegistrationFormService formService) {
    this.formService = formService;
  }

  @GetMapping
  public ApiResponse<FormResponse> get(@PathVariable UUID eventId) {
    return ApiResponse.ok("Form retrieved successfully.", formService.get(eventId));
  }

  @PutMapping
  public ApiResponse<FormResponse> save(
      @PathVariable UUID eventId,
      @Valid @RequestBody FormSchemaRequest request,
      @AuthenticationPrincipal UserPrincipal principal) {
    return ApiResponse.ok(
        "Form saved successfully.", formService.save(eventId, request, principal));
  }

  @PostMapping("/activate")
  public ApiResponse<FormResponse> activate(@PathVariable UUID eventId) {
    return ApiResponse.ok("Form activated.", formService.activate(eventId));
  }
}
