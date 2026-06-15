package com.gatherly.event;

import com.gatherly.event.domain.EventAssignment;
import com.gatherly.event.domain.EventRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EventAssignmentRepository extends JpaRepository<EventAssignment, UUID> {

    List<EventAssignment> findByEventId(UUID eventId);

    /**
     * Per-user assignment scope for the admin Users table (docs/03 §4.2) — one grouped query for the
     * whole page rather than N per-user counts. {@code title} is the event name (meaningful only when
     * {@code cnt == 1}, where it is that single assignment's event).
     */
    @Query("""
            select a.userId as userId, count(a) as cnt, min(e.title) as title
            from EventAssignment a join Event e on e.id = a.eventId
            where a.userId in :userIds
            group by a.userId
            """)
    List<UserScopeProjection> scopeByUserIds(@Param("userIds") Collection<UUID> userIds);

    /** Projection for {@link #scopeByUserIds(Collection)}. */
    interface UserScopeProjection {
        UUID getUserId();

        long getCnt();

        String getTitle();
    }

    /** Managers (Sub-admins) across a set of events — one query for the dashboard control table. */
    List<EventAssignment> findByEventIdInAndEventRole(Collection<UUID> eventIds, EventRole eventRole);

    Optional<EventAssignment> findByEventIdAndUserId(UUID eventId, UUID userId);

    boolean existsByEventIdAndUserId(UUID eventId, UUID userId);

    /** Layer-2 authz probe: does this user hold a (or this) role on the event? (docs/03 §3) */
    boolean existsByEventIdAndUserIdAndEventRole(UUID eventId, UUID userId, EventRole eventRole);
}
