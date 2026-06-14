package com.gatherly.organization;

import com.gatherly.organization.domain.Organization;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface OrganizationRepository extends JpaRepository<Organization, UUID> {

    /**
     * Load the singleton org profile (docs/02 §3.1). The row is seeded once; ordering by
     * {@code createdAt} deterministically returns it even if the fixed seed id ever changes.
     */
    Optional<Organization> findFirstByOrderByCreatedAtAsc();

    default Optional<Organization> findSingleton() {
        return findFirstByOrderByCreatedAtAsc();
    }
}
