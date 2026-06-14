package com.gatherly.material;

import com.gatherly.common.error.AppException;
import com.gatherly.common.error.DomainConflictException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.common.error.NotFoundException;
import com.gatherly.event.EventAssignmentRepository;
import com.gatherly.event.EventRepository;
import com.gatherly.event.domain.Event;
import com.gatherly.event.domain.EventRole;
import com.gatherly.material.domain.Material;
import com.gatherly.material.domain.MaterialStatus;
import com.gatherly.material.domain.MaterialStatusHistory;
import com.gatherly.material.dto.ChangeStatusRequest;
import com.gatherly.material.dto.CreateMaterialRequest;
import com.gatherly.material.dto.MaterialHistoryResponse;
import com.gatherly.material.dto.MaterialResponse;
import com.gatherly.material.dto.MyTaskResponse;
import com.gatherly.material.dto.UpdateMaterialRequest;
import com.gatherly.security.UserPrincipal;
import com.gatherly.user.UserRepository;
import com.gatherly.user.domain.GlobalRole;
import com.gatherly.user.domain.User;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Event materials/tasks + the 5-state workflow (docs/06 §5, docs/03 §4.7). Realizes the two-layer
 * model on the service layer (docs/06 §1): list/history are event-scoped reads ({@code canView});
 * create/update/delete are {@code canManage}; the status change is gated by
 * {@code canUpdateMaterial} (Admin / event MANAGER / the assigned Handler) and then re-checks the
 * state machine — a Handler can advance work but only an event MANAGER/Admin may approve, send back,
 * resolve an issue, or reopen (docs/02 §5). Every transition writes a {@code material_status_history}
 * row.
 */
@Service
@Transactional
public class MaterialService {

    private final MaterialRepository materials;
    private final MaterialStatusHistoryRepository historyRepo;
    private final MainSupplyItemRepository supplyItems;
    private final EventRepository events;
    private final EventAssignmentRepository assignments;
    private final UserRepository users;

    public MaterialService(MaterialRepository materials, MaterialStatusHistoryRepository historyRepo,
                           MainSupplyItemRepository supplyItems, EventRepository events,
                           EventAssignmentRepository assignments, UserRepository users) {
        this.materials = materials;
        this.historyRepo = historyRepo;
        this.supplyItems = supplyItems;
        this.events = events;
        this.assignments = assignments;
        this.users = users;
    }

    // ---- Reads ---------------------------------------------------------------

    @PreAuthorize("@eventSecurity.canView(#eventId, authentication)")
    @Transactional(readOnly = true)
    public List<MaterialResponse> listForEvent(UUID eventId) {
        requireEvent(eventId);
        List<Material> rows = materials.findByEventIdOrderByCreatedAtDesc(eventId);
        Map<UUID, String> names = namesOf(rows.stream().map(Material::getAssignedTo).toList());
        return rows.stream().map(m -> MaterialMapper.toResponse(m, names.get(m.getAssignedTo()))).toList();
    }

    @PreAuthorize("@eventSecurity.canViewMaterial(#materialId, authentication)")
    @Transactional(readOnly = true)
    public List<MaterialHistoryResponse> history(UUID materialId) {
        requireMaterial(materialId);
        List<MaterialStatusHistory> rows = historyRepo.findByMaterialIdOrderByCreatedAtAsc(materialId);
        Map<UUID, String> names = namesOf(rows.stream().map(MaterialStatusHistory::getChangedBy).toList());
        return rows.stream().map(h -> MaterialMapper.toResponse(h, names.get(h.getChangedBy()))).toList();
    }

    /** A Handler's assigned tasks across every event — self-scoped, no event gate needed. */
    @Transactional(readOnly = true)
    public List<MyTaskResponse> myTasks(UserPrincipal actor) {
        if (actor == null) {
            return List.of();
        }
        List<Material> rows = materials.findByAssignedToOrderByCreatedAtDesc(actor.id());
        Map<UUID, String> titles = events.findAllById(rows.stream().map(Material::getEventId).toList())
                .stream().collect(Collectors.toMap(Event::getId, Event::getTitle));
        return rows.stream().map(m -> MaterialMapper.toTask(m, titles.get(m.getEventId()))).toList();
    }

    // ---- Create / update / delete (canManage) --------------------------------

