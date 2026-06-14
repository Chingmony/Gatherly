package com.gatherly.material;

import com.gatherly.material.domain.MaterialStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MaterialStatusHistoryRepository extends JpaRepository<MaterialStatusHistory, UUID> {

    /** Chronological audit trail for one material (docs/03 §4.7 — history). */
    List<MaterialStatusHistory> findByMaterialIdOrderByCreatedAtAsc(UUID materialId);
}
