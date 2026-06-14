package com.gatherly.event;

import com.gatherly.event.domain.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface EventRepository extends JpaRepository<Event, UUID> {

    boolean existsBySlug(String slug);

    Optional<Event> findBySlug(String slug);

    Page<Event> findByTitleContainingIgnoreCase(String title, Pageable pageable);

    /**
     * Events visible to a non-admin caller (docs/03 §4.4: "assigned only — service-scoped").
     * In M2 the only relation a member can have to an event is having created it; the full
     * {@code event_assignment} join (MANAGER/HANDLER) is wired in M3.
     */
    Page<Event> findByCreatedBy(UUID createdBy, Pageable pageable);
}
