package com.gatherly.domain;

import com.gatherly.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Event ({@code docs/02} §3.3). {@code slug} is the public URL key; {@code registrationQrToken} is
 * an optional poster QR for discovery (NOT attendance). Lifecycle is enforced via {@link
 * EventStatus}.
 */
@Entity
@Table(name = "event")
@Getter
@Setter
@NoArgsConstructor
public class Event extends BaseEntity {

  @Column(nullable = false)
  private String title;

  @Column(unique = true)
  private String slug;

  @Column private String description;

  @Column private String venue;

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
}
