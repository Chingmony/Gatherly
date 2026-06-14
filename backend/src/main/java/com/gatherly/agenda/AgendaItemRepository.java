package com.gatherly.agenda;

import com.gatherly.agenda.domain.AgendaItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AgendaItemRepository extends JpaRepository<AgendaItem, UUID> {

    List<AgendaItem> findByEventIdOrderByPositionAsc(UUID eventId);

    void deleteByEventId(UUID eventId);
}
