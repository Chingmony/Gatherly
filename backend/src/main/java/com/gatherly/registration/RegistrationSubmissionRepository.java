package com.gatherly.registration;

import com.gatherly.registration.domain.RegistrationSubmission;
import com.gatherly.registration.domain.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RegistrationSubmissionRepository extends JpaRepository<RegistrationSubmission, UUID> {

    boolean existsByEventIdAndGuestEmailIgnoreCase(UUID eventId, String guestEmail);

    long countByEventId(UUID eventId);

    /** Org-wide checked-in total for the dashboard's registration-momentum card (docs/06 §11). */
    long countByQrStatus(com.gatherly.registration.domain.TicketStatus qrStatus);

    /**
     * Grouped checked-in counts for a set of events — one query for the whole control table
     * (mirrors {@link #countByEventIds}; avoids an N+1 count-per-event loop).
     */
    @Query("select s.eventId as eventId, count(s) as cnt from RegistrationSubmission s "
            + "where s.eventId in :eventIds and s.qrStatus = :status group by s.eventId")
    List<EventSubmissionCount> countByEventIdsAndQrStatus(
            Collection<UUID> eventIds, com.gatherly.registration.domain.TicketStatus status);

    Page<RegistrationSubmission> findByEventId(UUID eventId, Pageable pageable);

    Optional<RegistrationSubmission> findByCheckinToken(String checkinToken);

    /**
     * QR-email retry sweep source (docs/06 §7): tickets still {@code PENDING} past a grace window.
     * Bounded by {@link Pageable} so the sweep never scans unbounded; ordered oldest-first.
     */
    List<RegistrationSubmission> findByQrStatusAndSubmittedAtBeforeOrderBySubmittedAtAsc(
            TicketStatus qrStatus, Instant before, Pageable pageable);

    /**
     * Telegram ops retry sweep source (docs/04 §2.2, docs/06 §7): registrations not yet forwarded to
     * the ops channel, past a grace window so the after-commit immediate push goes first. Bounded by
     * {@link Pageable}; backed by the partial index {@code idx_submission_ops_sweep} (docs/02 §7).
     */
    List<RegistrationSubmission> findByTelegramNotifiedFalseAndSubmittedAtBeforeOrderBySubmittedAtAsc(
            Instant before, Pageable pageable);

    /** One grouped count for the public homepage — avoids an N+1 count-per-event loop. */
    @Query("select s.eventId as eventId, count(s) as cnt from RegistrationSubmission s "
            + "where s.eventId in :eventIds group by s.eventId")
    List<EventSubmissionCount> countByEventIds(Collection<UUID> eventIds);

    /** Projection for {@link #countByEventIds}. */
    interface EventSubmissionCount {
        UUID getEventId();

        long getCnt();
    }
}
