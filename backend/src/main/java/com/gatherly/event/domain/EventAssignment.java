package com.gatherly.event.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

/**
 * Event-scoped role grant (docs/02 §3.4) — the join that makes a {@code MEMBER} a Sub-admin
 * ({@code MANAGER}) or {@code HANDLER} on one specific event. This is the heart of the two-layer
 * authorization model (docs/03 §3): event roles live here, resolved per-request, and are
 * <b>never</b> stored in the JWT. Standalone entity (no {@code updated_at}; {@code UNIQUE(event_id,
 * user_id)} enforced at the DB level).
 */
@Entity
@Table(name = "event_assignment")
@EntityListeners(AuditingEntityListener.class)
public class EventAssignment {

    @Id
    @GeneratedValue
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_role", nullable = false)
    private EventRole eventRole;

    @Column(name = "assigned_by")
    private UUID assignedBy;

    @CreatedDate
    @Column(name = "created_at", updatable = false, nullable = false)
    private Instant createdAt;

    protected EventAssignment() {
        // JPA
    }

    public EventAssignment(UUID eventId, UUID userId, EventRole eventRole, UUID assignedBy) {
        this.eventId = eventId;
        this.userId = userId;
        this.eventRole = eventRole;
        this.assignedBy = assignedBy;
    }

    public UUID getId() {
        return id;
    }

    public UUID getEventId() {
        return eventId;
    }

    public UUID getUserId() {
        return userId;
    }

    public EventRole getEventRole() {
        return eventRole;
    }

    public void setEventRole(EventRole eventRole) {
        this.eventRole = eventRole;
    }

    public UUID getAssignedBy() {
        return assignedBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
