package com.gatherly.security;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Event-scoped authorization bean referenced as {@code @eventSecurity} in {@code @PreAuthorize}
 * SpEL (docs/03 §3, docs/01 §4.2) — the second layer of the two-layer model.
 *
 * <p><b>M1 skeleton.</b> Only the global Admin gate is wired here; the event-scoped resolution
 * (MANAGER/HANDLER lookups against {@code event_assignment} and material ownership) lands in M3
 * when that entity exists. Until then these conservatively allow only Admin — never a silent
 * allow-all.
 */
@Component("eventSecurity")
public class EventSecurityService {

    /** Admin or event MANAGER on the event. M1: Admin only (TODO M3: event_assignment lookup). */
    public boolean canManage(UUID eventId, Authentication authentication) {
        return isAdmin(authentication);
    }

    /** Admin or any assignment (MANAGER/HANDLER) on the event. M1: Admin only (TODO M3). */
    public boolean canView(UUID eventId, Authentication authentication) {
        return isAdmin(authentication);
    }

    /** Admin, event MANAGER, or the assigned Handler. M1: Admin only (TODO M3/M4). */
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
}
