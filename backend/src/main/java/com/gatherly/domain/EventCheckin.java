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

/**
 * Organizer-confirmed attendance ({@code docs/02} §3.11). {@code UNIQUE(submission_id)} makes a
 * second scan a no-op conflict — the source of truth for idempotent, replay-safe attendance. Does
 * not extend {@code BaseEntity}: no {@code updated_at}.
 */
@Entity
@Table(name = "event_checkin")
@Getter
@Setter
@NoArgsConstructor
public class EventCheckin {

  @Id @GeneratedValue private UUID id;

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

  @CreationTimestamp
  @Column(name = "created_at", updatable = false, nullable = false)
  private Instant createdAt;
}
