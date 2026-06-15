package com.gatherly.mapper;

import com.gatherly.domain.Event;
import com.gatherly.dto.event.EventResponse;
import com.gatherly.dto.event.PublicEventResponse;
import org.mapstruct.Mapper;

/** Entity → DTO mapping for events. */
@Mapper(componentModel = "spring")
public interface EventMapper {

  EventResponse toResponse(Event event);

  /** Public-safe projection for the unauthenticated discovery list. */
  PublicEventResponse toPublicResponse(Event event);
}
