package com.gatherly.material;

import com.gatherly.material.domain.Material;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MaterialRepository extends JpaRepository<Material, UUID> {

    /** Materials of one event, newest first (event-scoped list, docs/03 §4.7). */
    List<Material> findByEventIdOrderByCreatedAtDesc(UUID eventId);

    /** A Handler's assigned tasks across all events ({@code GET /materials/mine}). */
    List<Material> findByAssignedToOrderByCreatedAtDesc(UUID assignedTo);

    /** Guards main-supply-item deletion: a referenced catalog item must not be removed (docs/02 §3.6). */
    boolean existsByCatalogItemId(UUID catalogItemId);
}
