package com.gatherly.security;

import com.gatherly.user.domain.GlobalRole;

import java.util.UUID;

/**
 * The authenticated identity placed on the {@code Authentication} principal. Exposes {@code id}
 * so SpEL self-gates resolve (e.g. {@code @PreAuthorize("#userId == authentication.principal.id")},
 * docs/03 §3). Built per-request from the validated access JWT — never from client-supplied data.
 */
public record UserPrincipal(UUID id, String email, GlobalRole role) {

    /** Spring Security authority string for this principal's global role (e.g. {@code ROLE_ADMIN}). */
    public String authority() {
        return "ROLE_" + role.name();
    }
}
