package com.gatherly.controller;

import com.gatherly.common.ApiResponse;
import com.gatherly.common.PageMeta;
import com.gatherly.dto.attendance.AttendanceSummary;
import com.gatherly.dto.attendance.CheckinResponse;
import com.gatherly.dto.attendance.ManualCheckinRequest;
import com.gatherly.dto.attendance.ScanRequest;
import com.gatherly.dto.attendance.SubmissionSummary;
import com.gatherly.security.UserPrincipal;
import com.gatherly.service.AttendanceService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Organizer attendance ({@code docs/03} §4.10) + the guest-summary view ({@code docs/03} §4.8).
 * Gates live on {@link AttendanceService}.
 */
@RestController
@RequestMapping("/events/{eventId}")
public class AttendanceController {

  private final AttendanceService attendanceService;

  public AttendanceController(AttendanceService attendanceService) {
    this.attendanceService = attendanceService;
  }

  @PostMapping("/attendance/scan")
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<CheckinResponse> scan(
      @PathVariable UUID eventId,
      @Valid @RequestBody ScanRequest request,
      @AuthenticationPrincipal UserPrincipal principal) {
    return ApiResponse.ok(
        "Attendance confirmed.", attendanceService.scan(eventId, request, principal));
  }

  @PostMapping("/attendance/manual")
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<CheckinResponse> manual(
      @PathVariable UUID eventId,
      @Valid @RequestBody ManualCheckinRequest request,
      @AuthenticationPrincipal UserPrincipal principal) {
    return ApiResponse.ok(
        "Attendance confirmed (manual).",
        attendanceService.manualCheckin(eventId, request, principal));
  }

  @PostMapping("/tickets/{submissionId}/revoke")
  public ApiResponse<Void> revoke(@PathVariable UUID eventId, @PathVariable UUID submissionId) {
    attendanceService.revoke(eventId, submissionId);
    return ApiResponse.ok("Ticket revoked.");
  }

  @GetMapping("/attendance")
  public ApiResponse<AttendanceSummary> attendance(@PathVariable UUID eventId) {
    return ApiResponse.ok(
        "Attendance retrieved successfully.", attendanceService.attendance(eventId));
  }

  @GetMapping("/submissions")
  public ApiResponse<List<SubmissionSummary>> submissions(
      @PathVariable UUID eventId, @PageableDefault(size = 50) Pageable pageable) {
    Page<SubmissionSummary> page = attendanceService.submissions(eventId, pageable);
    return ApiResponse.page(
        "Submissions retrieved successfully.", page.getContent(), PageMeta.from(page));
  }
}
