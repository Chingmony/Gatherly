package com.gatherly.attendance.dto;

import com.gatherly.attendance.domain.CheckinSource;

import java.time.Instant;
import java.util.UUID;

/**
 * One row in the live attendance feed (docs/03 §4.10). {@code scannedByName} is batch-resolved from
 * the scanning staff member (no N+1, docs/06 §8).
 */
public record AttendanceRecord(
        UUID checkinId,
        UUID submissionId,
        String guestName,
        String guestPhone,
        Instant checkedInAt,
        CheckinSource source,
        String scannedByName
) {
}
