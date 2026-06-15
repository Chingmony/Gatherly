-- ============================================================================
-- Event tags (docs/02 §3.3) — short free-text labels shown as chips on the public
-- event detail hero (design GuestEventDetail), e.g. Keynotes, Workshops, Networking.
-- Forward-only, additive. Stored as a Postgres text[] (a flat, ordered label list —
-- not a dynamic form schema, so an array column rather than JSONB).
--
-- No price/payment columns — external payments remain out of v1 scope (docs/00).
-- ============================================================================

ALTER TABLE event ADD COLUMN tags text[] NOT NULL DEFAULT '{}';
