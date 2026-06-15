package com.gatherly.auth;

import com.gatherly.user.domain.User;

/**
 * Result of a login attempt (docs/03 §4.1). Either a real session was established (cookies set,
 * {@code user} present) or the account is an invited one whose one-time code matched — in which
 * case no session is issued and a single-use {@code resetGrant} is handed back so the client can
 * route the user to set a password.
 */
public record LoginOutcome(User user, String setupEmail, String resetGrant) {

    /** Successful authentication of an ACTIVE account; cookies have been written. */
    static LoginOutcome session(User user) {
        return new LoginOutcome(user, null, null);
    }

    /** Invite code accepted for a PENDING_ACTIVATION account; the user must now set a password. */
    static LoginOutcome setupRequired(String email, String resetGrant) {
        return new LoginOutcome(null, email, resetGrant);
    }

    public boolean setupRequired() {
        return user == null;
    }
}
