-- ─── Supply Catalog inventory fields (docs/02 §3.5, docs/03 §4.6) ───────────
-- Extends the global, Admin-owned main_supply_item catalog with the inventory
-- attributes shown in the Supply Catalog UI: a human SKU, a category, the
-- on-hand stock count, and a per-item reorder threshold. Stock status
-- (In stock / Low stock / Out of stock) is DERIVED from on_hand + threshold in
-- the service layer — it is never persisted, so it can never drift.

ALTER TABLE main_supply_item
    ADD COLUMN sku                 varchar(40),
    ADD COLUMN category            varchar(20),
    ADD COLUMN on_hand             integer NOT NULL DEFAULT 0,
    ADD COLUMN low_stock_threshold integer;

ALTER TABLE main_supply_item
    ADD CONSTRAINT chk_main_supply_category
        CHECK (category IS NULL OR category IN
            ('FURNITURE','PRINT','AV','STAGING','CATERING','COMMS','OTHER')),
    ADD CONSTRAINT chk_main_supply_on_hand CHECK (on_hand >= 0),
    ADD CONSTRAINT chk_main_supply_threshold CHECK (low_stock_threshold IS NULL OR low_stock_threshold >= 0);

-- SKUs are optional but unique when present (case-insensitive); the partial
-- index also accelerates the catalog's SKU search box.
CREATE UNIQUE INDEX ux_main_supply_item_sku
    ON main_supply_item (lower(sku)) WHERE sku IS NOT NULL;

-- The catalog list reads ORDER BY name ASC (docs/03 §4.6); serve the sort from an
-- index rather than a full scan + in-memory sort as the catalog grows.
CREATE INDEX idx_main_supply_item_name ON main_supply_item (name);
