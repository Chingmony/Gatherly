-- ============================================================================
-- Gatherly — baseline seed (docs/02 §8). Idempotent so it is safe across reruns.
-- Seeds the singleton organization row and the built-in default agenda templates.
--
-- NOTE: the bootstrap Admin user is intentionally NOT seeded here — it belongs to
-- M1 (docs/13 §M1), where credentials are injected from env (BOOTSTRAP_ADMIN_*),
-- never hard-coded in a migration (docs/02 §8, docs/12 §4).
-- ============================================================================

-- ─── Singleton organization (fixed id so future updates always target one row) ──
INSERT INTO organization (id, name, description)
VALUES ('00000000-0000-0000-0000-000000000001', 'Gatherly', 'Default organization profile — edit in the Admin console.')
ON CONFLICT (id) DO NOTHING;

-- ─── Built-in default agenda templates (is_default = true) ──────────────────
INSERT INTO agenda_template (name, items, is_default)
SELECT 'Standard Conference',
       '[{"title":"Registration & Welcome","durationMin":30,"order":1},
         {"title":"Opening Keynote","durationMin":45,"order":2},
         {"title":"Break","durationMin":15,"order":3},
         {"title":"Sessions","durationMin":120,"order":4},
         {"title":"Networking Lunch","durationMin":60,"order":5},
         {"title":"Closing Remarks","durationMin":30,"order":6}]'::jsonb,
       true
WHERE NOT EXISTS (SELECT 1 FROM agenda_template WHERE name = 'Standard Conference');

INSERT INTO agenda_template (name, items, is_default)
SELECT 'Workshop',
       '[{"title":"Check-in","durationMin":15,"order":1},
         {"title":"Introduction","durationMin":20,"order":2},
         {"title":"Hands-on Session","durationMin":150,"order":3},
         {"title":"Q&A and Wrap-up","durationMin":25,"order":4}]'::jsonb,
       true
WHERE NOT EXISTS (SELECT 1 FROM agenda_template WHERE name = 'Workshop');
