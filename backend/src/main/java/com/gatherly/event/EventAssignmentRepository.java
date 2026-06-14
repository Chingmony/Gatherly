package com.gatherly.event;

import com.gatherly.event.domain.EventAssignment;
import com.gatherly.event.domain.EventRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EventAssignmentRepository extends JpaRepository<EventAssignment, UUID> {

    List<EventAssignment> findByEventId(UUID eventId);

    Optional<EventAssignment> findByEventIdAndUserId(UUID eventId, UUID userId);

    boolean existsByEventIdAndUserId(UUID eventId, UUID userId);

    /** Layer-2 authz probe: does this user hold a (or this) role on the event? (docs/03 §3) */
    boolean existsByEventIdAndUserIdAndEventRole(UUID eventId, UUID userId, EventRole eventRole);
}
