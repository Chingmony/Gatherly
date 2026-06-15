-- ── Event UI fields (expand-only) ───────────────────────────────────────────
-- Adds the attributes the frontend "Create Event" form and event/explore cards use:
--   category        – event category label (Conference, Festival, Workshop, …)
--   capacity        – optional max registrations (NULL = unlimited)
--   cover_color     – preset cover colour id / hex used for the gradient
--   cover_image_url – optional uploaded cover image (Rustfs object URL)
-- All nullable & additive — no backfill or destructive change required.
ALTER TABLE event
    ADD COLUMN category        varchar(50),
    ADD COLUMN capacity        integer,
    ADD COLUMN cover_color     varchar(20),
    ADD COLUMN cover_image_url varchar(500);
