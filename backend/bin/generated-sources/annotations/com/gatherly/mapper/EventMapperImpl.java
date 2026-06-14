package com.gatherly.mapper;

import com.gatherly.domain.Event;
import com.gatherly.domain.EventStatus;
import com.gatherly.dto.event.EventResponse;
import java.time.Instant;
import java.util.UUID;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-06-14T19:54:13+0700",
    comments = "version: 1.6.0, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class EventMapperImpl implements EventMapper {

    @Override
    public EventResponse toResponse(Event event) {
        if ( event == null ) {
            return null;
        }

        UUID id = null;
        String title = null;
        String slug = null;
        String description = null;
        String venue = null;
        Instant startsAt = null;
        Instant endsAt = null;
        EventStatus status = null;
        String registrationQrToken = null;
        Instant checkinOpensAt = null;
        UUID createdBy = null;
        Instant createdAt = null;
        Instant updatedAt = null;

        id = event.getId();
        title = event.getTitle();
        slug = event.getSlug();
        description = event.getDescription();
        venue = event.getVenue();
        startsAt = event.getStartsAt();
        endsAt = event.getEndsAt();
        status = event.getStatus();
        registrationQrToken = event.getRegistrationQrToken();
        checkinOpensAt = event.getCheckinOpensAt();
        createdBy = event.getCreatedBy();
        createdAt = event.getCreatedAt();
        updatedAt = event.getUpdatedAt();

        EventResponse eventResponse = new EventResponse( id, title, slug, description, venue, startsAt, endsAt, status, registrationQrToken, checkinOpensAt, createdBy, createdAt, updatedAt );

        return eventResponse;
    }
}
