package com.gatherly.registration.domain;

/**
 * Per-guest QR ticket lifecycle (docs/02 §3.10/§5b). M6 (this slice) creates {@code PENDING}
 * tickets and shows the QR on-screen; email delivery ({@code DELIVERED}) and organizer scan
 * ({@code CHECKED_IN}) / {@code REVOKED} arrive with M6-email/M7.
 */
public enum TicketStatus {
    PENDING,
    DELIVERED,
    CHECKED_IN,
    REVOKED
}
