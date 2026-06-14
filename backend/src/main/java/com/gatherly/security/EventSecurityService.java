package com.gatherly.security;

import com.gatherly.domain.EventRole;
import com.gatherly.domain.GlobalRole;
import com.gatherly.repository.EventAssignmentRepository;
import com.gatherly.repository.MaterialRepository;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

/**
 * Event-scoped authorization, exposed to {@code @PreAuthorize} SpEL as {@code @eventSecurity}
 * ({@code docs/03} §3, {@code docs/01} §4.2). Realizes the second authz layer: the JWT carries only
 * the global role; event-scoped roles are resolved per request from {@code event_assignment}.
 *
 * <p>Fail-closed: a null/non-{@link UserPrincipal} authentication is always denied. The material
 * gate stays Admin-only until M4 wires material→event ownership.
 */
@Component("eventSecurity")
public class EventSecurityService {

  private final EventAssignmentRepository assignmentRepository;
  private final MaterialRepository materialRepository;

  public EventSecurityService(
      EventAssignmentRepository assignmentRepository, MaterialRepository materialRepository) {
    this.assignmentRepository = assignmentRepository;
    this.materialRepository = materialRepository;
  }

  /** Admin, or a MANAGER assignment on the event. */
  public boolean canManage(UUID eventId, Authentication authentication) {
    UserPrincipal principal = principal(authentication);
    if (principal == null) {
      return false;
    }
    return principal.role() == GlobalRole.ADMIN
        || assignmentRepository.existsByEventIdAndUserIdAndEventRole(
            eventId, principal.id(), EventRole.MANAGER);
  }

  /** Admin, or any assignment (MANAGER/HANDLER) on the event. */
  public boolean canView(UUID eventId, Authentication authentication) {
    UserPrincipal principal = principal(authentication);
    if (principal == null) {
      return false;
    }
    return principal.role() == GlobalRole.ADMIN
        || assignmentRepository.existsByEventIdAndUserId(eventId, principal.id());
  }

  /** Admin, the event MANAGER, or the Handler the material is assigned to ({@code docs/03} §3). */
  public boolean canUpdateMaterial(UUID materialId, Authentication authentication) {
    UserPrincipal principal = principal(authentication);
    if (principal == null) {
      return false;
    }
    return materialRepository
        .findById(materialId)
        .map(
            m ->
                principal.role() == GlobalRole.ADMIN
                    || assignmentRepository.existsByEventIdAndUserIdAndEventRole(
                        m.getEventId(), principal.id(), EventRole.MANAGER)
                    || principal.id().equals(m.getAssignedTo()))
        // Unknown id: pass the gate so the service can surface a 404.
        .orElse(true);
  }

  /** View a material's history: can-view the event the material belongs to. */
  public boolean canViewMaterial(UUID materialId, Authentication authentication) {
    return materialRepository
        .findById(materialId)
        .map(m -> canView(m.getEventId(), authentication))
        .orElse(true);
  }

  /**
   * Gate for revoking an assignment: removing a MANAGER (Sub-admin) is Admin-only; removing a
   * HANDLER requires manage rights on the event ({@code docs/03} §4.5).
   */
  public boolean canRemoveAssignment(UUID assignmentId, Authentication authentication) {
    UserPrincipal principal = principal(authentication);
    if (principal == null) {
      return false;
    }
    return assignmentRepository
        .findById(assignmentId)
        .map(
            a ->
                a.getEventRole() == EventRole.MANAGER
                    ? principal.role() == GlobalRole.ADMIN
                    : canManage(a.getEventId(), authentication))
        // Unknown id: let the service surface a 404 rather than leaking via a 403 here.
        .orElse(true);
  }

  private static UserPrincipal principal(Authentication authentication) {
    if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal p) {
      return p;
    }
    return null;
  }
}
