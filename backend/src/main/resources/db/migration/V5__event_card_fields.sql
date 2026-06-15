-- V5: card-display fields for events (category, capacity, cover image).
-- Expand-only: all nullable so existing rows remain valid.

ALTER TABLE event ADD COLUMN IF NOT EXISTS category  varchar(40);
ALTER TABLE event ADD COLUMN IF NOT EXISTS capacity   integer;
ALTER TABLE event ADD COLUMN IF NOT EXISTS cover_key  text;
