package com.gatherly.security;

import com.gatherly.event.EventAssignmentRepository;
import com.gatherly.event.domain.EventRole;
import com.gatherly.material.MaterialRepository;
import com.gatherly.material.domain.Material;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

/**
 * Event-scoped authorization bean referenced as {@code @eventSecurity} in {@code @PreAuthorize}
 * SpEL (docs/03 §3, docs/01 §4.2) — the second layer of the two-layer model.
 *
 * <p><b>Live as of M3/P2.</b> Event roles are resolved per-request from {@code event_assignment}
 * (never from the JWT, docs/03 §2.1): an Admin passes every gate; otherwise the caller must hold
 * the required event-scoped role on that exact event. Default-deny — any unknown principal or
 * missing assignment is a hard {@code false}.
 */
@Component("eventSecurity")
public class EventSecurityService {

    private final EventAssignmentRepository assignments;
    private final MaterialRepository materials;

    public EventSecurityService(EventAssignmentRepository assignments, MaterialRepository materials) {
        this.assignments = assignments;
        this.materials = materials;
    }

    /** Admin or event MANAGER (Sub-admin) on the event. */
    public boolean canManage(UUID eventId, Authentication authentication) {
        if (eventId == null) {
            return false;
        }
        if (isAdmin(authentication)) {
            return true;
        }
        UUID userId = principalId(authentication);
        return userId != null
                && assignments.existsByEventIdAndUserIdAndEventRole(eventId, userId, EventRole.MANAGER);
    }

    /** Admin or any assignment (MANAGER/HANDLER) on the event. */
    public boolean canView(UUID eventId, Authentication authentication) {
        if (eventId == null) {
            return false;
        }
        if (isAdmin(authentication)) {
            return true;
        }
        UUID userId = principalId(authentication);
        return userId != null && assignments.existsByEventIdAndUserId(eventId, userId);
    }

    /**
     * Admin, event MANAGER on the material's event, or the Handler the material is assigned to
     * (docs/03 §3, M4). The material's owning event is resolved per-request; a missing material is a
     * hard {@code false} for non-admins (no existence leak), while an Admin passes the gate and the
     * service then renders the 404.
     */
    public boolean canUpdateMaterial(UUID materialId, Authentication authentication) {
        if (isAdmin(authentication)) {
            return true;
        }
        UUID userId = principalId(authentication);
        if (materialId == null || userId == null) {
            return false;
        }
        Optional<Material> material = materials.findById(materialId);
        if (material.isEmpty()) {
            return false;
        }
        Material m = material.get();
        return userId.equals(m.getAssignedTo())
                || assignments.existsByEventIdAndUserIdAndEventRole(m.getEventId(), userId, EventRole.MANAGER);
    }

    /** Admin or any assignment (MANAGER/HANDLER) on the material's event — gate for material history. */
    public boolean canViewMaterial(UUID materialId, Authentication authentication) {
        if (isAdmin(authentication)) {
            return true;
        }
        UUID userId = principalId(authentication);
        if (materialId == null || userId == null) {
            return false;
        }
        return materials.findById(materialId)
                .map(m -> assignments.existsByEventIdAndUserId(m.getEventId(), userId))
                .orElse(false);
    }

    private boolean isAdmin(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    private UUID principalId(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal up) {
            return up.id();
        }
        return null;
    }
}
