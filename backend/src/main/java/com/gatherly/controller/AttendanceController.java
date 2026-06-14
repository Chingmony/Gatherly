package com.gatherly.controller;

import com.gatherly.common.ApiResponse;
import com.gatherly.common.PageMeta;
import com.gatherly.common.paging.PageRequests;
import com.gatherly.dto.attendance.AttendanceSummary;
import com.gatherly.dto.attendance.CheckinResponse;
import com.gatherly.dto.attendance.ManualCheckinRequest;
import com.gatherly.dto.attendance.ScanRequest;
import com.gatherly.dto.attendance.SubmissionSort;
import com.gatherly.dto.attendance.SubmissionSummary;
import com.gatherly.security.UserPrincipal;
import com.gatherly.service.AttendanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Organizer attendance ({@code docs/03} §4.10) + the guest-summary view ({@code docs/03} §4.8).
 * Gates live on {@link AttendanceService}.
 */
@Tag(
    name = "Attendance",
    description =
        "Organizer check-in: QR scans (any assigned staff), manual overrides and ticket revocation"
            + " (manager-level), and the guest submission/attendance summaries. Check-in is"
            + " idempotent — a second scan of the same ticket returns 409 ALREADY_CHECKED_IN.")
@RestController
@RequestMapping("/events/{eventId}")
public class AttendanceController {

  private final AttendanceService attendanceService;

  public AttendanceController(AttendanceService attendanceService) {
    this.attendanceService = attendanceService;
  }

  @Operation(
      summary = "Scan a guest QR to confirm attendance",
      description =
          "Confirms attendance from a guest's QR check-in token. Allowed for ADMIN or any user"
              + " assigned to the event (MANAGER or HANDLER). Idempotent via a unique constraint —"
              + " concurrent/duplicate scans lose with 409 ALREADY_CHECKED_IN. Errors: 404 NOT_FOUND"
              + " for an unknown ticket; 409 TICKET_INVALID if revoked or the check-in window is"
              + " closed.")
  @PostMapping("/attendance/scan")
  @ResponseStatus(HttpStatus.CREATED)
  public ApiResponse<CheckinResponse> scan(
      @PathVariable UUID eventId,
      @Valid @RequestBody ScanRequest request,
      @AuthenticationPrincipal UserPrincipal principal) {
    return ApiResponse.ok(
        "Attendance confirmed.", attendanceService.scan(eventId, request, principal));
  }

  @Operation(
      summary = "Manually confirm attendance (no QR)",
      description =
          "Staff override that checks a guest in by submission id without scanning a QR. Requires"
              + " manage rights (ADMIN or event MANAGER). Idempotent — 409 ALREADY_CHECKED_IN on a"
              + " repeat. Errors: 403 FORBIDDEN; 404 NOT_FOUND; 409 TICKET_INVALID if revoked.")
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

  @Operation(
      summary = "Revoke a ticket",
      description =
          "Invalidates a not-yet-used ticket so it can no longer check in. Requires manage rights"
              + " (ADMIN or event MANAGER). Errors: 403 FORBIDDEN; 404 NOT_FOUND; 409 CONFLICT if"
              + " the ticket is already CHECKED_IN.")
  @PostMapping("/tickets/{submissionId}/revoke")
  public ApiResponse<Void> revoke(@PathVariable UUID eventId, @PathVariable UUID submissionId) {
    attendanceService.revoke(eventId, submissionId);
    return ApiResponse.ok("Ticket revoked.");
  }

  @Operation(
      summary = "Get the attendance summary",
      description =
          "Returns aggregate check-in stats plus the list of confirmed check-ins for the event."
              + " Visible to ADMIN or any user assigned to the event. Errors: 403 FORBIDDEN.")
  @GetMapping("/attendance")
  public ApiResponse<AttendanceSummary> attendance(@PathVariable UUID eventId) {
    return ApiResponse.ok(
        "Attendance retrieved successfully.", attendanceService.attendance(eventId));
  }

  @Operation(
      summary = "List guest registration submissions",
      description =
          "Paginated, searchable list of guest registrations for the event. Visible to ADMIN or any"
              + " user assigned to the event. Query params: `search` (matches guest name), `page`"
              + " (default 0), `size` (default 20, max 100), `sort` = DATE | NAME | EMAIL | STATUS"
              + " (default DATE = submission time), `direction` = ASC | DESC (default ASC). Errors:"
              + " 403 FORBIDDEN.")
  @GetMapping("/submissions")
  public ApiResponse<List<SubmissionSummary>> submissions(
      @PathVariable UUID eventId,
      @RequestParam(required = false) String search,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(defaultValue = "DATE") SubmissionSort sort,
      @RequestParam(defaultValue = "ASC") Sort.Direction direction) {
    Pageable pageable = PageRequests.of(page, size, sort, direction);
    Page<SubmissionSummary> result = attendanceService.submissions(eventId, search, pageable);
    return ApiResponse.page(
        "Submissions retrieved successfully.", result.getContent(), PageMeta.from(result));
  }
}
