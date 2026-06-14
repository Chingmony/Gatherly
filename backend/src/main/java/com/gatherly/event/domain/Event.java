package com.gatherly.event.domain;

import com.gatherly.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

/**
 * Event (docs/02 §3.3). {@code slug} is the public URL key (unique); {@code status} drives the
 * lifecycle {@code DRAFT → PUBLIC → ARCHIVED}. {@code createdBy} references the Admin creator;
 * event-scoped roles live in {@code event_assignment} (M3), never here.
 *
 * <p>{@code registrationQrToken} (optional poster discovery QR) and {@code checkinOpensAt} are
 * carried for later milestones (M5/M6/M7) and are not set during M2 CRUD.
 */
@Entity
@Table(name = "event")
public class Event extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Column(unique = true)
    private String slug;

    @Column
    private String description;

    @Column
    private String venue;

    @Column(name = "starts_at")
    private Instant startsAt;

    @Column(name = "ends_at")
    private Instant endsAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventStatus status = EventStatus.DRAFT;

    @Column(name = "registration_qr_token", unique = true)
    private String registrationQrToken;

    @Column(name = "checkin_opens_at")
    private Instant checkinOpensAt;

    @Column(name = "created_by")
    private UUID createdBy;

    public Event() {
        // JPA
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getVenue() {
        return venue;
    }

    public void setVenue(String venue) {
        this.venue = venue;
    }

    public Instant getStartsAt() {
        return startsAt;
    }

    public void setStartsAt(Instant startsAt) {
        this.startsAt = startsAt;
    }

    public Instant getEndsAt() {
        return endsAt;
    }

    public void setEndsAt(Instant endsAt) {
        this.endsAt = endsAt;
    }

    public EventStatus getStatus() {
        return status;
    }

    public void setStatus(EventStatus status) {
        this.status = status;
    }

    public String getRegistrationQrToken() {
        return registrationQrToken;
    }

    public void setRegistrationQrToken(String registrationQrToken) {
        this.registrationQrToken = registrationQrToken;
    }

    public Instant getCheckinOpensAt() {
        return checkinOpensAt;
    }

    public void setCheckinOpensAt(Instant checkinOpensAt) {
        this.checkinOpensAt = checkinOpensAt;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(UUID createdBy) {
        this.createdBy = createdBy;
    }
}
