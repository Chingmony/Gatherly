package com.gatherly.repository;

import com.gatherly.domain.RegistrationForm;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RegistrationFormRepository extends JpaRepository<RegistrationForm, UUID> {

  Optional<RegistrationForm> findByEventId(UUID eventId);
}
