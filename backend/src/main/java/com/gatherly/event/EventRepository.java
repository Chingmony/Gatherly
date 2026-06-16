package com.gatherly.event;

import com.gatherly.event.domain.Event;
import com.gatherly.event.domain.EventStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EventRepository extends JpaRepository<Event, UUID> {

    boolean existsBySlug(String slug);

    Optional<Event> findBySlug(String slug);

    /** Public detail lookup — pushes the visibility filter into the index so non-PUBLIC slugs 404
     *  without hydrating the row (docs/03 §4.9). */
    Optional<Event> findBySlugAndStatus(String slug, EventStatus status);

    /** Public homepage listing (docs/03 §4.9) — every PUBLIC event, soonest first. */
    List<Event> findByStatusOrderByStartsAtAsc(EventStatus status);

    Page<Event> findByTitleContainingIgnoreCase(String title, Pageable pageable);

    /**
     * Events visible to a non-admin member (M3): events where the caller holds any assignment
     * (MANAGER or HANDLER) in {@code event_assignment}. Replaces the M2 createdBy stub.
     * The explicit countQuery lets Spring Data paginate correctly when the driving table is Event.
     */
    @Query(value = """
            select e from Event e
            where e.id in (select a.eventId from EventAssignment a where a.userId = :userId)
            """,
           countQuery = """
            select count(e) from Event e
            where e.id in (select a.eventId from EventAssignment a where a.userId = :userId)
            """)
    Page<Event> findByAssignedUserId(@Param("userId") UUID userId, Pageable pageable);

    /**
     * Same as {@link #findByAssignedUserId} with an additional title filter for search.
     */
    @Query(value = """
            select e from Event e
            where e.id in (select a.eventId from EventAssignment a where a.userId = :userId)
            and lower(e.title) like lower(concat('%', :query, '%'))
            """,
           countQuery = """
            select count(e) from Event e
            where e.id in (select a.eventId from EventAssignment a where a.userId = :userId)
            and lower(e.title) like lower(concat('%', :query, '%'))
            """)
    Page<Event> findByAssignedUserIdAndTitleContaining(@Param("userId") UUID userId,
                                                       @Param("query") String query,
                                                       Pageable pageable);

    // ---- Admin Command Center dashboard (docs/03 §4.13, docs/06 §11) --------

    /**
     * Lifecycle counts across <b>all</b> events in one grouped query (no per-status round-trips),
     * so the dashboard tabs stay correct even when the row list below is capped.
     */
    @Query("select e.status as status, count(e) as cnt from Event e group by e.status")
    List<StatusCount> countGroupedByStatus();

    /** Sum of declared capacities (events with {@code capacity = null} are unlimited → excluded). */
    @Query("select coalesce(sum(e.capacity), 0) from Event e where e.capacity is not null")
    long sumCapacity();

    /**
     * Bounded event-control feed, most recent first. Capped via {@link Pageable} so the dashboard
     * never issues an unbounded scan (docs/11 §perf); lifecycle totals come from
     * {@link #countGroupedByStatus()} which is unaffected by the cap.
     */
    List<Event> findAllByOrderByStartsAtDesc(Pageable pageable);

    /** Projection for {@link #countGroupedByStatus()}. */
    interface StatusCount {
        EventStatus getStatus();

        long getCnt();
    }
}
