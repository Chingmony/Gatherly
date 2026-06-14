package com.gatherly.security;

import com.gatherly.event.EventAssignmentRepository;
import com.gatherly.event.domain.EventRole;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

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

    public EventSecurityService(EventAssignmentRepository assignments) {
        this.assignments = assignments;
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
     * Admin, event MANAGER, or the assigned Handler. Material-scoped resolution lands with the
     * materials slice (M4); until then this conservatively allows Admin only — never allow-all.
     */
    public boolean canUpdateMaterial(UUID materialId, Authentication authentication) {
        return isAdmin(authentication);
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
