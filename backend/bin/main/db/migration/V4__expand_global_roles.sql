-- V4: expand the global role model from [ADMIN, MEMBER] to [ADMIN, SUB_ADMIN, USER].
-- Forward-only / expand-contract: drop the old CHECK, migrate existing data, add the widened CHECK.
-- Written to be idempotent (safe to re-run) so manual application stays consistent with Flyway.
-- Source of truth: docs/02-database-schema.md §4 (enums).

-- 1. Drop the existing global_role CHECK (old ADMIN/MEMBER, or a prior run of this migration).
--    V1 defined it inline, so its name is auto-generated; discover and drop it by definition.
DO $$
DECLARE
    cname text;
BEGIN
    SELECT conname INTO cname
    FROM pg_constraint
    WHERE conrelid = '"user"'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%global_role%';
    IF cname IS NOT NULL THEN
        EXECUTE format('ALTER TABLE "user" DROP CONSTRAINT %I', cname);
    END IF;
END $$;

-- 2. Migrate existing rows: the old MEMBER role becomes USER.
UPDATE "user" SET global_role = 'USER' WHERE global_role = 'MEMBER';

-- 3. Add the widened constraint covering the three-role model (guarded for safe re-runs).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = '"user"'::regclass AND conname = 'user_global_role_check'
    ) THEN
        ALTER TABLE "user"
            ADD CONSTRAINT user_global_role_check
            CHECK (global_role IN ('ADMIN', 'SUB_ADMIN', 'USER'));
    END IF;
END $$;
