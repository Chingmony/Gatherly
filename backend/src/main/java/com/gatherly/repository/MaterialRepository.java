package com.gatherly.repository;

import com.gatherly.domain.Material;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MaterialRepository extends JpaRepository<Material, UUID> {

  /** Event-scoped material search by name (case-insensitive); sort is applied via the Pageable. */
  @Query(
      """
      SELECT m FROM Material m
      WHERE m.eventId = :eventId
        AND (:q IS NULL OR LOWER(m.name) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')))
      """)
  Page<Material> search(@Param("eventId") UUID eventId, @Param("q") String q, Pageable pageable);

  boolean existsByCatalogItemId(UUID catalogItemId);
}
