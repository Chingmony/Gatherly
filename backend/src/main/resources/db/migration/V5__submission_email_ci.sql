-- ============================================================================
-- db-query review (P4) follow-ups (docs/02 §7). Forward-only.
--
--  1. Make one-ticket-per-email CASE-INSENSITIVE so the DB guarantee matches the
--     app's IgnoreCase duplicate check (closes a race where "A@x" and "a@x" could
--     both insert). The functional unique index also serves the per-registration
--     existsByEventIdAndGuestEmailIgnoreCase probe (lower(guest_email)).
--  2. Composite (status, starts_at) so the public homepage listing
--     (findByStatusOrderByStartsAtAsc) is index-ordered, not sorted in memory.
-- ============================================================================

DROP INDEX IF EXISTS uq_submission_event_email;
CREATE UNIQUE INDEX uq_submission_event_email
    ON registration_submission (event_id, lower(guest_email));

CREATE INDEX idx_event_status_starts_at ON event (status, starts_at);
