package com.gatherly.user.domain;

/** Account lifecycle (docs/02 §4). Users are deactivated, never hard-deleted when referenced. */
public enum UserStatus {
    ACTIVE,
    INACTIVE
}
