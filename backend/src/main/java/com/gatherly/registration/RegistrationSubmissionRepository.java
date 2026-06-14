package com.gatherly.registration;

import com.gatherly.registration.domain.RegistrationSubmission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RegistrationSubmissionRepository extends JpaRepository<RegistrationSubmission, UUID> {

    boolean existsByEventIdAndGuestEmailIgnoreCase(UUID eventId, String guestEmail);

    long countByEventId(UUID eventId);

    Page<RegistrationSubmission> findByEventId(UUID eventId, Pageable pageable);

    Optional<RegistrationSubmission> findByCheckinToken(String checkinToken);
}
