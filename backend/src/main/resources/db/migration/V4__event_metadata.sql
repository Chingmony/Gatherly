-- ============================================================================
-- Event presentation metadata (docs/02 §3.3) for the events grid + public homepage
-- cards and the Create Event form (design handoff). Forward-only, additive.
--
--  • category        — free-text label (Conference, Festival, Workshop, …)
--  • capacity        — max registrations; NULL = unlimited
--  • cover_gradient  — preset key a–f (CSS gradient) used when no cover image is set
--  • cover_image_key — Rustfs object key for an uploaded cover (overrides the gradient)
--
-- No price/payment columns — external payments are out of v1 scope (docs/00).
-- ============================================================================

ALTER TABLE event ADD COLUMN category varchar(60);

ALTER TABLE event ADD COLUMN capacity integer
    CHECK (capacity IS NULL OR capacity >= 0);

ALTER TABLE event ADD COLUMN cover_gradient varchar(10) NOT NULL DEFAULT 'a'
    CHECK (cover_gradient IN ('a', 'b', 'c', 'd', 'e', 'f'));

ALTER TABLE event ADD COLUMN cover_image_key text;
