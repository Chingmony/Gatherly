package com.gatherly.event.domain;

/**
 * Event lifecycle status (docs/02 §3.3, §4). {@code PUBLIC} activates guest registration; the
 * lifecycle is {@code DRAFT → PUBLIC → ARCHIVED} (docs/13 §M2).
 */
public enum EventStatus {
    DRAFT,
    PUBLIC,
    ARCHIVED
}
