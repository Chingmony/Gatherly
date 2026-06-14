package com.gatherly.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * Guest registration + personal QR ticket ({@code docs/02} §3.10). {@code answers} is JSONB keyed
 * by field key; {@code guestEmail}/{@code guestPhone} are promoted from the answers. {@code
 * checkinToken} is the CSPRNG bearer secret encoded in the QR. No {@code updated_at} — not a {@code
 * BaseEntity}.
 */
@Entity
@Table(name = "registration_submission")
@Getter
@Setter
@NoArgsConstructor
public class RegistrationSubmission {

  @Id @GeneratedValue private UUID id;

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

  @CreationTimestamp
  @Column(name = "submitted_at", updatable = false, nullable = false)
  private Instant submittedAt;
}
