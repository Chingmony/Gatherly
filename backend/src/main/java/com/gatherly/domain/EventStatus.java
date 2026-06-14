package com.gatherly.domain;

import java.util.Set;

/**
 * Event lifecycle ({@code docs/02} §4). Legal transitions: {@code DRAFT → PUBLIC → ARCHIVED}.
 * {@code PUBLIC} activates public guest registration.
 */
public enum EventStatus {
  DRAFT(Set.of("PUBLIC")),
  PUBLIC(Set.of("ARCHIVED")),
  ARCHIVED(Set.of());

  private final Set<String> allowedNext;

  EventStatus(Set<String> allowedNext) {
    this.allowedNext = allowedNext;
  }

  public boolean canTransitionTo(EventStatus target) {
    return allowedNext.contains(target.name());
  }
}
