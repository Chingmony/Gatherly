package com.gatherly.event.dto;

import java.util.UUID;

/**
 * Slim projection for the event member picker (docs/03 §4.5). Deliberately minimal — id + display
 * name + email only — so a Sub-admin building their crew never receives other members' PII (phone,
 * address, date of birth). Least-privilege over the full {@code UserResponse}.
 */
public record CandidateResponse(
        UUID id,
        String fullName,
        String email
) {
}
