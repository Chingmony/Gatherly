package com.gatherly.user.event;

import java.util.UUID;

/**
 * Published when an Admin invites a user (docs/06 §3a). Carries the recipient details so the
 * after-commit listener can mint the activation token and email the set-password link without a
 * further DB read.
 */
public record UserCreatedEvent(UUID userId, String email, String fullName) {
}
