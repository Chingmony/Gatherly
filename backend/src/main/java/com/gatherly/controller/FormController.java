package com.gatherly.controller;

import com.gatherly.common.ApiResponse;
import com.gatherly.dto.form.FormResponse;
import com.gatherly.dto.form.FormSchemaRequest;
import com.gatherly.security.UserPrincipal;
import com.gatherly.service.RegistrationFormService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(
    name = "Registration Form",
    description =
        "Builds and activates an event's dynamic registration form (JSONB schema). Reading follows"
            + " event view rights; editing/activating require manage rights (ADMIN or event"
            + " MANAGER). This is the organizer-facing form admin; guests use the public endpoints.")
@RestController
@RequestMapping("/events/{eventId}/form")
public class FormController {

  private final RegistrationFormService formService;

  public FormController(RegistrationFormService formService) {
    this.formService = formService;
  }

  @Operation(
      summary = "Get the event's registration form",
      description =
          "Returns the form definition (title, status, field schema, version) for the event."
              + " Visible to ADMIN or any user assigned to the event. Errors: 403 FORBIDDEN; 404"
              + " NOT_FOUND if no form exists yet.")
  @GetMapping
  public ApiResponse<FormResponse> get(@PathVariable UUID eventId) {
    return ApiResponse.ok("Form retrieved successfully.", formService.get(eventId));
  }

  @Operation(
      summary = "Create or update the form schema",
      description =
          "Upserts the form's title and field schema while editable (DRAFT). Requires manage rights"
              + " (ADMIN or event MANAGER). `email` and `phone` fields are always required"
              + " regardless of the schema. Errors: 403 FORBIDDEN; 400 VALIDATION_ERROR for an"
              + " invalid schema.")
  @PutMapping
  public ApiResponse<FormResponse> save(
      @PathVariable UUID eventId,
      @Valid @RequestBody FormSchemaRequest request,
      @AuthenticationPrincipal UserPrincipal principal) {
    return ApiResponse.ok(
        "Form saved successfully.", formService.save(eventId, request, principal));
  }

  @Operation(
      summary = "Activate the form",
      description =
          "Marks the form ACTIVE so the event can accept public registrations. Requires manage"
              + " rights (ADMIN or event MANAGER). Errors: 403 FORBIDDEN; 404 NOT_FOUND; 409"
              + " CONFLICT if the form cannot be activated in its current state.")
  @PostMapping("/activate")
  public ApiResponse<FormResponse> activate(@PathVariable UUID eventId) {
    return ApiResponse.ok("Form activated.", formService.activate(eventId));
  }
}
