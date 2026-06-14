package com.gatherly.registration.dto;

import java.util.UUID;

/**
 * Registration result (docs/03 §4.9, §5). The {@code checkinToken} + {@code ticketUrl} let the
 * post-registration page show the QR on-screen immediately (email delivery is a later slice).
 */
public record RegisterResponse(
        UUID submissionId,
        String ticketStatus,
        String checkinToken,
        String ticketUrl,
        String message
) {
}
