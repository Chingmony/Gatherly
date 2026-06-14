package com.gatherly.dto.attendance;

import com.gatherly.domain.TicketStatus;
import java.time.Instant;
import java.util.UUID;

/** Guest registration summary for organizer views ({@code GET /events/{eventId}/submissions}). */
public record SubmissionSummary(
    UUID id,
    String guestName,
    String guestEmail,
    String guestPhone,
    TicketStatus qrStatus,
    Instant submittedAt) {}
