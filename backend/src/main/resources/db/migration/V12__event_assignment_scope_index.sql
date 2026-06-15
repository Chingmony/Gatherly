-- ============================================================================
-- Covering index for the admin Users-table scope query (docs/03 §4.2):
--   select a.user_id, count(*), min(e.title)
--   from event_assignment a join event e on e.id = a.event_id
--   where a.user_id in (:ids) group by a.user_id
--
-- The composite (user_id, event_id) lets PostgreSQL satisfy the IN-filter, the
-- GROUP BY, and the join key index-only — no heap fetch until the title join to
-- event (which hits event's PK). It is a strict prefix-superset of the V1
-- single-column idx_event_assignment_user, so that index is now redundant.
-- Forward-only, additive (then a redundant-index drop).
-- ============================================================================

CREATE INDEX idx_event_assignment_user_event ON event_assignment (user_id, event_id);

DROP INDEX IF EXISTS idx_event_assignment_user;
