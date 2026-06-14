package com.gatherly.common.paging;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * Builds a {@link Pageable} from the standardized list-endpoint query params ({@code page},
 * {@code size}, {@code sort}, {@code direction}). Centralizes the rules every paginated endpoint
 * shares: negative pages clamp to 0, size is bounded to {@code [1, MAX_SIZE]}, and sorting is driven
 * by a type-safe {@link SortField} (default applied by the controller via the param's default
 * value).
 */
public final class PageRequests {

  /** Default page size when the client omits {@code size}. */
  public static final int DEFAULT_SIZE = 20;

  /** Hard upper bound on {@code size} — protects the DB from unbounded fetches. */
  public static final int MAX_SIZE = 100;

  private PageRequests() {}

  public static Pageable of(int page, int size, SortField sort, Sort.Direction direction) {
    int safePage = Math.max(page, 0);
    int safeSize = size < 1 ? DEFAULT_SIZE : Math.min(size, MAX_SIZE);
    return PageRequest.of(safePage, safeSize, sort.toSort(direction));
  }
}
