package com.gatherly.domain;

import com.gatherly.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Per-event run-of-show slot ({@code docs/02} §3.8). Rows are ordered by {@code position} within an
 * event ({@code idx_agenda_item_event_position}). {@code startsAt}/{@code endsAt} are nullable —
 * a slot may be sequenced before its times are pinned down.
 */
@Entity
@Table(name = "agenda_item")
@Getter
@Setter
@NoArgsConstructor
public class AgendaItem extends BaseEntity {

  @Column(name = "event_id", nullable = false)
  private UUID eventId;

  @Column(nullable = false)
  private String title;

  @Column(name = "starts_at")
  private Instant startsAt;

  @Column(name = "ends_at")
  private Instant endsAt;

  @Column(nullable = false)
  private Integer position;
}
