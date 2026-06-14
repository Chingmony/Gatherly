package com.gatherly.registration.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

/**
 * Guest registration + per-guest QR ticket (docs/02 §3.10). {@code answers} is JSONB (validated
 * server-side against the form schema before insert). {@code checkinToken} is the high-entropy
 * value encoded in the guest's QR (bearer secret). Standalone entity ({@code submitted_at} only,
 * no updated_at). {@code UNIQUE(event_id, guest_email)} and {@code UNIQUE(checkin_token)} at DB level.
 */
@Entity
@Table(name = "registration_submission")
@EntityListeners(AuditingEntityListener.class)
public class RegistrationSubmission {

    @Id
    @GeneratedValue
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "form_id", nullable = false)
    private UUID formId;

    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private String answers = "{}";

    @Column(name = "guest_name")
    private String guestName;

    @Column(name = "guest_email", nullable = false)
    private String guestEmail;

    @Column(name = "guest_phone", nullable = false)
    private String guestPhone;

    @Column(name = "checkin_token", nullable = false, unique = true)
    private String checkinToken;

    @Enumerated(EnumType.STRING)
    @Column(name = "qr_status", nullable = false)
    private TicketStatus qrStatus = TicketStatus.PENDING;

    @Column(name = "qr_delivered_at")
    private Instant qrDeliveredAt;

    @Column(name = "form_version", nullable = false)
    private int formVersion;

    @CreatedDate
    @Column(name = "submitted_at", updatable = false, nullable = false)
    private Instant submittedAt;

    public RegistrationSubmission() {
        // JPA + service construction
    }

    public UUID getId() {
        return id;
    }

    public UUID getFormId() {
        return formId;
    }

    public void setFormId(UUID formId) {
        this.formId = formId;
    }

    public UUID getEventId() {
        return eventId;
    }

    public void setEventId(UUID eventId) {
        this.eventId = eventId;
    }

    public String getAnswers() {
        return answers;
    }

    public void setAnswers(String answers) {
        this.answers = answers;
    }

    public String getGuestName() {
        return guestName;
    }

    public void setGuestName(String guestName) {
        this.guestName = guestName;
    }

    public String getGuestEmail() {
        return guestEmail;
    }

    public void setGuestEmail(String guestEmail) {
        this.guestEmail = guestEmail;
    }

    public String getGuestPhone() {
        return guestPhone;
    }

    public void setGuestPhone(String guestPhone) {
        this.guestPhone = guestPhone;
    }

    public String getCheckinToken() {
        return checkinToken;
    }

    public void setCheckinToken(String checkinToken) {
        this.checkinToken = checkinToken;
    }

    public TicketStatus getQrStatus() {
        return qrStatus;
    }

    public void setQrStatus(TicketStatus qrStatus) {
        this.qrStatus = qrStatus;
    }

    public Instant getQrDeliveredAt() {
        return qrDeliveredAt;
    }

    public void setQrDeliveredAt(Instant qrDeliveredAt) {
        this.qrDeliveredAt = qrDeliveredAt;
    }

    public int getFormVersion() {
        return formVersion;
    }

    public void setFormVersion(int formVersion) {
        this.formVersion = formVersion;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }
}
