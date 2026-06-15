-- ── Material grid fields (expand-only) ───────────────────────────────────────
-- Adds the columns the Grid (spreadsheet) and List views surface alongside the
-- existing workflow state:
--   category  – free-text delegation category (Production, Catering, Logistics, …)
--   priority  – HIGH | MEDIUM | LOW (defaults MEDIUM)
--   due_at    – optional deadline (date + time)
-- All additive; existing rows default priority = MEDIUM, category/due_at NULL.
ALTER TABLE material
    ADD COLUMN category varchar(50),
    ADD COLUMN priority varchar(8) NOT NULL DEFAULT 'MEDIUM'
               CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
    ADD COLUMN due_at   timestamptz;
