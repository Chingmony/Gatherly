package com.gatherly.service;

import com.gatherly.common.error.ApiException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.domain.MainSupplyItem;
import com.gatherly.dto.supply.SupplyItemRequest;
import com.gatherly.dto.supply.SupplyItemResponse;
import com.gatherly.mapper.SupplyItemMapper;
import com.gatherly.repository.MainSupplyItemRepository;
import com.gatherly.repository.MaterialRepository;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link SupplyItemService} implementation. Write/delete are {@code hasRole('ADMIN')} (matrix:
 * Sub-admin forbidden); an in-use item cannot be deleted (the {@code ON DELETE RESTRICT} rule,
 * surfaced as a {@code 409}).
 */
@Service
public class SupplyItemServiceImpl implements SupplyItemService {

  private final MainSupplyItemRepository repository;
  private final MaterialRepository materialRepository;
  private final SupplyItemMapper mapper;

  public SupplyItemServiceImpl(
      MainSupplyItemRepository repository,
      MaterialRepository materialRepository,
      SupplyItemMapper mapper) {
    this.repository = repository;
    this.materialRepository = materialRepository;
    this.mapper = mapper;
  }

  @Override
  @PreAuthorize("isAuthenticated()")
  @Transactional(readOnly = true)
  public Page<SupplyItemResponse> search(String query, Pageable pageable) {
    String q = (query == null || query.isBlank()) ? null : query.trim();
    return repository.search(q, pageable).map(mapper::toResponse);
  }

  @Override
  @PreAuthorize("hasRole('ADMIN')")
  @Transactional
  public SupplyItemResponse create(SupplyItemRequest request) {
    MainSupplyItem item = new MainSupplyItem();
    apply(item, request);
    item.setActive(request.active() == null || request.active());
    return mapper.toResponse(repository.save(item));
  }

  @Override
  @PreAuthorize("hasRole('ADMIN')")
  @Transactional
  public SupplyItemResponse update(UUID itemId, SupplyItemRequest request) {
    MainSupplyItem item = load(itemId);
    apply(item, request);
    if (request.active() != null) {
      item.setActive(request.active());
    }
    return mapper.toResponse(item);
  }

  @Override
  @PreAuthorize("hasRole('ADMIN')")
  @Transactional
  public void delete(UUID itemId) {
    MainSupplyItem item = load(itemId);
    if (materialRepository.existsByCatalogItemId(itemId)) {
      throw new ApiException(
          ErrorCode.CONFLICT,
          "This supply item is in use by event materials and cannot be deleted.");
    }
    repository.delete(item);
  }

  private void apply(MainSupplyItem item, SupplyItemRequest request) {
    item.setName(request.name());
    item.setDescription(request.description());
    item.setUnit(request.unit());
    item.setDefaultQuantity(request.defaultQuantity());
  }

  private MainSupplyItem load(UUID itemId) {
    return repository
        .findById(itemId)
        .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Supply item not found."));
  }
}
