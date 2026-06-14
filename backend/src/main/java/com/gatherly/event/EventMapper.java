package com.gatherly.event;

import com.gatherly.event.domain.Event;
import com.gatherly.event.dto.EventResponse;

/** Hand-written mapping (docs/06 §1). */
public final class EventMapper {

    private EventMapper() {
    }

    public static EventResponse toResponse(Event e) {
        return new EventResponse(
                e.getId(),
                e.getTitle(),
                e.getSlug(),
                e.getDescription(),
                e.getVenue(),
                e.getStartsAt(),
                e.getEndsAt(),
                e.getStatus(),
                e.getCategory(),
                e.getCapacity(),
                e.getCoverGradient(),
                e.getCoverImageKey(),
                e.getCheckinOpensAt(),
                e.getCreatedBy(),
                e.getCreatedAt(),
                e.getUpdatedAt());
    }
}