    @PreAuthorize("@eventSecurity.canManage(#eventId, authentication)")
    public MaterialResponse create(UUID eventId, CreateMaterialRequest req, UserPrincipal creator) {
        requireEvent(eventId);
        validateCatalog(req.catalogItemId());
        validateAssignee(eventId, req.assignedTo());
        Material m = new Material();
        m.setEventId(eventId);
        m.setName(req.name());
        m.setDescription(req.description());
        m.setQuantity(req.quantity());
        m.setCatalogItemId(req.catalogItemId());
        m.setAssignedTo(req.assignedTo());
        m.setStatus(MaterialStatus.PENDING);
        m.setCreatedBy(creator == null ? null : creator.id());
        Material saved = materials.save(m);
        // Seed the audit trail (fromStatus null on the first row, docs/02 §3.7).
        historyRepo.save(new MaterialStatusHistory(saved.getId(), null, MaterialStatus.PENDING,
                creator == null ? null : creator.id(), "Created"));
        return MaterialMapper.toResponse(saved, nameOf(saved.getAssignedTo()));
    }

    @PreAuthorize("@eventSecurity.canManage(#eventId, authentication)")
    public MaterialResponse update(UUID eventId, UUID materialId, UpdateMaterialRequest req) {
        Material m = requireMaterialInEvent(eventId, materialId);
        validateCatalog(req.catalogItemId());
        validateAssignee(eventId, req.assignedTo());
        m.setName(req.name());
        m.setDescription(req.description());
        m.setQuantity(req.quantity());
        m.setCatalogItemId(req.catalogItemId());
        m.setAssignedTo(req.assignedTo());
        return MaterialMapper.toResponse(materials.save(m), nameOf(m.getAssignedTo()));
    }

    @PreAuthorize("@eventSecurity.canManage(#eventId, authentication)")
    public void delete(UUID eventId, UUID materialId) {
        Material m = requireMaterialInEvent(eventId, materialId);
        materials.delete(m); // material_status_history cascades via FK (docs/02 §3.7)
    }

    // ---- Status change (state machine, docs/06 §5) ---------------------------

    @PreAuthorize("@eventSecurity.canUpdateMaterial(#materialId, authentication)")
    public MaterialResponse changeStatus(UUID materialId, ChangeStatusRequest req, UserPrincipal actor) {
        Material m = requireMaterial(materialId);
        MaterialStatus from = m.getStatus();
        MaterialStatus to = req.toStatus();

        if (!from.canTransitionTo(to)) {
            throw new DomainConflictException(ErrorCode.ILLEGAL_TRANSITION,
                    "Cannot move a material from %s to %s.".formatted(from, to));
        }
        // Elevated edges (approve / send back / resolve issue / reopen) need MANAGER/Admin even though
        // a Handler passed canUpdateMaterial on their own material (docs/02 §5, docs/06 §5 step 3).
        if (from.isElevated(to) && !canApprove(actor, m.getEventId())) {
            throw new AccessDeniedException(
                    "Only an event manager or admin may perform this transition.");
        }

        m.setStatus(to);
        Material saved = materials.save(m);
        historyRepo.save(new MaterialStatusHistory(saved.getId(), from, to,
                actor == null ? null : actor.id(), req.note()));
        return MaterialMapper.toResponse(saved, nameOf(saved.getAssignedTo()));
    }

    // ---- Helpers -------------------------------------------------------------

    private boolean canApprove(UserPrincipal actor, UUID eventId) {
        if (actor == null) {
            return false;
        }
        return actor.role() == GlobalRole.ADMIN
                || assignments.existsByEventIdAndUserIdAndEventRole(eventId, actor.id(), EventRole.MANAGER);
    }

    private void validateCatalog(UUID catalogItemId) {
        if (catalogItemId != null && !supplyItems.existsById(catalogItemId)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Referenced supply item does not exist.");
        }
    }

    /** A material may only be assigned to a member of its event (keeps canUpdateMaterial consistent). */
    private void validateAssignee(UUID eventId, UUID assignedTo) {
        if (assignedTo != null && !assignments.existsByEventIdAndUserId(eventId, assignedTo)) {
            throw new AppException(ErrorCode.VALIDATION_ERROR,
                    "A material can only be assigned to a member of this event.");
        }
    }

    private String nameOf(UUID userId) {
        return userId == null ? null
                : users.findById(userId).map(User::getFullName).orElse(null);
    }

    private Map<UUID, String> namesOf(List<UUID> ids) {
        List<UUID> present = ids.stream().filter(java.util.Objects::nonNull).distinct().toList();
        return users.findAllById(present).stream()
                .collect(Collectors.toMap(User::getId, User::getFullName));
    }

    private void requireEvent(UUID eventId) {
        if (!events.existsById(eventId)) {
            throw new NotFoundException("Event not found.");
        }
    }

    private Material requireMaterial(UUID materialId) {
        return materials.findById(materialId)
                .orElseThrow(() -> new NotFoundException("Material not found."));
    }

    private Material requireMaterialInEvent(UUID eventId, UUID materialId) {
        Material m = requireMaterial(materialId);
        if (!m.getEventId().equals(eventId)) {
            throw new NotFoundException("Material not found."); // don't leak cross-event existence
        }
        return m;
    }
}
