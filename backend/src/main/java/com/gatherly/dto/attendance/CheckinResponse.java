package com.gatherly.dto.attendance;

import com.gatherly.domain.CheckinSource;
import java.time.Instant;
import java.util.UUID;

/** A confirmed attendance record. */
public record CheckinResponse(
    UUID checkinId,
    UUID submissionId,
    String guestName,
    String guestPhone,
    UUID scannedBy,
    CheckinSource source,
    Instant checkedInAt) {}
