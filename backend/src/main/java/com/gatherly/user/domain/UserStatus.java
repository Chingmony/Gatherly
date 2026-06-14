package com.gatherly.user.domain;

/**
 * Account lifecycle (docs/02 §4, §5c). Invited users start {@code PENDING_ACTIVATION} (no
 * password) until they activate via the emailed set-password link. Users are deactivated, never
 * hard-deleted when referenced.
 */
public enum UserStatus {
    ACTIVE,
    INACTIVE,
    PENDING_ACTIVATION
}
