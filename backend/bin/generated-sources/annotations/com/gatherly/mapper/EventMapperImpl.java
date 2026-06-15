package com.gatherly.mapper;

import com.gatherly.domain.Event;
import com.gatherly.domain.EventCategory;
import com.gatherly.domain.EventStatus;
import com.gatherly.dto.event.EventResponse;
import com.gatherly.dto.event.PublicEventResponse;
import java.time.Instant;
import java.util.UUID;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-06-15T09:48:24+0700",
    comments = "version: 1.6.0, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class EventMapperImpl extends EventMapper {

    @Override
    public EventResponse toResponse(Event event, long registeredCount, long managerCount, long handlerCount) {
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
        EventCategory category = null;
        Integer capacity = null;
        String coverKey = null;
        String registrationQrToken = null;
        Instant checkinOpensAt = null;
        UUID createdBy = null;
        Instant createdAt = null;
        Instant updatedAt = null;
        if ( event != null ) {
            id = event.getId();
            title = event.getTitle();
            slug = event.getSlug();
            description = event.getDescription();
            venue = event.getVenue();
            startsAt = event.getStartsAt();
            endsAt = event.getEndsAt();
            status = event.getStatus();
            category = event.getCategory();
            capacity = event.getCapacity();
            coverKey = event.getCoverKey();
            registrationQrToken = event.getRegistrationQrToken();
            checkinOpensAt = event.getCheckinOpensAt();
            createdBy = event.getCreatedBy();
            createdAt = event.getCreatedAt();
            updatedAt = event.getUpdatedAt();
        }
        long registeredCount1 = 0L;
        registeredCount1 = registeredCount;
        long managerCount1 = 0L;
        managerCount1 = managerCount;
        long handlerCount1 = 0L;
        handlerCount1 = handlerCount;

        String coverUrl = rustfsClient.presignGet(event.getCoverKey());

        EventResponse eventResponse = new EventResponse( id, title, slug, description, venue, startsAt, endsAt, status, category, capacity, coverKey, coverUrl, registeredCount1, managerCount1, handlerCount1, registrationQrToken, checkinOpensAt, createdBy, createdAt, updatedAt );

        return eventResponse;
    }

    @Override
    public PublicEventResponse toPublicResponse(Event event) {
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

        id = event.getId();
        title = event.getTitle();
        slug = event.getSlug();
        description = event.getDescription();
        venue = event.getVenue();
        startsAt = event.getStartsAt();
        endsAt = event.getEndsAt();

        PublicEventResponse publicEventResponse = new PublicEventResponse( id, title, slug, description, venue, startsAt, endsAt );

        return publicEventResponse;
    }
}
