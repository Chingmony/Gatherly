package com.gatherly.audit;

import com.gatherly.audit.domain.AuditLog;
import com.gatherly.security.UserPrincipal;
import org.slf4j.MDC;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Privileged-action audit trail (docs/08 §5, docs/10 §audit). {@link #record} appends a row in the
 * caller's transaction (so the audit commits iff the action does) and resolves the actor from the
 * security context and the {@code traceId} from the logging MDC — callers just name the action.
 * Admins can read it via {@link #list} ({@code GET /audit-log}).
 */
@Service
public class AuditService {

    private final AuditLogRepository repo;

    public AuditService(AuditLogRepository repo) {
        this.repo = repo;
    }

    /** Append an audit entry for a privileged action. Actor + traceId are resolved automatically. */
    @Transactional
    public void record(String action, String targetType, UUID targetId, String detail) {
        UUID actorId = null;
        String actorEmail = null;
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            actorId = principal.id();
            actorEmail = principal.email();
        }
        repo.save(new AuditLog(actorId, actorEmail, action, targetType, targetId, detail,
                MDC.get("traceId")));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public Page<AuditLog> list(Pageable pageable) {
        return repo.findAllByOrderByCreatedAtDesc(pageable);
    }
}
