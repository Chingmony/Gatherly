package com.gatherly.dto.attendance;

import java.util.List;
import java.util.UUID;

/** Live attendance view: counts + the confirmed check-ins (most recent first). */
public record AttendanceSummary(
    UUID eventId, long totalRegistered, long totalCheckedIn, List<CheckinResponse> checkins) {}
