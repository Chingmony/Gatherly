package com.gatherly.domain;

/**
 * Coarse global RBAC layer carried in the JWT ({@code docs/02} §4). {@code ADMIN} has full access;
 * {@code SUB_ADMIN} is an elevated global role that gains per-event powers via a {@code MANAGER}
 * assignment; {@code USER} is a basic authenticated account. Event-scoped roles live elsewhere
 * ({@code event_assignment}).
 */
public enum GlobalRole {
  ADMIN,
  SUB_ADMIN,
  USER
}
