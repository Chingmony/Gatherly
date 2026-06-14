package com.gatherly.attendance;

import com.gatherly.attendance.domain.EventCheckin;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EventCheckinRepository extends JpaRepository<EventCheckin, UUID> {

    /** Idempotency probe — the existing attendance row for a ticket (one per submission). */
    Optional<EventCheckin> findBySubmissionId(UUID submissionId);

    /** Live attendance count for an event (docs/03 §4.10). */
    long countByEventId(UUID eventId);

    /**
     * Live attendance feed — most-recent-first, bounded by {@link Pageable} so the read never scans
     * unbounded (docs/06 §8). Backed by {@code INDEX(event_id, checked_in_at)} (docs/02 §3.11).
     */
    List<EventCheckin> findByEventIdOrderByCheckedInAtDesc(UUID eventId, Pageable pageable);

    /**
     * Telegram ops retry sweep source (docs/04 §2.2, docs/06 §7): check-ins not yet forwarded to the
     * ops channel, past a grace window so the after-commit immediate push goes first. Bounded by
     * {@link Pageable}; backed by the partial index {@code idx_event_checkin_ops_sweep} (docs/02 §7).
     */
    List<EventCheckin> findByTelegramNotifiedFalseAndCheckedInAtBeforeOrderByCheckedInAtAsc(
            Instant before, Pageable pageable);
}
