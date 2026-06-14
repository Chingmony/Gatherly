package com.gatherly.controller;

import com.gatherly.common.ApiResponse;
import com.gatherly.common.PageMeta;
import com.gatherly.common.paging.PageRequests;
import com.gatherly.dto.supply.SupplyItemRequest;
import com.gatherly.dto.supply.SupplyItemResponse;
import com.gatherly.dto.supply.SupplyItemSort;
import com.gatherly.service.SupplyItemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Main supply catalog ({@code docs/03} §4.6). Gates live on {@link SupplyItemService}. */
@Tag(
    name = "Supply Catalog",
    description =
        "The global main supply catalog. Any authenticated user can read it; create, edit, and"
            + " delete are ADMIN-only (Sub-admins are forbidden).")
@RestController
@RequestMapping("/supply-items")
public class SupplyItemController {

  private final SupplyItemService supplyItemService;

  public SupplyItemController(SupplyItemService supplyItemService) {
    this.supplyItemService = supplyItemService;
  }

  @Operation(
      summary = "List supply items",
      description =
          "Paginated, searchable catalog listing. Any authenticated user. Query params: `search`"
              + " (matches item name), `page` (default 0), `size` (default 20, max 100), `sort` ="
              + " NAME | QUANTITY | CREATED_AT (default NAME), `direction` = ASC | DESC (default"
              + " ASC).")
  @GetMapping
  public ApiResponse<List<SupplyItemResponse>> list(
      @RequestParam(required = false) String search,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(defaultValue = "NAME") SupplyItemSort sort,
      @RequestParam(defaultValue = "ASC") Sort.Direction direction) {
    Pageable pageable = PageRequests.of(page, size, sort, direction);
    Page<SupplyItemResponse> result = supplyItemService.search(search, pageable);
    return ApiResponse.page(
        "Supply items retrieved successfully.", result.getContent(), PageMeta.from(result));
  }

  @Operation(
      summary = "Create a supply item (Admin)",
      description =
          "Adds a new catalog item. ADMIN only. `active` defaults to true when omitted. Errors: 400"
              + " VALIDATION_ERROR for invalid fields.")
  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<SupplyItemResponse> create(@Valid @RequestBody SupplyItemRequest request) {
    return ApiResponse.ok("Supply item created successfully.", supplyItemService.create(request));
  }

  @Operation(
      summary = "Update a supply item (Admin)",
      description =
          "Updates a catalog item. ADMIN only. Errors: 404 NOT_FOUND if unknown; 400"
              + " VALIDATION_ERROR for invalid fields.")
  @PutMapping("/{itemId}")
  public ApiResponse<SupplyItemResponse> update(
      @PathVariable UUID itemId, @Valid @RequestBody SupplyItemRequest request) {
    return ApiResponse.ok(
        "Supply item updated successfully.", supplyItemService.update(itemId, request));
  }

  @Operation(
      summary = "Delete a supply item (Admin)",
      description =
          "Deletes a catalog item. ADMIN only — Sub-admins are forbidden. Errors: 404 NOT_FOUND if"
              + " unknown; 409 CONFLICT if the item is still referenced by event materials.")
  @DeleteMapping("/{itemId}")
  public ApiResponse<Void> delete(@PathVariable UUID itemId) {
    supplyItemService.delete(itemId);
    return ApiResponse.ok("Supply item deleted successfully.");
  }
}
