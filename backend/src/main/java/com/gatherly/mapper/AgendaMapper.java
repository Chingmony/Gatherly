package com.gatherly.mapper;

import com.gatherly.domain.AgendaItem;
import com.gatherly.dto.agenda.AgendaItemResponse;
import org.mapstruct.Mapper;

/** Entity → DTO mapping for agenda items. */
@Mapper(componentModel = "spring")
public interface AgendaMapper {

  AgendaItemResponse toResponse(AgendaItem item);
}
