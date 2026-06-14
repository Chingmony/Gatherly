package com.gatherly.registration.event;

import java.util.UUID;

/**
 * Published when a guest registration commits (docs/06 §6). An {@code AFTER_COMMIT} listener turns
 * this into the QR-ticket email so a slow/failing mail server can never roll back the registration.
 */
public record GuestRegisteredEvent(UUID submissionId) {
}
