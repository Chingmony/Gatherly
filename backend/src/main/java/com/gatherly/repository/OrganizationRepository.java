package com.gatherly.repository;

import com.gatherly.domain.Organization;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrganizationRepository extends JpaRepository<Organization, UUID> {

  /** The singleton profile (seeded by {@code V3__seed_organization.sql}). */
  Optional<Organization> findFirstByOrderByCreatedAtAsc();
}
