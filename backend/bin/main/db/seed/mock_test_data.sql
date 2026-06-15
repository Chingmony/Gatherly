-- ============================================================================
-- Mock / test data for Gatherly  (NOT a Flyway migration — run manually)
-- ----------------------------------------------------------------------------
-- Populates every domain table EXCEPT "user" — all user-referencing FKs point at
-- the first ADMIN already in the DB — so you have realistic data to exercise the
-- API locally. Requires at least one ADMIN user to exist.
--
-- Excluded by design:
--   * "user"          — per request; this script references the existing admin.
--   * refresh_token   — transient auth/session state, no value as fixtures.
--   * organization    — already seeded as a singleton by V3__seed_organization.sql.
--
-- Idempotent: every INSERT uses fixed UUIDs + ON CONFLICT DO NOTHING, so it is
-- safe to run repeatedly. It is intentionally OUTSIDE classpath:db/migration so
-- Flyway never applies it to a real environment.
--
-- Run against your local/dev DB, e.g.:
--   psql "postgresql://postgres:postgres@localhost:5432/gartherly" \
--        -f src/main/resources/db/seed/mock_test_data.sql
-- (Requires V1–V3 already applied, i.e. start the backend once first.)
-- ============================================================================

-- All user-referencing columns point at the seeded admin.
-- (Captured once for readability via a CTE-free subquery reused below.)

-- ── main_supply_item (global catalog) ───────────────────────────────────────
INSERT INTO main_supply_item (id, name, description, unit, default_quantity, active) VALUES
  ('22222222-2222-2222-2222-222222222201', 'Folding Chairs',  'Stackable event chairs',       'pcs',  100, true),
  ('22222222-2222-2222-2222-222222222202', 'Trestle Tables',  'Foldable 1.8m tables',          'pcs',  20,  true),
  ('22222222-2222-2222-2222-222222222203', 'Projector',       '1080p projector + HDMI',        'unit', 2,   true),
  ('22222222-2222-2222-2222-222222222204', 'Welcome Banner',  'Roll-up vinyl banner',          'pcs',  5,   true),
  ('22222222-2222-2222-2222-222222222205', 'Lanyards',        'Retired stock — kept inactive', 'pcs',  0,   false)
ON CONFLICT DO NOTHING;

-- ── agenda_template (global, JSONB items) ───────────────────────────────────
INSERT INTO agenda_template (id, name, items, is_default) VALUES
  ('33333333-3333-3333-3333-333333333301', 'Standard Conference',
   '[{"title":"Registration","durationMinutes":30},{"title":"Opening Keynote","durationMinutes":60},{"title":"Sessions","durationMinutes":180},{"title":"Networking","durationMinutes":45}]'::jsonb,
   true),
  ('33333333-3333-3333-3333-333333333302', 'Workshop Day',
   '[{"title":"Intro","durationMinutes":20},{"title":"Hands-on Lab","durationMinutes":120},{"title":"Wrap-up","durationMinutes":20}]'::jsonb,
   false)
ON CONFLICT DO NOTHING;

-- ── event (3 events spanning every status) ──────────────────────────────────
INSERT INTO event (id, title, slug, description, venue, starts_at, ends_at, status, registration_qr_token, checkin_opens_at, created_by) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Tech Conference 2026', 'tech-conference-2026',
   'Annual technology conference.', 'Grand Convention Center, Hall A',
   '2026-07-15 09:00:00+07', '2026-07-15 17:00:00+07', 'PUBLIC',
   'seed-regqr-tech-conference-2026-aaaaaaaaaaaaaaaaaaaa', '2026-07-15 08:00:00+07',
   (SELECT id FROM "user" WHERE global_role = 'ADMIN' ORDER BY created_at LIMIT 1)),
  ('11111111-1111-1111-1111-111111111102', 'Internal Workshop', 'internal-workshop',
   'Team upskilling workshop.', 'HQ Training Room 2',
   '2026-08-01 10:00:00+07', '2026-08-01 16:00:00+07', 'DRAFT',
   NULL, NULL,
   (SELECT id FROM "user" WHERE global_role = 'ADMIN' ORDER BY created_at LIMIT 1)),
  ('11111111-1111-1111-1111-111111111103', 'Annual Gala 2025', 'annual-gala-2025',
   'Past gala dinner.', 'Riverside Ballroom',
   '2025-12-10 18:00:00+07', '2025-12-10 22:00:00+07', 'ARCHIVED',
   NULL, '2025-12-10 17:00:00+07',
   (SELECT id FROM "user" WHERE global_role = 'ADMIN' ORDER BY created_at LIMIT 1))
ON CONFLICT DO NOTHING;

