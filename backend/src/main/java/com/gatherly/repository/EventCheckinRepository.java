package com.gatherly.repository;

import com.gatherly.domain.EventCheckin;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventCheckinRepository extends JpaRepository<EventCheckin, UUID> {

  Optional<EventCheckin> findBySubmissionId(UUID submissionId);

  List<EventCheckin> findByEventIdOrderByCheckedInAtDesc(UUID eventId);

  long countByEventId(UUID eventId);
}
