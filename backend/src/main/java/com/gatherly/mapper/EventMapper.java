package com.gatherly.mapper;

import com.gatherly.domain.Event;
import com.gatherly.dto.event.EventResponse;
import com.gatherly.dto.event.PublicEventResponse;
import com.gatherly.integration.rustfs.RustfsClient;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.beans.factory.annotation.Autowired;

/** Entity → DTO mapping for events. */
@Mapper(componentModel = "spring")
public abstract class EventMapper {

  @Autowired protected RustfsClient rustfs;

  /**
   * Maps an event plus its live registration count (derived in the service) into the response. The
   * {@code registeredCount} powers the fill-rate UI on the event/explore cards. The stored cover is
   * resolved to a viewable URL via {@link #coverImageUrl(Event)}.
   */
  @Mapping(target = "registeredCount", source = "registeredCount")
  @Mapping(target = "coverImageUrl", expression = "java(coverImageUrl(event))")
  public abstract EventResponse toResponse(Event event, long registeredCount);

  /** Public-safe projection for the unauthenticated discovery list. */
  public abstract PublicEventResponse toPublicResponse(Event event);

  /**
   * Resolves the stored cover to something the browser can render: an uploaded object key becomes a
   * short-lived presigned GET URL; an already-absolute URL (legacy / externally-hosted) is returned
   * as-is; blank/null yields {@code null}.
   */
  protected String coverImageUrl(Event event) {
    String stored = event.getCoverImageUrl();
    if (stored == null || stored.isBlank()) {
      return null;
    }
    if (stored.startsWith("http://") || stored.startsWith("https://")) {
      return stored;
    }
    return rustfs.presignGet(stored);
  }
}
