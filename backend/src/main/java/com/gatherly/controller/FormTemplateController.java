package com.gatherly.controller;

import com.gatherly.common.ApiResponse;
import com.gatherly.dto.form.FormTemplateRequest;
import com.gatherly.dto.form.FormTemplateResponse;
import com.gatherly.security.UserPrincipal;
import com.gatherly.service.FormTemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Reusable form templates ({@code /form-templates}). These are org-wide and not bound to an event;
 * the builder designs them and an event's form can later be seeded from one. Gates live on {@link
 * FormTemplateService} (ADMIN or SUB_ADMIN).
 */
@Tag(
    name = "Form Templates",
    description =
        "Manages reusable registration-form templates (JSONB schema) the form builder designs for"
            + " different event types. ADMIN or SUB_ADMIN only.")
@RestController
@RequestMapping("/form-templates")
public class FormTemplateController {

  private final FormTemplateService templateService;

  public FormTemplateController(FormTemplateService templateService) {
    this.templateService = templateService;
  }

  @Operation(summary = "List all form templates", description = "Most-recently-updated first.")
  @GetMapping
  public ApiResponse<List<FormTemplateResponse>> list() {
    return ApiResponse.ok("Templates retrieved successfully.", templateService.list());
  }

  @Operation(summary = "Get one form template")
  @GetMapping("/{templateId}")
  public ApiResponse<FormTemplateResponse> get(@PathVariable UUID templateId) {
    return ApiResponse.ok("Template retrieved successfully.", templateService.get(templateId));
  }

  @Operation(
      summary = "Create a form template",
      description = "Saves a new reusable template. Errors: 400 VALIDATION_ERROR for an invalid schema.")
  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<FormTemplateResponse> create(
      @Valid @RequestBody FormTemplateRequest request,
      @AuthenticationPrincipal UserPrincipal principal) {
    return ApiResponse.ok("Template created.", templateService.create(request, principal));
  }

  @Operation(summary = "Update a form template")
  @PutMapping("/{templateId}")
  public ApiResponse<FormTemplateResponse> update(
      @PathVariable UUID templateId, @Valid @RequestBody FormTemplateRequest request) {
    return ApiResponse.ok("Template saved.", templateService.update(templateId, request));
  }

  @Operation(summary = "Delete a form template")
  @DeleteMapping("/{templateId}")
  public ApiResponse<Void> delete(@PathVariable UUID templateId) {
    templateService.delete(templateId);
    return ApiResponse.ok("Template deleted.");
  }
}
