-- ============================================================================
-- M6 QR-email retry sweep access path (docs/06 §7, docs/02 §3.10). The sweep query is
--   WHERE qr_status = 'PENDING' AND submitted_at < :cutoff ORDER BY submitted_at ASC
-- which no existing index satisfies — the composite indexes (idx_submission_event_submitted
-- V1, idx_submission_event_qr_status V6) all lead with event_id, but the sweep is org-wide.
--
-- A PARTIAL index over only the PENDING rows is ideal: tickets leave PENDING within minutes
-- of delivery, so the index stays tiny regardless of total registration volume, and it
-- directly serves the predicate + ORDER BY (no sort node) as a single range scan.
-- ============================================================================

CREATE INDEX idx_submission_pending_submitted
    ON registration_submission (submitted_at ASC)
    WHERE qr_status = 'PENDING';
