package com.gatherly.repository;

import com.gatherly.domain.MaterialStatusHistory;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MaterialStatusHistoryRepository
    extends JpaRepository<MaterialStatusHistory, UUID> {

  List<MaterialStatusHistory> findByMaterialIdOrderByCreatedAtAsc(UUID materialId);
}
