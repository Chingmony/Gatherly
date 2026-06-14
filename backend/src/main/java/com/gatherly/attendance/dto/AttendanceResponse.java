package com.gatherly.attendance.dto;

import java.util.List;

/**
 * Live attendance snapshot for an event (docs/03 §4.10): how many have registered vs checked in,
 * plus a bounded most-recent-first feed of confirmed check-ins.
 */
public record AttendanceResponse(
        long registeredCount,
        long checkedInCount,
        List<AttendanceRecord> records
) {
}
