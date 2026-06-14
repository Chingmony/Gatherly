package com.gatherly.attendance.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Organizer scan body (docs/03 §4.10): the opaque {@code checkin_token} decoded from the guest's QR.
 * Resolved server-side to the submission — the token is a bearer secret, never trusted as identity.
 */
public record ScanRequest(@NotBlank String checkinToken) {
}
