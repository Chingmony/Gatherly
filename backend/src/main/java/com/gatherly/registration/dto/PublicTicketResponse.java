package com.gatherly.registration.dto;

import java.time.Instant;

/**
 * Guest ticket portal view (docs/03 §4.9). The {@code checkinToken} is the QR payload; status
 * tracks the lifecycle. Treated as a bearer view — anyone with the token/link can present it.
 */
public record PublicTicketResponse(
        String checkinToken,
        String guestName,
        String eventTitle,
        String venue,
        Instant startsAt,
        String qrStatus
) {
}
