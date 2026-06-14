package com.gatherly.domain;

/**
 * Per-guest QR ticket lifecycle ({@code docs/02} §5b). {@code PENDING} (token minted) → {@code
 * DELIVERED} (QR emailed) → {@code CHECKED_IN} (organizer scan, terminal); {@code REVOKED} from any
 * non-terminal state by an Admin/Manager.
 */
public enum TicketStatus {
  PENDING,
  DELIVERED,
  CHECKED_IN,
  REVOKED
}
