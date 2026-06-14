package com.gatherly.attendance.dto;

import com.gatherly.attendance.domain.CheckinSource;

import java.time.Instant;
import java.util.UUID;

/**
 * Result of a successful organizer check-in (docs/03 §4.10, §5). {@code ticketStatus} is always
 * {@code CHECKED_IN} on success. {@code telegramQueued} reports that the ops-channel push is queued
 * (the row carries {@code telegram_notified=false} for the M8 forwarding sweep — docs/06 §7).
 */
public record CheckinResult(
        UUID checkinId,
        UUID submissionId,
        String guestName,
        String guestPhone,
        Instant checkedInAt,
        String ticketStatus,
        UUID scannedBy,
        CheckinSource source,
        boolean telegramQueued
) {
}
