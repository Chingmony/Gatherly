package com.gatherly.user.domain;

/**
 * Coarse, global RBAC layer carried in the JWT (docs/02 §4, docs/03 §2.1).
 * {@code ADMIN} = Super Admin. {@code MEMBER} is the default; a member becomes a Sub-admin or
 * Handler only through an {@code event_assignment} (event-scoped, never a global role).
 */
public enum GlobalRole {
    ADMIN,
    MEMBER
}
