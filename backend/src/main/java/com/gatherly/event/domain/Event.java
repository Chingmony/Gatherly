package com.gatherly.event.domain;

import com.gatherly.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
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

    /** Free-text label (Conference, Festival, Workshop, …) for cards/filters (docs/02 §3.3). */
    @Column
    private String category;

    /** Max registrations; {@code null} = unlimited. */
    @Column
    private Integer capacity;

    /** Short free-text labels shown as chips on the public detail hero (docs/02 §3.3). */
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "tags", columnDefinition = "text[]", nullable = false)
    private List<String> tags = new ArrayList<>();

    /** Cover gradient preset key {@code a–f}; used when {@link #coverImageKey} is unset. */
    @Column(name = "cover_gradient", nullable = false)
    private String coverGradient = "a";

    /** Rustfs object key for an uploaded cover image (overrides the gradient). */
    @Column(name = "cover_image_key")
    private String coverImageKey;

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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags == null ? new ArrayList<>() : tags;
    }

    public String getCoverGradient() {
        return coverGradient;
    }

    public void setCoverGradient(String coverGradient) {
        this.coverGradient = coverGradient;
    }

    public String getCoverImageKey() {
        return coverImageKey;
    }

    public void setCoverImageKey(String coverImageKey) {
        this.coverImageKey = coverImageKey;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(UUID createdBy) {
        this.createdBy = createdBy;
    }
}
