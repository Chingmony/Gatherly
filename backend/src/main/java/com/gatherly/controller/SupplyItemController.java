package com.gatherly.controller;

import com.gatherly.common.ApiResponse;
import com.gatherly.common.PageMeta;
import com.gatherly.dto.supply.SupplyItemRequest;
import com.gatherly.dto.supply.SupplyItemResponse;
import com.gatherly.service.SupplyItemService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
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
@RestController
@RequestMapping("/supply-items")
public class SupplyItemController {

  private final SupplyItemService supplyItemService;

  public SupplyItemController(SupplyItemService supplyItemService) {
    this.supplyItemService = supplyItemService;
  }

  @GetMapping
  public ApiResponse<List<SupplyItemResponse>> list(
      @RequestParam(required = false) String q, @PageableDefault(size = 20) Pageable pageable) {
    Page<SupplyItemResponse> page = supplyItemService.search(q, pageable);
    return ApiResponse.page(
        "Supply items retrieved successfully.", page.getContent(), PageMeta.from(page));
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<SupplyItemResponse> create(@Valid @RequestBody SupplyItemRequest request) {
    return ApiResponse.ok("Supply item created successfully.", supplyItemService.create(request));
  }

  @PutMapping("/{itemId}")
  public ApiResponse<SupplyItemResponse> update(
      @PathVariable UUID itemId, @Valid @RequestBody SupplyItemRequest request) {
    return ApiResponse.ok(
        "Supply item updated successfully.", supplyItemService.update(itemId, request));
  }

  @DeleteMapping("/{itemId}")
  public ApiResponse<Void> delete(@PathVariable UUID itemId) {
    supplyItemService.delete(itemId);
    return ApiResponse.ok("Supply item deleted successfully.");
  }
}
