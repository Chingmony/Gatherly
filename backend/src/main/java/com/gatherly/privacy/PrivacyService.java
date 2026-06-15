package com.gatherly.privacy;

import com.gatherly.audit.AuditService;
import com.gatherly.common.error.AppException;
import com.gatherly.common.error.ErrorCode;
import com.gatherly.registration.RegistrationSubmissionRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Right-to-erasure (docs/10 §7) — an Admin action to delete a guest's submissions by email and/or
 * phone (cascades to check-ins), supporting basic data-subject requests. Admin-only gate on the
 * service layer (docs/03 §2.2); the action is audited (no guest PII is written into the audit note).
 */
@Service
public class PrivacyService {

    private final RegistrationSubmissionRepository submissions;
    private final AuditService auditService;

    public PrivacyService(RegistrationSubmissionRepository submissions, AuditService auditService) {
        this.submissions = submissions;
        this.auditService = auditService;
    }

    /** Erase a guest's submissions; returns the number removed. At least one identifier required. */
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public int erase(String email, String phone) {
        String e = blankToNull(email);
        String p = blankToNull(phone);
        if (e == null && p == null) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Provide an email or phone to erase.");
        }
        int removed = submissions.deleteByGuestEmailOrPhone(e, p);
        auditService.record("GUEST_ERASED", "SUBMISSION", null, "removed=" + removed);
        return removed;
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s;
    }
}
