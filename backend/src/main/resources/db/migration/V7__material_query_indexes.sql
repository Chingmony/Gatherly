-- ============================================================================
-- M4 material access-path indexes (docs/02 §3.6, docs/06 §8). Back the three query
-- patterns the materials slice introduces:
--   • event material list      → ORDER BY created_at on a given event_id
--   • Handler "My Tasks"        → ORDER BY created_at on a given assigned_to
--   • supply-item delete guard  → existence probe on catalog_item_id (was unindexed
--                                 → sequential scan on every delete attempt)
-- The two composite indexes subsume the single-column event_id / assigned_to indexes
-- from V1 (leading column), which are dropped to avoid redundant write overhead.
-- idx_material_status (V1) is retained — used by the dashboard aggregation.
-- ============================================================================

DROP INDEX IF EXISTS idx_material_event;
DROP INDEX IF EXISTS idx_material_assigned_to;

CREATE INDEX idx_material_event_created ON material (event_id, created_at DESC);
CREATE INDEX idx_material_assigned_to_created ON material (assigned_to, created_at DESC);
CREATE INDEX idx_material_catalog_item ON material (catalog_item_id);
