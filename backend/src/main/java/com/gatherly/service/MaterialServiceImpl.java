package com.gatherly.service;

import com.gatherly.common.error.ApiException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.domain.Material;
import com.gatherly.domain.MaterialStatus;
import com.gatherly.domain.MaterialStatusHistory;
import com.gatherly.dto.material.MaterialHistoryResponse;
import com.gatherly.dto.material.MaterialRequest;
import com.gatherly.dto.material.MaterialResponse;
import com.gatherly.dto.material.MaterialStatusChangeRequest;
import com.gatherly.mapper.MaterialMapper;
import com.gatherly.repository.EventRepository;
import com.gatherly.repository.MainSupplyItemRepository;
import com.gatherly.repository.MaterialRepository;
import com.gatherly.repository.MaterialStatusHistoryRepository;
import com.gatherly.repository.UserRepository;
import com.gatherly.security.EventSecurityService;
import com.gatherly.security.UserPrincipal;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * {@link MaterialService} implementation. CRUD is {@code @eventSecurity.canManage}; status changes
 * are {@code canUpdateMaterial} (Handler on own / Manager / Admin). The state machine ({@link
 * MaterialStatus}) enforces legality; approval-level transitions additionally require manage rights
 * even when a Handler passed the gate ({@code docs/06} §5). Every transition writes history.
 */
@Service
public class MaterialServiceImpl implements MaterialService {

  private final MaterialRepository materialRepository;
  private final MaterialStatusHistoryRepository historyRepository;
  private final EventRepository eventRepository;
  private final UserRepository userRepository;
  private final MainSupplyItemRepository supplyItemRepository;
  private final EventSecurityService eventSecurity;
  private final MaterialMapper mapper;

  public MaterialServiceImpl(
      MaterialRepository materialRepository,
      MaterialStatusHistoryRepository historyRepository,
      EventRepository eventRepository,
      UserRepository userRepository,
      MainSupplyItemRepository supplyItemRepository,
      EventSecurityService eventSecurity,
      MaterialMapper mapper) {
    this.materialRepository = materialRepository;
    this.historyRepository = historyRepository;
    this.eventRepository = eventRepository;
    this.userRepository = userRepository;
    this.supplyItemRepository = supplyItemRepository;
    this.eventSecurity = eventSecurity;
    this.mapper = mapper;
  }

  @Override
  @PreAuthorize("@eventSecurity.canView(#eventId, authentication)")
  @Transactional(readOnly = true)
  public Page<MaterialResponse> list(UUID eventId, String search, Pageable pageable) {
    String q = (search == null || search.isBlank()) ? null : search.trim();
    return materialRepository.search(eventId, q, pageable).map(mapper::toResponse);
  }

  @Override
  @PreAuthorize("@eventSecurity.canManage(#eventId, authentication)")
  @Transactional
  public MaterialResponse create(UUID eventId, MaterialRequest request, UserPrincipal principal) {
    if (!eventRepository.existsById(eventId)) {
      throw new ApiException(ErrorCode.NOT_FOUND, "Event not found.");
    }
    validateReferences(request);
    Material material = new Material();
    material.setEventId(eventId);
    material.setName(request.name());
    material.setDescription(request.description());
    material.setQuantity(request.quantity());
    material.setCatalogItemId(request.catalogItemId());
    material.setAssignedTo(request.assignedTo());
    material.setStatus(MaterialStatus.PENDING);
    material.setCreatedBy(principal.id());
    Material saved = materialRepository.save(material);
    writeHistory(saved.getId(), null, MaterialStatus.PENDING, principal.id(), "Created");
    return mapper.toResponse(saved);
  }

  @Override
  @PreAuthorize("@eventSecurity.canManage(#eventId, authentication)")
  @Transactional
  public MaterialResponse update(UUID eventId, UUID materialId, MaterialRequest request) {
    Material material = loadInEvent(materialId, eventId);
    validateReferences(request);
    material.setName(request.name());
    material.setDescription(request.description());
    material.setQuantity(request.quantity());
    if (request.catalogItemId() != null) {
      material.setCatalogItemId(request.catalogItemId());
    }
    if (request.assignedTo() != null) {
      material.setAssignedTo(request.assignedTo());
    }
    return mapper.toResponse(material);
  }

  @Override
  @PreAuthorize("@eventSecurity.canUpdateMaterial(#materialId, authentication)")
  @Transactional
  public MaterialResponse changeStatus(
      UUID materialId, MaterialStatusChangeRequest request, UserPrincipal principal) {
    Material material = load(materialId);
    MaterialStatus from = material.getStatus();
    MaterialStatus to = request.toStatus();
    if (!from.canTransitionTo(to)) {
      throw new ApiException(
          ErrorCode.CONFLICT, "Illegal transition from " + from + " to " + to + ".");
    }
    if (from.requiresManager(to)
        && !eventSecurity.canManage(
            material.getEventId(), SecurityContextHolder.getContext().getAuthentication())) {
      throw new ApiException(ErrorCode.FORBIDDEN, "This transition requires a manager or admin.");
    }
    material.setStatus(to);
    writeHistory(materialId, from, to, principal.id(), request.note());
    return mapper.toResponse(material);
  }

  @Override
  @PreAuthorize("@eventSecurity.canViewMaterial(#materialId, authentication)")
  @Transactional(readOnly = true)
  public List<MaterialHistoryResponse> history(UUID materialId) {
    if (!materialRepository.existsById(materialId)) {
      throw new ApiException(ErrorCode.NOT_FOUND, "Material not found.");
    }
    return historyRepository.findByMaterialIdOrderByCreatedAtAsc(materialId).stream()
        .map(mapper::toHistoryResponse)
        .toList();
  }

  @Override
  @PreAuthorize("@eventSecurity.canManage(#eventId, authentication)")
  @Transactional
  public void delete(UUID eventId, UUID materialId) {
    materialRepository.delete(loadInEvent(materialId, eventId));
  }

  private void validateReferences(MaterialRequest request) {
    if (request.catalogItemId() != null
        && !supplyItemRepository.existsById(request.catalogItemId())) {
      throw new ApiException(ErrorCode.NOT_FOUND, "Catalog item not found.");
    }
    if (request.assignedTo() != null && !userRepository.existsById(request.assignedTo())) {
      throw new ApiException(ErrorCode.NOT_FOUND, "Assignee not found.");
    }
  }

  private void writeHistory(
      UUID materialId, MaterialStatus from, MaterialStatus to, UUID changedBy, String note) {
    MaterialStatusHistory history = new MaterialStatusHistory();
    history.setMaterialId(materialId);
    history.setFromStatus(from);
    history.setToStatus(to);
    history.setChangedBy(changedBy);
    history.setNote(note);
    historyRepository.save(history);
  }

  private Material load(UUID materialId) {
    return materialRepository
        .findById(materialId)
        .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Material not found."));
  }

  private Material loadInEvent(UUID materialId, UUID eventId) {
    Material material = load(materialId);
    if (!material.getEventId().equals(eventId)) {
      throw new ApiException(ErrorCode.NOT_FOUND, "Material not found for this event.");
    }
    return material;
  }
}
