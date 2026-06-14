package com.gatherly.repository;

import com.gatherly.domain.Material;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MaterialRepository extends JpaRepository<Material, UUID> {

  Page<Material> findByEventId(UUID eventId, Pageable pageable);

  boolean existsByCatalogItemId(UUID catalogItemId);
}
