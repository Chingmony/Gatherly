package com.gatherly.repository;

import com.gatherly.domain.AgendaItem;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AgendaItemRepository extends JpaRepository<AgendaItem, UUID> {

  /** An event's run-of-show in display order (matches {@code idx_agenda_item_event_position}). */
  List<AgendaItem> findByEventIdOrderByPositionAsc(UUID eventId);

  /** Highest position currently used by an event, or 0 if it has no items yet. */
  @Query("SELECT COALESCE(MAX(a.position), 0) FROM AgendaItem a WHERE a.eventId = :eventId")
  int findMaxPosition(@Param("eventId") UUID eventId);
}
