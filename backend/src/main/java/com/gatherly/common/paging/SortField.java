package com.gatherly.common.paging;

import org.springframework.data.domain.Sort;

/**
 * Implemented by each domain's sort enum. Maps a strongly-typed, whitelisted sort key to a Spring
 * Data {@link Sort} for a given direction — so only enum-defined fields can ever reach the database,
 * never a raw client string. See {@link PageRequests} for how controllers assemble the
 * {@link org.springframework.data.domain.Pageable}.
 */
public interface SortField {

  /** The concrete {@link Sort} this key represents, ordered in the requested {@code direction}. */
  Sort toSort(Sort.Direction direction);
}
