-- ============================================================================
-- M1 revision: admin-invite + email activation (docs/02 §5c).
-- Invited users have no password until they activate via the emailed set-password
-- link, so password_hash becomes nullable and a PENDING_ACTIVATION status is added.
-- default_event_role records the Sub-admin(MANAGER)/Handler designation chosen at invite.
-- ============================================================================

-- Password is unset until activation.
ALTER TABLE "user" ALTER COLUMN password_hash DROP NOT NULL;

-- Designation chosen in the Add-User form; pre-fills the per-event grant in M3.
ALTER TABLE "user" ADD COLUMN default_event_role varchar(16)
    CHECK (default_event_role IN ('MANAGER', 'HANDLER'));

-- Extend the status enum with PENDING_ACTIVATION (18 chars > varchar(16) → widen first),
-- then rewrite the inline CHECK.
ALTER TABLE "user" ALTER COLUMN status TYPE varchar(24);
ALTER TABLE "user" DROP CONSTRAINT IF EXISTS user_status_check;
ALTER TABLE "user" ADD CONSTRAINT user_status_check
    CHECK (status IN ('ACTIVE', 'INACTIVE', 'PENDING_ACTIVATION'));
