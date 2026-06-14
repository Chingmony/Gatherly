package com.gatherly.mapper;

import com.gatherly.domain.Event;
import com.gatherly.dto.event.EventResponse;
import org.mapstruct.Mapper;

/** Entity → DTO mapping for events. */
@Mapper(componentModel = "spring")
public interface EventMapper {

  EventResponse toResponse(Event event);
}
