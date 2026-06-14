package com.gatherly.dto.event;

import com.gatherly.common.paging.SortField;
import org.springframework.data.domain.Sort;

/** Whitelisted sort keys for {@code GET /events}. Default: {@link #DATE} (event start time). */
public enum EventSort implements SortField {
  DATE("startsAt"),
  NAME("title"),
  STATUS("status"),
  CREATED_AT("createdAt");

  private final String property;

  EventSort(String property) {
    this.property = property;
  }

  @Override
  public Sort toSort(Sort.Direction direction) {
    return Sort.by(direction, property);
  }
}
