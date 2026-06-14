package com.gatherly.domain;

/**
 * Event-scoped role carried in {@code event_assignment} ({@code docs/02} §3.4). {@code MANAGER} =
 * Sub-admin powers on that event; {@code HANDLER} = task executor. Not in the JWT — resolved per
 * request by {@link com.gatherly.security.EventSecurityService}.
 */
public enum EventRole {
  MANAGER,
  HANDLER
}
