package com.gatherly.dto.attendance;

import com.gatherly.common.paging.SortField;
import org.springframework.data.domain.Sort;

/**
 * Whitelisted sort keys for {@code GET /events/{eventId}/submissions}. Default: {@link #DATE}
 * (submission time).
 */
public enum SubmissionSort implements SortField {
  DATE("submittedAt"),
  NAME("guestName"),
  EMAIL("guestEmail"),
  STATUS("qrStatus");

  private final String property;

  SubmissionSort(String property) {
    this.property = property;
  }

  @Override
  public Sort toSort(Sort.Direction direction) {
    return Sort.by(direction, property);
  }
}
