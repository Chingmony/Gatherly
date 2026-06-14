-- ============================================================================
-- Admin Command Center dashboard (docs/03 §4.13, docs/06 §11) — supporting
-- indexes for the new aggregate query predicates. Forward-only, additive.
--
--  1. (event_id, qr_status) — serves both the org-wide checked-in total
--     (countByQrStatus) and the grouped per-event check-in counts
--     (countByEventIdsAndQrStatus); leading event_id also covers the IN-list.
--  2. (event_id, event_role) — managers-per-event lookup
--     (findByEventIdInAndEventRole) without rechecking event_role per heap row.
--     The single-column idx_event_assignment_event (V1) is retained for
--     findByEventId (no role predicate).
--  3. (starts_at DESC NULLS LAST) — the bounded, most-recent-first control feed
--     (findAllByOrderByStartsAtDesc, LIMIT 200) becomes an index-range scan
--     instead of a full sort. The V5 (status, starts_at) index leads with
--     status and cannot satisfy a bare ORDER BY starts_at DESC.
-- ============================================================================

CREATE INDEX idx_submission_event_qr_status
    ON registration_submission (event_id, qr_status);

CREATE INDEX idx_event_assignment_event_role
    ON event_assignment (event_id, event_role);

CREATE INDEX idx_event_starts_at_desc
    ON event (starts_at DESC NULLS LAST);
