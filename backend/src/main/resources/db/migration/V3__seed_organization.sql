-- V3: seed the singleton organization profile (docs/02 §8 seed plan).
-- One row only; Admin edits it via PUT /organization. Idempotent on re-run.
INSERT INTO organization (id, name, description, created_at, updated_at)
SELECT gen_random_uuid(), 'Gatherly', 'Single-organization event management.', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM organization);
