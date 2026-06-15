package com.gatherly.auth.dto;

/**
 * Login response when an invited account's one-time code was accepted (docs/03 §4.1): no session
 * is issued; the client routes to the set-password screen carrying {@code email} + {@code resetGrant}.
 */
public record SetupRequiredResponse(boolean setupRequired, String email, String resetGrant) {
}
