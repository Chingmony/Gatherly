package com.gatherly.mapper;

import com.gatherly.domain.Event;
import com.gatherly.dto.event.EventResponse;
import com.gatherly.dto.event.PublicEventResponse;
import com.gatherly.integration.rustfs.RustfsClient;
import org.mapstruct.Mapping;
import org.mapstruct.Mapper;
import org.springframework.beans.factory.annotation.Autowired;

/** Entity → DTO mapping for events. */
@Mapper(componentModel = "spring")
public abstract class EventMapper {

  @Autowired protected RustfsClient rustfsClient;

  /**
   * Full projection including a presigned cover URL and aggregate counts. The counts are passed in
   * by the service (they are queries, not entity fields).
   */
  @Mapping(target = "coverUrl", expression = "java(rustfsClient.presignGet(event.getCoverKey()))")
  @Mapping(target = "registeredCount", source = "registeredCount")
  @Mapping(target = "managerCount", source = "managerCount")
  @Mapping(target = "handlerCount", source = "handlerCount")
  public abstract EventResponse toResponse(
      Event event, long registeredCount, long managerCount, long handlerCount);

  /** Public-safe projection for the unauthenticated discovery list. */
  public abstract PublicEventResponse toPublicResponse(Event event);
}
