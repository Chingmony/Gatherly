package com.gatherly.dto.registration;

import com.gatherly.domain.TicketStatus;
import java.time.Instant;

/**
 * Guest-facing ticket view ({@code GET /public/tickets/{checkinToken}}). {@code qrImageDataUrl} is
 * a base64 {@code data:} URL for the on-screen QR fallback.
 */
public record TicketResponse(
    String checkinToken,
    TicketStatus ticketStatus,
    String guestName,
    String eventTitle,
    String venue,
    Instant startsAt,
    String qrImageDataUrl) {}
