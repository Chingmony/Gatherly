package com.gatherly.repository;

import com.gatherly.domain.RegistrationSubmission;
import com.gatherly.domain.TicketStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RegistrationSubmissionRepository
    extends JpaRepository<RegistrationSubmission, UUID> {

  Optional<RegistrationSubmission> findByCheckinToken(String checkinToken);

  Optional<RegistrationSubmission> findByEventIdAndGuestEmailIgnoreCase(
      UUID eventId, String guestEmail);

  /** Event-scoped submission search by guest name (case-insensitive); sort applied via Pageable. */
  @Query(
      """
      SELECT s FROM RegistrationSubmission s
      WHERE s.eventId = :eventId
        AND (:q IS NULL OR LOWER(s.guestName) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')))
      """)
  Page<RegistrationSubmission> search(
      @Param("eventId") UUID eventId, @Param("q") String q, Pageable pageable);

  long countByEventId(UUID eventId);

  /** Retry source for the QR-email sweep ({@code docs/06} §7): tickets stuck PENDING. */
  List<RegistrationSubmission> findTop50ByQrStatusOrderBySubmittedAtAsc(TicketStatus qrStatus);
}
