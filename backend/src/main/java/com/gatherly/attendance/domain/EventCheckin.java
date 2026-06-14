package com.gatherly.attendance.domain;

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
 * Organizer-confirmed attendance record (docs/02 §3.11, docs/06 §4). Created when an organizer scans
 * a guest's QR (or via a manual staff override). The {@code UNIQUE(submission_id)} constraint at the
 * DB level is the source of truth for idempotency — a second scan of the same ticket can never insert
 * a second row, so a door-rush double scan maps to {@code 409 ALREADY_CHECKED_IN}. Standalone entity
 * ({@code checked_in_at} + {@code created_at} only, no {@code updated_at}).
 */
@Entity
@Table(name = "event_checkin")
@EntityListeners(AuditingEntityListener.class)
public class EventCheckin {

    @Id
    @GeneratedValue
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    @Column(name = "submission_id", nullable = false, unique = true)
    private UUID submissionId;

    @Column(name = "guest_phone", nullable = false)
    private String guestPhone;

    @Column(name = "guest_name")
    private String guestName;

    @Column(name = "scanned_by", nullable = false)
    private UUID scannedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CheckinSource source = CheckinSource.QR_SCAN;

    @Column(name = "telegram_notified", nullable = false)
    private boolean telegramNotified = false;

    @Column(name = "checked_in_at", nullable = false)
    private Instant checkedInAt;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    public EventCheckin() {
        // JPA + service construction
    }

    public UUID getId() {
        return id;
    }

    public UUID getEventId() {
        return eventId;
    }

    public void setEventId(UUID eventId) {
        this.eventId = eventId;
    }

    public UUID getSubmissionId() {
        return submissionId;
    }

    public void setSubmissionId(UUID submissionId) {
        this.submissionId = submissionId;
    }

    public String getGuestPhone() {
        return guestPhone;
    }

    public void setGuestPhone(String guestPhone) {
        this.guestPhone = guestPhone;
    }

    public String getGuestName() {
        return guestName;
    }

    public void setGuestName(String guestName) {
        this.guestName = guestName;
    }

    public UUID getScannedBy() {
        return scannedBy;
    }

    public void setScannedBy(UUID scannedBy) {
        this.scannedBy = scannedBy;
    }

    public CheckinSource getSource() {
        return source;
    }

    public void setSource(CheckinSource source) {
        this.source = source;
    }

    public boolean isTelegramNotified() {
        return telegramNotified;
    }

    public void setTelegramNotified(boolean telegramNotified) {
        this.telegramNotified = telegramNotified;
    }

    public Instant getCheckedInAt() {
        return checkedInAt;
    }

    public void setCheckedInAt(Instant checkedInAt) {
        this.checkedInAt = checkedInAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
