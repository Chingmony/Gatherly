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
 * User×event delegation row carrying the event-scoped role ({@code docs/02} §3.4) — the heart of
 * the two-layer authorization model. {@code UNIQUE(event_id, user_id)} (one role per user per
 * event). Does not extend {@code BaseEntity}: this table has no {@code updated_at}.
 */
@Entity
@Table(name = "event_assignment")
@Getter
@Setter
@NoArgsConstructor
public class EventAssignment {

  @Id @GeneratedValue private UUID id;

  @Column(name = "event_id", nullable = false)
  private UUID eventId;

  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Enumerated(EnumType.STRING)
  @Column(name = "event_role", nullable = false)
  private EventRole eventRole;

  @Column(name = "assigned_by")
  private UUID assignedBy;

  @CreationTimestamp
  @Column(name = "created_at", updatable = false, nullable = false)
  private Instant createdAt;
}
