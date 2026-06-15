package com.gatherly.mapper;

import com.gatherly.domain.Event;
import com.gatherly.dto.event.EventResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/** Entity → DTO mapping for events. */
@Mapper(componentModel = "spring")
public interface EventMapper {

  /**
   * Maps an event plus its live registration count (derived in the service) into the response. The
   * {@code registeredCount} powers the fill-rate UI on the event/explore cards.
   */
  @Mapping(target = "registeredCount", source = "registeredCount")
  EventResponse toResponse(Event event, long registeredCount);
}
