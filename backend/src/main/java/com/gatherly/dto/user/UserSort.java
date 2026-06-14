package com.gatherly.dto.user;

import com.gatherly.common.paging.SortField;
import org.springframework.data.domain.Sort;

/** Whitelisted sort keys for {@code GET /users}. Default: {@link #NAME}. */
public enum UserSort implements SortField {
  NAME("fullName"),
  EMAIL("email"),
  STATUS("status"),
  CREATED_AT("createdAt");

  private final String property;

  UserSort(String property) {
    this.property = property;
  }

  @Override
  public Sort toSort(Sort.Direction direction) {
    return Sort.by(direction, property);
  }
}