-- ── event_assignment (admin is the only seeded user → MANAGER on two events) ─
INSERT INTO event_assignment (id, event_id, user_id, event_role, assigned_by) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01', '11111111-1111-1111-1111-111111111101',
   (SELECT id FROM "user" WHERE global_role = 'ADMIN' ORDER BY created_at LIMIT 1), 'MANAGER',
   (SELECT id FROM "user" WHERE global_role = 'ADMIN' ORDER BY created_at LIMIT 1)),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa02', '11111111-1111-1111-1111-111111111102',
   (SELECT id FROM "user" WHERE global_role = 'ADMIN' ORDER BY created_at LIMIT 1), 'MANAGER',
   (SELECT id FROM "user" WHERE global_role = 'ADMIN' ORDER BY created_at LIMIT 1))
ON CONFLICT DO NOTHING;

-- ── agenda_item (timeline for the Tech Conference) ──────────────────────────
INSERT INTO agenda_item (id, event_id, title, starts_at, ends_at, position) VALUES
  ('44444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111101', 'Doors Open & Registration', '2026-07-15 08:00:00+07', '2026-07-15 09:00:00+07', 1),
  ('44444444-4444-4444-4444-444444444402', '11111111-1111-1111-1111-111111111101', 'Opening Keynote',           '2026-07-15 09:00:00+07', '2026-07-15 10:00:00+07', 2),
  ('44444444-4444-4444-4444-444444444403', '11111111-1111-1111-1111-111111111101', 'Closing Remarks',           '2026-07-15 16:00:00+07', '2026-07-15 17:00:00+07', 3)
ON CONFLICT DO NOTHING;

