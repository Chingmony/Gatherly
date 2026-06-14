package com.gatherly.attendance.event;

import java.util.UUID;

/**
 * Published when an organizer check-in commits (docs/06 §4). An {@code AFTER_COMMIT} listener turns
 * this into the Telegram ops-channel push (docs/04 §2.2) so a slow/failing Telegram can never roll
 * back or block the scan; an un-pushed check-in stays {@code telegram_notified=false} for the sweep.
 */
public record GuestCheckedInEvent(UUID checkinId) {
}
