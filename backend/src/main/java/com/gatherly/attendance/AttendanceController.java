package com.gatherly.attendance;

import com.gatherly.attendance.dto.AttendanceResponse;
import com.gatherly.attendance.dto.CheckinResult;
import com.gatherly.attendance.dto.ManualCheckinRequest;
import com.gatherly.attendance.dto.ScanRequest;
import com.gatherly.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Attendance — organizer QR scan (docs/03 §4.10). Thin controller: every gate lives on
 * {@link AttendanceService}. {@code scan} is open to assigned staff ({@code canView}); manual
 * override + revoke are manager-gated ({@code canManage}).
 */
@RestController
@RequestMapping("/api/v1/events/{eventId}")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @PostMapping("/attendance/scan")
    public ResponseEntity<CheckinResult> scan(@PathVariable UUID eventId,
                                              @Valid @RequestBody ScanRequest req,
                                              @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(attendanceService.scan(eventId, req, principal));
    }

    @PostMapping("/attendance/manual")
    public ResponseEntity<CheckinResult> manual(@PathVariable UUID eventId,
                                                @Valid @RequestBody ManualCheckinRequest req,
                                                @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(attendanceService.manual(eventId, req, principal));
    }

    @PostMapping("/tickets/{submissionId}/revoke")
    public ResponseEntity<Void> revoke(@PathVariable UUID eventId, @PathVariable UUID submissionId) {
        attendanceService.revoke(eventId, submissionId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/attendance")
    public AttendanceResponse live(@PathVariable UUID eventId) {
        return attendanceService.liveAttendance(eventId);
    }
}
