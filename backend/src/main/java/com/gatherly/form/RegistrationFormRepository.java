package com.gatherly.form;

import com.gatherly.form.domain.RegistrationForm;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface RegistrationFormRepository extends JpaRepository<RegistrationForm, UUID> {

    Optional<RegistrationForm> findByEventId(UUID eventId);
}
