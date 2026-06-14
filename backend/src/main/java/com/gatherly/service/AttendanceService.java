package com.gatherly.service;

import com.gatherly.dto.attendance.AttendanceSummary;
import com.gatherly.dto.attendance.CheckinResponse;
import com.gatherly.dto.attendance.ManualCheckinRequest;
import com.gatherly.dto.attendance.ScanRequest;
import com.gatherly.dto.attendance.SubmissionSummary;
import com.gatherly.security.UserPrincipal;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/** Organizer attendance ({@code docs/03} §4.10, {@code docs/06} §4). */
public interface AttendanceService {

  /** Idempotent QR scan → confirms attendance; re-scan → 409 ALREADY_CHECKED_IN. */
  CheckinResponse scan(UUID eventId, ScanRequest request, UserPrincipal principal);

  /** Manager override without a QR. */
  CheckinResponse manualCheckin(
      UUID eventId, ManualCheckinRequest request, UserPrincipal principal);

  /** Invalidate a non-checked-in ticket. */
  void revoke(UUID eventId, UUID submissionId);

  AttendanceSummary attendance(UUID eventId);

  Page<SubmissionSummary> submissions(UUID eventId, Pageable pageable);
}
