package com.gatherly.user.domain;

import com.gatherly.event.domain.EventRole;

/**
 * Role designation offered in the Add-User form (docs/03 §4.2, docs/05 §7a). Deliberately
 * excludes {@code ADMIN} — the invite form never mints a global Admin. Maps to the event role a
 * member receives when assigned to an event.
 */
public enum InviteRole {
    SUB_ADMIN(EventRole.MANAGER),
    HANDLER(EventRole.HANDLER);

    private final EventRole eventRole;

    InviteRole(EventRole eventRole) {
        this.eventRole = eventRole;
    }

    public EventRole toEventRole() {
        return eventRole;
    }
}
