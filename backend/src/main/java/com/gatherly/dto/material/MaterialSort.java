package com.gatherly.dto.material;

import com.gatherly.common.paging.SortField;
import org.springframework.data.domain.Sort;

/** Whitelisted sort keys for {@code GET /events/{eventId}/materials}. Default: {@link #NAME}. */
public enum MaterialSort implements SortField {
  NAME("name"),
  STATUS("status"),
  QUANTITY("quantity"),
  CREATED_AT("createdAt");

  private final String property;

  MaterialSort(String property) {
    this.property = property;
  }

  @Override
  public Sort toSort(Sort.Direction direction) {
    return Sort.by(direction, property);
  }
}
