package com.gatherly.common;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import org.springframework.data.domain.Page;

/**
 * Pagination metadata sibling of {@code data} in a paginated {@link ApiResponse}.
 *
 * <p>{@code page} is 1-based (Spring Data {@link Page} is 0-based, so it is offset by one here).
 * Contract: {@code docs/07-validation-and-error-handling.md} §2.1.
 */
@JsonPropertyOrder({"page", "size", "totalElements", "totalPages"})
public record PageMeta(int page, int size, long totalElements, int totalPages) {

  /**
   * Build from a Spring Data {@link Page}, converting the 0-based index to a 1-based page number.
   */
  public static PageMeta from(Page<?> page) {
    return new PageMeta(
        page.getNumber() + 1, page.getSize(), page.getTotalElements(), page.getTotalPages());
  }
}
