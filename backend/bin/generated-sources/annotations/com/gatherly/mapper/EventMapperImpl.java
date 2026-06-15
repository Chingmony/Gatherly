package com.gatherly.mapper;

import com.gatherly.domain.Event;
import com.gatherly.domain.EventStatus;
import com.gatherly.dto.event.EventResponse;
import com.gatherly.dto.event.PublicEventResponse;
import java.time.Instant;
import java.util.UUID;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-06-15T11:19:10+0700",
    comments = "version: 1.6.0, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class EventMapperImpl implements EventMapper {

    @Override
    public EventResponse toResponse(Event event, long registeredCount) {
        if ( event == null ) {
            return null;
        }

        UUID id = null;
        String title = null;
        String slug = null;
        String category = null;
        Integer capacity = null;
        String description = null;
        String venue = null;
        String coverColor = null;
        String coverImageUrl = null;
        Instant startsAt = null;
        Instant endsAt = null;
        EventStatus status = null;
        String registrationQrToken = null;
        Instant checkinOpensAt = null;
        UUID createdBy = null;
        Instant createdAt = null;
        Instant updatedAt = null;
        if ( event != null ) {
            id = event.getId();
            title = event.getTitle();
            slug = event.getSlug();
            category = event.getCategory();
            capacity = event.getCapacity();
            description = event.getDescription();
            venue = event.getVenue();
            coverColor = event.getCoverColor();
            coverImageUrl = event.getCoverImageUrl();
            startsAt = event.getStartsAt();
            endsAt = event.getEndsAt();
            status = event.getStatus();
            registrationQrToken = event.getRegistrationQrToken();
            checkinOpensAt = event.getCheckinOpensAt();
            createdBy = event.getCreatedBy();
            createdAt = event.getCreatedAt();
            updatedAt = event.getUpdatedAt();
        }
        long registeredCount1 = 0L;
        registeredCount1 = registeredCount;

        EventResponse eventResponse = new EventResponse( id, title, slug, category, capacity, description, venue, coverColor, coverImageUrl, startsAt, endsAt, status, registeredCount1, registrationQrToken, checkinOpensAt, createdBy, createdAt, updatedAt );

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
