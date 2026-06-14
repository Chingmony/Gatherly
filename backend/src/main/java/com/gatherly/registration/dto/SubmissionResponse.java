package com.gatherly.registration.dto;

import com.gatherly.registration.domain.TicketStatus;

import java.time.Instant;
import java.util.UUID;

/** Organizer "Manage Guests" row (docs/03 §4.8 — submissions/attendance summaries). */
public record SubmissionResponse(
        UUID id,
        String guestName,
        String guestEmail,
        String guestPhone,
        TicketStatus qrStatus,
        Instant submittedAt
) {
}
