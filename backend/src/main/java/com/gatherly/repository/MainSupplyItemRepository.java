package com.gatherly.repository;

import com.gatherly.domain.MainSupplyItem;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MainSupplyItemRepository extends JpaRepository<MainSupplyItem, UUID> {

  @Query(
      """
      SELECT i FROM MainSupplyItem i
      WHERE (:q IS NULL OR LOWER(i.name) LIKE LOWER(CONCAT('%', CAST(:q AS string), '%')))
      """)
  Page<MainSupplyItem> search(@Param("q") String q, Pageable pageable);
}
