package com.gatherly.audit;

import com.gatherly.audit.dto.AuditResponse;
import com.gatherly.common.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin read access to the privileged-action audit trail (docs/08 §5, §9). The Admin-only gate
 * lives on {@link AuditService#list} (service layer, docs/03 §2.2); this controller is thin.
 */
@RestController
@RequestMapping("/api/v1")
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping("/audit-log")
    public PageResponse<AuditResponse> list(@PageableDefault(size = 20) Pageable pageable) {
        return PageResponse.of(auditService.list(pageable), AuditResponse::from);
    }
}
