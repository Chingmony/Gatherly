-- M9 hardening (docs/08 §5, docs/10 §audit): an append-only privileged-action audit trail,
-- plus the revoke-actor columns the authz review flagged as the M9 audit-trail gap.

-- ─── audit_log: who-did-what for privileged actions ─────────────────────────
-- Append-only by convention (no UPDATE/DELETE from the app); Admin-queryable (docs/08 §9 decided).
CREATE TABLE audit_log (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id    uuid REFERENCES "user" (id) ON DELETE SET NULL,   -- null = system/background actor
    actor_email varchar(320),                                     -- denormalized for durability after user delete
    action      varchar(64)  NOT NULL,                            -- e.g. USER_DELETED, EVENT_PUBLISHED, TICKET_REVOKED
    target_type varchar(48)  NOT NULL,                            -- e.g. USER, EVENT, SUBMISSION, SUPPLY_ITEM
    target_id   uuid,
    detail      varchar(512),                                     -- short human note (no PII beyond what's necessary)
    trace_id    varchar(64),                                      -- correlates with structured logs (docs/08 §2)
    created_at  timestamptz  NOT NULL DEFAULT now()
);
-- Most common reads: recent-first overall, and by target.
CREATE INDEX idx_audit_log_created     ON audit_log (created_at DESC);
CREATE INDEX idx_audit_log_target      ON audit_log (target_type, target_id);
CREATE INDEX idx_audit_log_actor       ON audit_log (actor_id);

-- ─── revoke-actor trail on the ticket (registration_submission) ─────────────
-- Authz was already gated; this records WHO revoked and WHEN (docs/10 §audit, §08 §5).
ALTER TABLE registration_submission
    ADD COLUMN revoked_by uuid REFERENCES "user" (id) ON DELETE SET NULL,
    ADD COLUMN revoked_at timestamptz;
