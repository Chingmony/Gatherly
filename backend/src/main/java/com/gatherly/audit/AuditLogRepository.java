package com.gatherly.audit;

import com.gatherly.audit.domain.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    /** Most-recent-first, paginated (backed by idx_audit_log_created). */
    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
