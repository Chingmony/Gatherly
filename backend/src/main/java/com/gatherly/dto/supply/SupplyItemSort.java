package com.gatherly.dto.supply;

import com.gatherly.common.paging.SortField;
import org.springframework.data.domain.Sort;

/** Whitelisted sort keys for {@code GET /supply-items}. Default: {@link #NAME}. */
public enum SupplyItemSort implements SortField {
  NAME("name"),
  QUANTITY("defaultQuantity"),
  CREATED_AT("createdAt");

  private final String property;

  SupplyItemSort(String property) {
    this.property = property;
  }

  @Override
  public Sort toSort(Sort.Direction direction) {
    return Sort.by(direction, property);
  }
}