-- ── material (event items/tasks, every status, some linked to catalog) ──────
INSERT INTO material (id, event_id, catalog_item_id, name, description, quantity, status, assigned_to, created_by) VALUES
  ('55555555-5555-5555-5555-555555555501', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201', 'Seating — Main Hall',     'Chairs for the keynote hall',    200, 'IN_PROGRESS',  (SELECT id FROM "user" WHERE global_role = 'ADMIN' ORDER BY created_at LIMIT 1), (SELECT id FROM "user" WHERE global_role = 'ADMIN' ORDER BY created_at LIMIT 1)),
  ('55555555-5555-5555-5555-555555555502', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222203', 'AV — Projector Setup',    'Projector + cabling for stage',  2,   'PENDING',      (SELECT id FROM "user" WHERE global_role = 'ADMIN' ORDER BY created_at LIMIT 1), (SELECT id FROM "user" WHERE global_role = 'ADMIN' ORDER BY created_at LIMIT 1)),
  ('55555555-5555-5555-5555-555555555503', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222204', 'Welcome Banner',          'Entrance branding',              3,   'DONE',         (SELECT id FROM "user" WHERE global_role = 'ADMIN' ORDER BY created_at LIMIT 1), (SELECT id FROM "user" WHERE global_role = 'ADMIN' ORDER BY created_at LIMIT 1)),
  ('55555555-5555-5555-5555-555555555504', '11111111-1111-1111-1111-111111111101', NULL,                                    'Catering Coordination',   'Confirm headcount with vendor',  NULL,'NEEDS_REVIEW', (SELECT id FROM "user" WHERE global_role = 'ADMIN' ORDER BY created_at LIMIT 1), (SELECT id FROM "user" WHERE global_role = 'ADMIN' ORDER BY created_at LIMIT 1)),
  ('55555555-5555-5555-5555-555555555505', '11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222202', 'Workshop Tables',         'Lab tables layout',              10,  'PENDING',      (SELECT id FROM "user" WHERE global_role = 'ADMIN' ORDER BY created_at LIMIT 1), (SELECT id FROM "user" WHERE global_role = 'ADMIN' ORDER BY created_at LIMIT 1))
ON CONFLICT DO NOTHING;

-- ── material_status_history (audit trail for two materials) ─────────────────
INSERT INTO material_status_history (id, material_id, from_status, to_status, changed_by, note) VALUES
  ('66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555501', NULL,         'PENDING',     (SELECT id FROM "user" WHERE global_role = 'ADMIN' ORDER BY created_at LIMIT 1), 'Created'),
  ('66666666-6666-6666-6666-666666666602', '55555555-5555-5555-5555-555555555501', 'PENDING',    'IN_PROGRESS', (SELECT id FROM "user" WHERE global_role = 'ADMIN' ORDER BY created_at LIMIT 1), 'Procurement started'),
  ('66666666-6666-6666-6666-666666666603', '55555555-5555-5555-5555-555555555503', NULL,         'PENDING',     (SELECT id FROM "user" WHERE global_role = 'ADMIN' ORDER BY created_at LIMIT 1), 'Created'),
  ('66666666-6666-6666-6666-666666666604', '55555555-5555-5555-5555-555555555503', 'IN_PROGRESS','DONE',        (SELECT id FROM "user" WHERE global_role = 'ADMIN' ORDER BY created_at LIMIT 1), 'Installed at entrance')
ON CONFLICT DO NOTHING;

-- ── registration_form (1:1 with event; ACTIVE for E1, DRAFT for E2) ─────────
INSERT INTO registration_form (id, event_id, title, status, schema, version, created_by) VALUES
  ('77777777-7777-7777-7777-777777777701', '11111111-1111-1111-1111-111111111101',
   'Tech Conference 2026 Registration', 'ACTIVE',
   '[
      {"key":"full_name","label":"Full Name","type":"text","required":true,"order":1},
      {"key":"email","label":"Email","type":"email","required":true,"order":2},
      {"key":"phone","label":"Phone","type":"phone","required":true,"order":3},
      {"key":"company","label":"Company","type":"text","required":false,"order":4},
      {"key":"tshirt_size","label":"T-Shirt Size","type":"select","required":false,"order":5,"options":["S","M","L","XL"]},
      {"key":"dietary","label":"Dietary Needs","type":"multiselect","required":false,"order":6,"options":["Vegetarian","Vegan","Halal","Gluten-Free"]}
    ]'::jsonb,
   1, (SELECT id FROM "user" WHERE global_role = 'ADMIN' ORDER BY created_at LIMIT 1)),
  ('77777777-7777-7777-7777-777777777702', '11111111-1111-1111-1111-111111111102',
   'Internal Workshop Signup', 'DRAFT',
   '[
      {"key":"full_name","label":"Full Name","type":"text","required":true,"order":1},
      {"key":"email","label":"Email","type":"email","required":true,"order":2},
      {"key":"phone","label":"Phone","type":"phone","required":true,"order":3}
    ]'::jsonb,
   1, (SELECT id FROM "user" WHERE global_role = 'ADMIN' ORDER BY created_at LIMIT 1))
ON CONFLICT DO NOTHING;

-- ── registration_submission (guests for the Tech Conference form) ───────────
INSERT INTO registration_submission (id, form_id, event_id, answers, guest_name, guest_email, guest_phone, checkin_token, qr_status, qr_delivered_at, form_version) VALUES
  ('88888888-8888-8888-8888-888888888801', '77777777-7777-7777-7777-777777777701', '11111111-1111-1111-1111-111111111101',
   '{"full_name":"Alice Tan","email":"alice@example.com","phone":"+60123456001","company":"Acme","tshirt_size":"M","dietary":["Vegetarian"]}'::jsonb,
   'Alice Tan', 'alice@example.com', '+60123456001', 'seed-checkin-token-sub1-aaaaaaaaaaaaaaaaaaaa', 'DELIVERED', '2026-06-14 10:00:00+07', 1),
  ('88888888-8888-8888-8888-888888888802', '77777777-7777-7777-7777-777777777701', '11111111-1111-1111-1111-111111111101',
   '{"full_name":"Bob Lee","email":"bob@example.com","phone":"+60123456002","company":"Globex","tshirt_size":"L"}'::jsonb,
   'Bob Lee', 'bob@example.com', '+60123456002', 'seed-checkin-token-sub2-bbbbbbbbbbbbbbbbbbbb', 'CHECKED_IN', '2026-06-14 10:05:00+07', 1),
  ('88888888-8888-8888-8888-888888888803', '77777777-7777-7777-7777-777777777701', '11111111-1111-1111-1111-111111111101',
   '{"full_name":"Carol Ng","email":"carol@example.com","phone":"+60123456003"}'::jsonb,
   'Carol Ng', 'carol@example.com', '+60123456003', 'seed-checkin-token-sub3-cccccccccccccccccccc', 'PENDING', NULL, 1),
  ('88888888-8888-8888-8888-888888888804', '77777777-7777-7777-7777-777777777701', '11111111-1111-1111-1111-111111111101',
   '{"full_name":"David Wong","email":"david@example.com","phone":"+60123456004","dietary":["Halal","Gluten-Free"]}'::jsonb,
   'David Wong', 'david@example.com', '+60123456004', 'seed-checkin-token-sub4-dddddddddddddddddddd', 'CHECKED_IN', '2026-06-14 10:10:00+07', 1)
ON CONFLICT DO NOTHING;

-- ── event_checkin (for the two CHECKED_IN submissions; idempotent per sub) ───
INSERT INTO event_checkin (id, event_id, submission_id, guest_phone, guest_name, scanned_by, source, telegram_notified, checked_in_at) VALUES
  ('99999999-9999-9999-9999-999999999901', '11111111-1111-1111-1111-111111111101', '88888888-8888-8888-8888-888888888802',
   '+60123456002', 'Bob Lee',   (SELECT id FROM "user" WHERE global_role = 'ADMIN' ORDER BY created_at LIMIT 1), 'QR_SCAN', true,  '2026-07-15 08:30:00+07'),
  ('99999999-9999-9999-9999-999999999902', '11111111-1111-1111-1111-111111111101', '88888888-8888-8888-8888-888888888804',
   '+60123456004', 'David Wong',(SELECT id FROM "user" WHERE global_role = 'ADMIN' ORDER BY created_at LIMIT 1), 'MANUAL',  false, '2026-07-15 08:45:00+07')
ON CONFLICT DO NOTHING;
