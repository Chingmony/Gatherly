-- ============================================================================
-- Mock users for testing the three-role model (NOT a Flyway migration).
-- ----------------------------------------------------------------------------
-- Adds exactly two demo accounts — one SUB_ADMIN and one USER — to exercise the
-- ADMIN / SUB_ADMIN / USER flow. Requires the V4 role migration to have run
-- first (the global_role CHECK must allow SUB_ADMIN / USER).
--
-- Password for both accounts is "123" (BCrypt strength 10, same hash as the
-- seeded admin in V2). CHANGE before any non-local use.
--
-- Idempotent: fixed UUIDs + ON CONFLICT DO NOTHING, safe to re-run. Run with:
--   psql "postgresql://postgres:postgres@localhost:5432/gartherly" \
--        -f src/main/resources/db/seed/mock_users.sql
-- ============================================================================

INSERT INTO "user" (id, email, password_hash, full_name, global_role, status) VALUES
  ('dddddddd-dddd-dddd-dddd-dddddddddd01', 'subadmin@gatherly.test',
   '$2b$10$kqh94dKIaidnIGGXyqYCleHD66mPiqvHJ1.LaS8Xs5ZAQvXNLOThO', 'Sub Admin Demo',
   'SUB_ADMIN', 'ACTIVE'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd02', 'user@gatherly.test',
   '$2b$10$kqh94dKIaidnIGGXyqYCleHD66mPiqvHJ1.LaS8Xs5ZAQvXNLOThO', 'User Demo',
   'USER', 'ACTIVE')
ON CONFLICT DO NOTHING;
