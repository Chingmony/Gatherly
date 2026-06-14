package com.gatherly.controller;

import com.gatherly.common.ApiResponse;
import com.gatherly.common.PageMeta;
import com.gatherly.dto.material.MaterialHistoryResponse;
import com.gatherly.dto.material.MaterialRequest;
import com.gatherly.dto.material.MaterialResponse;
import com.gatherly.dto.material.MaterialStatusChangeRequest;
import com.gatherly.security.UserPrincipal;
import com.gatherly.service.MaterialService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Materials ({@code docs/03} §4.7). Event-scoped CRUD under {@code /events/{eventId}/materials};
 * status + history under {@code /materials/{materialId}}. Gates live on {@link MaterialService}.
 */
@RestController
public class MaterialController {

  private final MaterialService materialService;

  public MaterialController(MaterialService materialService) {
    this.materialService = materialService;
  }

  @GetMapping("/events/{eventId}/materials")
  public ApiResponse<List<MaterialResponse>> list(
      @PathVariable UUID eventId, @PageableDefault(size = 20) Pageable pageable) {
    Page<MaterialResponse> page = materialService.list(eventId, pageable);
    return ApiResponse.page(
        "Materials retrieved successfully.", page.getContent(), PageMeta.from(page));
  }

  @PostMapping("/events/{eventId}/materials")
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<MaterialResponse> create(
      @PathVariable UUID eventId,
      @Valid @RequestBody MaterialRequest request,
      @AuthenticationPrincipal UserPrincipal principal) {
    return ApiResponse.ok(
        "Material created successfully.", materialService.create(eventId, request, principal));
  }

  @PutMapping("/events/{eventId}/materials/{materialId}")
  public ApiResponse<MaterialResponse> update(
      @PathVariable UUID eventId,
      @PathVariable UUID materialId,
      @Valid @RequestBody MaterialRequest request) {
    return ApiResponse.ok(
        "Material updated successfully.", materialService.update(eventId, materialId, request));
  }

  @DeleteMapping("/events/{eventId}/materials/{materialId}")
  public ApiResponse<Void> delete(@PathVariable UUID eventId, @PathVariable UUID materialId) {
    materialService.delete(eventId, materialId);
    return ApiResponse.ok("Material deleted successfully.");
  }

  @PatchMapping("/materials/{materialId}/status")
  public ApiResponse<MaterialResponse> changeStatus(
      @PathVariable UUID materialId,
      @Valid @RequestBody MaterialStatusChangeRequest request,
      @AuthenticationPrincipal UserPrincipal principal) {
    return ApiResponse.ok(
        "Material status updated.", materialService.changeStatus(materialId, request, principal));
  }

  @GetMapping("/materials/{materialId}/history")
  public ApiResponse<List<MaterialHistoryResponse>> history(@PathVariable UUID materialId) {
    return ApiResponse.ok(
        "Material history retrieved successfully.", materialService.history(materialId));
  }
}
