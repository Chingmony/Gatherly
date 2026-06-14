package com.gatherly.dto.registration;

import com.gatherly.domain.TicketStatus;
import java.util.UUID;

/** Result of a registration/resend: the minted ticket and where to view it. */
public record RegistrationResponse(
    UUID submissionId, TicketStatus ticketStatus, String ticketUrl, String message) {}
