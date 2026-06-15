-- Dev-only seed: mock events + guest tickets + materials for handler testing.
-- Run manually in psql or your DB tool — NOT a Flyway migration.
--
-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │  HANDLER USER: this script looks up a user by email 'handler@gmail.com'. │
-- │  Create that user first (via signup or V2 seed), then run this script.   │
-- │  If you use a different handler email, update the SELECT below.          │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- After running this:
--   Check-in tokens:  MOCK_CHECKIN_TOKEN_001 / 002 / 003
--   Event 1 ID:  a8b7c6d5-e4f3-4a2b-b1c0-d9e8f7060504
--   Event 2 ID:  b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e
--   Scanner URL (event 1):  http://localhost:3000/events/a8b7c6d5-e4f3-4a2b-b1c0-d9e8f7060504/scanner
--
-- To reset and re-seed: run the cleanup block at the bottom first.

DO $$
DECLARE
  v_admin_id   uuid;
  v_handler_id uuid;
  v_event1_id  uuid := 'a8b7c6d5-e4f3-4a2b-b1c0-d9e8f7060504';
  v_event2_id  uuid := 'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e';
  v_form_id    uuid := 'f1e2d3c4-b5a6-4789-8901-234567890abc';
BEGIN
  -- Resolve users by email
  SELECT id INTO v_admin_id   FROM "user" WHERE email = 'admin@gmail.com';
  SELECT id INTO v_handler_id FROM "user" WHERE email = 'handler@gmail.com';

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Admin user not found — run V2__seed_admin.sql first';
  END IF;

  -- ── Event 1: Gatherly Dev Test Event (check-in testing) ───────────────────
  INSERT INTO event (
    id, title, slug, description, venue,
    starts_at, ends_at, status, checkin_opens_at, created_by
  )
  VALUES (
    v_event1_id,
    'Gatherly Dev Test Event',
    'gatherly-dev-test-event',
    'Mock event for check-in scanner testing. Guests have pre-issued QR tokens.',
    'Dev Venue, Room 101',
    now() + interval '1 hour',
    now() + interval '5 hours',
    'PUBLIC',
    now() - interval '10 minutes',
    v_admin_id
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── Event 2: Tech Community Meetup (happening today) ──────────────────────
  INSERT INTO event (
    id, title, slug, description, venue,
    starts_at, ends_at, status, checkin_opens_at, created_by
  )
  VALUES (
    v_event2_id,
    'Tech Community Meetup',
    'tech-community-meetup',
    'Monthly tech meetup for local developers and tech enthusiasts. Talks, networking, and demos.',
    'KSHRD Center, Phnom Penh',
    now(),
    now() + interval '3 hours',
    'PUBLIC',
    now() - interval '30 minutes',
    v_admin_id
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── Assign admin as MANAGER on both events ────────────────────────────────
  INSERT INTO event_assignment (event_id, user_id, event_role, assigned_by)
  VALUES (v_event1_id, v_admin_id, 'MANAGER', v_admin_id)
  ON CONFLICT (event_id, user_id) DO NOTHING;

  INSERT INTO event_assignment (event_id, user_id, event_role, assigned_by)
  VALUES (v_event2_id, v_admin_id, 'MANAGER', v_admin_id)
  ON CONFLICT (event_id, user_id) DO NOTHING;

  -- ── Assign handler as HANDLER on both events (if handler user exists) ─────
  IF v_handler_id IS NOT NULL THEN
    INSERT INTO event_assignment (event_id, user_id, event_role, assigned_by)
    VALUES (v_event1_id, v_handler_id, 'HANDLER', v_admin_id)
    ON CONFLICT (event_id, user_id) DO NOTHING;

    INSERT INTO event_assignment (event_id, user_id, event_role, assigned_by)
    VALUES (v_event2_id, v_handler_id, 'HANDLER', v_admin_id)
    ON CONFLICT (event_id, user_id) DO NOTHING;
  ELSE
    RAISE NOTICE 'Handler user (handler@gmail.com) not found — skipping handler assignment and materials. Create the user and re-run.';
  END IF;

  -- ── Registration form for event 1 (required FK for submissions) ───────────
  INSERT INTO registration_form (id, event_id, title, status, schema, version, created_by)
  VALUES (
    v_form_id,
    v_event1_id,
    'Dev Test Registration Form',
    'ACTIVE',
    '[]'::jsonb,
    1,
    v_admin_id
  )
  ON CONFLICT (id) DO NOTHING;

  -- ── Guest submissions for event 1 (3 tickets with distinct check-in tokens) ─
  INSERT INTO registration_submission (
    id, form_id, event_id, answers,
    guest_name, guest_email, guest_phone,
    checkin_token, qr_status, form_version
  )
  VALUES
    (
      '11223344-5566-7788-99aa-bbccddeeff01',
      v_form_id, v_event1_id,
      '{"name":"Thy Kimhout","email":"kimhout@test.com","phone":"+85512345001"}'::jsonb,
      'Thy Kimhout', 'kimhout@test.com', '+85512345001',
      'MOCK_CHECKIN_TOKEN_001', 'DELIVERED', 1
    ),
    (
      '11223344-5566-7788-99aa-bbccddeeff02',
      v_form_id, v_event1_id,
      '{"name":"Chan Mony","email":"mony@test.com","phone":"+85512345002"}'::jsonb,
      'Chan Mony', 'mony@test.com', '+85512345002',
      'MOCK_CHECKIN_TOKEN_002', 'DELIVERED', 1
    ),
    (
      '11223344-5566-7788-99aa-bbccddeeff03',
      v_form_id, v_event1_id,
      '{"name":"Sok Dara","email":"dara@test.com","phone":"+85512345003"}'::jsonb,
      'Sok Dara', 'dara@test.com', '+85512345003',
      'MOCK_CHECKIN_TOKEN_003', 'DELIVERED', 1
    )
  ON CONFLICT (id) DO NOTHING;

  -- ── Materials for both events, assigned to handler ────────────────────────
  IF v_handler_id IS NOT NULL THEN
    -- Event 1 materials
    INSERT INTO material (id, event_id, name, description, status, assigned_to, created_by)
    VALUES
      (
        'cc000001-0000-0000-0000-000000000001',
        v_event1_id,
        'Registration desk layout',
        'Set up the registration tables, signage, and badge printer at the main entrance.',
        'IN_PROGRESS',
        v_handler_id,
        v_admin_id
      ),
      (
        'cc000001-0000-0000-0000-000000000002',
        v_event1_id,
        'Stage A/V check',
        'Test all microphones, projector, and slide clicker before the event starts.',
        'DONE',
        v_handler_id,
        v_admin_id
      ),
      (
        'cc000001-0000-0000-0000-000000000003',
        v_event1_id,
        'Sponsor banner placement',
        'Mount sponsor banners on the designated walls and confirm placement with manager.',
        'PENDING',
        v_handler_id,
        v_admin_id
      )
    ON CONFLICT (id) DO NOTHING;

    -- Event 2 materials
    INSERT INTO material (id, event_id, name, description, status, assigned_to, created_by)
    VALUES
      (
        'cc000002-0000-0000-0000-000000000001',
        v_event2_id,
        'Badge printer test',
        'Run a test print for 5 sample badges and confirm ink/paper levels are sufficient.',
        'NEEDS_REVIEW',
        v_handler_id,
        v_admin_id
      ),
      (
        'cc000002-0000-0000-0000-000000000002',
        v_event2_id,
        'Catering coordination',
        'Confirm headcount with catering vendor, arrange food table, and label dietary items.',
        'PENDING',
        v_handler_id,
        v_admin_id
      )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RAISE NOTICE 'Seed complete. Event 1: %, Event 2: %', v_event1_id, v_event2_id;
END $$;

-- ── Cleanup (run these first if you want to re-seed from scratch) ────────────
-- DELETE FROM material               WHERE id LIKE 'cc000001-%' OR id LIKE 'cc000002-%';
-- DELETE FROM event_checkin          WHERE event_id IN ('a8b7c6d5-e4f3-4a2b-b1c0-d9e8f7060504','b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e');
-- DELETE FROM registration_submission WHERE event_id = 'a8b7c6d5-e4f3-4a2b-b1c0-d9e8f7060504';
-- DELETE FROM registration_form      WHERE id = 'f1e2d3c4-b5a6-4789-8901-234567890abc';
-- DELETE FROM event_assignment       WHERE event_id IN ('a8b7c6d5-e4f3-4a2b-b1c0-d9e8f7060504','b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e');
-- DELETE FROM event                  WHERE id IN ('a8b7c6d5-e4f3-4a2b-b1c0-d9e8f7060504','b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e');
