-- ============================================================================
-- M8 Telegram ops-channel forwarding support (docs/04 §2.2, docs/06 §7).
--
-- Two changes:
--
-- 1. registration_submission.telegram_notified  (boolean, NOT NULL DEFAULT false)
--    Mirrors the identically-named column already on event_checkin (V1).  The
--    TelegramNotifier flips it to true after a successful sendMessage call; the
--    Telegram ops retry sweep (docs/06 §7) selects WHERE telegram_notified = false
--    to re-push any rows that failed on the first attempt.
--
-- 2. Partial indexes for the ops retry sweeps (docs/06 §7).
--    Only un-notified rows are scanned, so both indexes stay tiny — notifications
--    go out within seconds of commit; the index never accumulates historical rows.
--    Named consistently with the partial-index pattern introduced in V8.
--      idx_submission_ops_sweep   — registration_submission, ordered by submitted_at ASC
--      idx_event_checkin_ops_sweep — event_checkin, ordered by checked_in_at ASC
-- ============================================================================

ALTER TABLE registration_submission
    ADD COLUMN telegram_notified boolean NOT NULL DEFAULT false;

CREATE INDEX idx_submission_ops_sweep
    ON registration_submission (submitted_at ASC)
    WHERE telegram_notified = false;

CREATE INDEX idx_event_checkin_ops_sweep
    ON event_checkin (checked_in_at ASC)
    WHERE telegram_notified = false;
