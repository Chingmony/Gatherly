package com.gatherly.controller;

import com.gatherly.common.ApiResponse;
import com.gatherly.common.PageMeta;
import com.gatherly.common.paging.PageRequests;
import com.gatherly.dto.material.MaterialHistoryResponse;
import com.gatherly.dto.material.MaterialRequest;
import com.gatherly.dto.material.MaterialResponse;
import com.gatherly.dto.material.MaterialSort;
import com.gatherly.dto.material.MaterialStatusChangeRequest;
import com.gatherly.security.UserPrincipal;
import com.gatherly.service.MaterialService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Materials ({@code docs/03} §4.7). Event-scoped CRUD under {@code /events/{eventId}/materials};
 * status + history under {@code /materials/{materialId}}. Gates live on {@link MaterialService}.
 */
@Tag(
    name = "Materials",
    description =
        "Event materials/tasks and their workflow state machine. Listing/history follow event view"
            + " rights; create/edit/delete need manage rights (ADMIN or event MANAGER); status"
            + " changes are allowed for the assigned HANDLER too.")
@RestController
public class MaterialController {

  private final MaterialService materialService;

  public MaterialController(MaterialService materialService) {
    this.materialService = materialService;
  }

  @Operation(
      summary = "List materials for an event",
      description =
          "Paginated, searchable list of an event's materials. Visible to ADMIN or any user"
              + " assigned to the event. Query params: `search` (matches material name), `page`"
              + " (default 0), `size` (default 20, max 100), `sort` = NAME | STATUS | QUANTITY |"
              + " CREATED_AT (default NAME), `direction` = ASC | DESC (default ASC). Errors: 403"
              + " FORBIDDEN.")
  @GetMapping("/events/{eventId}/materials")
  public ApiResponse<List<MaterialResponse>> list(
      @PathVariable UUID eventId,
      @RequestParam(required = false) String search,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(defaultValue = "NAME") MaterialSort sort,
      @RequestParam(defaultValue = "ASC") Sort.Direction direction) {
    Pageable pageable = PageRequests.of(page, size, sort, direction);
    Page<MaterialResponse> result = materialService.list(eventId, search, pageable);
    return ApiResponse.page(
        "Materials retrieved successfully.", result.getContent(), PageMeta.from(result));
  }

  @Operation(
      summary = "Create a material",
      description =
          "Adds a material/task to the event (starts in PENDING), optionally linked to a catalog"
              + " item and assigned to a HANDLER. Requires manage rights (ADMIN or event MANAGER)."
              + " Errors: 403 FORBIDDEN; 404 NOT_FOUND if event/catalog item/assignee is unknown.")
  @PostMapping("/events/{eventId}/materials")
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<MaterialResponse> create(
      @PathVariable UUID eventId,
      @Valid @RequestBody MaterialRequest request,
      @AuthenticationPrincipal UserPrincipal principal) {
    return ApiResponse.ok(
        "Material created successfully.", materialService.create(eventId, request, principal));
  }

  @Operation(
      summary = "Update a material",
      description =
          "Updates a material's details (name, description, quantity, catalog link, assignee)."
              + " Requires manage rights (ADMIN or event MANAGER). Status is changed via the"
              + " dedicated status endpoint, not here. Errors: 403 FORBIDDEN; 404 NOT_FOUND.")
  @PutMapping("/events/{eventId}/materials/{materialId}")
  public ApiResponse<MaterialResponse> update(
      @PathVariable UUID eventId,
      @PathVariable UUID materialId,
      @Valid @RequestBody MaterialRequest request) {
    return ApiResponse.ok(
        "Material updated successfully.", materialService.update(eventId, materialId, request));
  }

  @Operation(
      summary = "Delete a material",
      description =
          "Removes a material from the event. Requires manage rights (ADMIN or event MANAGER)."
              + " Errors: 403 FORBIDDEN; 404 NOT_FOUND if the material is unknown or not in this"
              + " event.")
  @DeleteMapping("/events/{eventId}/materials/{materialId}")
  public ApiResponse<Void> delete(@PathVariable UUID eventId, @PathVariable UUID materialId) {
    materialService.delete(eventId, materialId);
    return ApiResponse.ok("Material deleted successfully.");
  }

  @Operation(
      summary = "Change a material's status",
      description =
          "Drives a workflow transition (e.g. PENDING → IN_PROGRESS → DONE) and writes an audit"
              + " history row. Allowed for ADMIN, the event MANAGER, or the HANDLER the material is"
              + " assigned to. The state machine enforces legal transitions (409 CONFLICT on an"
              + " illegal one); approval-level transitions additionally require manager/admin rights"
              + " (403). Errors: 403 FORBIDDEN; 404 NOT_FOUND.")
  @PatchMapping("/materials/{materialId}/status")
  public ApiResponse<MaterialResponse> changeStatus(
      @PathVariable UUID materialId,
      @Valid @RequestBody MaterialStatusChangeRequest request,
      @AuthenticationPrincipal UserPrincipal principal) {
    return ApiResponse.ok(
        "Material status updated.", materialService.changeStatus(materialId, request, principal));
  }

  @Operation(
      summary = "Get a material's status history",
      description =
          "Returns the chronological audit trail of status transitions for a material. Visible to"
              + " anyone who can view the owning event. Errors: 403 FORBIDDEN; 404 NOT_FOUND.")
  @GetMapping("/materials/{materialId}/history")
  public ApiResponse<List<MaterialHistoryResponse>> history(@PathVariable UUID materialId) {
    return ApiResponse.ok(
        "Material history retrieved successfully.", materialService.history(materialId));
  }
}
