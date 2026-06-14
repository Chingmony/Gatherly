package com.gatherly.repository;

import com.gatherly.domain.RegistrationSubmission;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RegistrationSubmissionRepository
    extends JpaRepository<RegistrationSubmission, UUID> {

  Optional<RegistrationSubmission> findByCheckinToken(String checkinToken);

  Optional<RegistrationSubmission> findByEventIdAndGuestEmailIgnoreCase(
      UUID eventId, String guestEmail);

  Page<RegistrationSubmission> findByEventId(UUID eventId, Pageable pageable);

  long countByEventId(UUID eventId);
}
