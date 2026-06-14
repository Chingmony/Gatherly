package com.gatherly.event.domain;

/**
 * Event-scoped role carried by {@code event_assignment.event_role} (docs/02 §3.4, §4).
 * {@code MANAGER} = Sub-admin on that event; {@code HANDLER} = task executor.
 *
 * <p>Also used as the optional {@code user.default_event_role} designation set at invite time
 * (docs/02 §5c) — the role a member is expected to receive when assigned to an event (M3).
 */
public enum EventRole {
    MANAGER,
    HANDLER
}
