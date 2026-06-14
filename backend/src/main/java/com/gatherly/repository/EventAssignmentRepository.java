package com.gatherly.repository;

import com.gatherly.domain.EventAssignment;
import com.gatherly.domain.EventRole;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventAssignmentRepository extends JpaRepository<EventAssignment, UUID> {

  /** Any assignment (MANAGER or HANDLER) → drives {@code canView}. */
  boolean existsByEventIdAndUserId(UUID eventId, UUID userId);

  /** A specific event role → drives {@code canManage} (MANAGER). */
  boolean existsByEventIdAndUserIdAndEventRole(UUID eventId, UUID userId, EventRole eventRole);

  List<EventAssignment> findByEventId(UUID eventId);

  /** Event ids a user is assigned to → service-scoped event listing (M3). */
  List<EventAssignment> findByUserId(UUID userId);
}
