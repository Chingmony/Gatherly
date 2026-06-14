-- ============================================================================
-- Gatherly — core schema (docs/02). Forward-only. Enums are varchar + CHECK
-- (docs/02 §1); PKs are uuid via pgcrypto; all timestamps are timestamptz (UTC).
-- Table/column order follows docs/02 §8.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─── 3.1 organization (single-row global profile) ───────────────────────────
CREATE TABLE organization (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name          varchar(200) NOT NULL,
    description   text,
    logo_key      text,
    banner_key    text,
    contact_email varchar(255),
    contact_phone varchar(25),
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── 3.2 user (quoted — reserved word) ──────────────────────────────────────
CREATE TABLE "user" (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email         varchar(255) NOT NULL UNIQUE,
    password_hash varchar(100) NOT NULL,
    full_name     varchar(200) NOT NULL,
    phone         varchar(30),
    gender        varchar(10) CHECK (gender IN ('MALE','FEMALE','OTHER')),
    date_of_birth date,
    address       varchar(500),
    avatar_key    text,
    global_role   varchar(16) NOT NULL CHECK (global_role IN ('ADMIN','MEMBER')),
    status        varchar(16) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE')),
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_user_global_role ON "user" (global_role);

-- ─── 3.3 event ──────────────────────────────────────────────────────────────
CREATE TABLE event (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title                  varchar(200) NOT NULL,
    slug                   varchar(220) UNIQUE,
    description            text,
    venue                  varchar(300),
    starts_at              timestamptz,
    ends_at                timestamptz,
    status                 varchar(16) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PUBLIC','ARCHIVED')),
    registration_qr_token  varchar(64) UNIQUE,
    checkin_opens_at       timestamptz,
    created_by             uuid REFERENCES "user" (id),
    created_at             timestamptz NOT NULL DEFAULT now(),
    updated_at             timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_event_status ON event (status);

-- ─── 3.4 event_assignment (event-scoped role / delegation) ──────────────────
CREATE TABLE event_assignment (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id    uuid NOT NULL REFERENCES event (id) ON DELETE CASCADE,
    user_id     uuid NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
    event_role  varchar(16) NOT NULL CHECK (event_role IN ('MANAGER','HANDLER')),
    assigned_by uuid REFERENCES "user" (id),
    created_at  timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT uq_event_assignment UNIQUE (event_id, user_id)
);
CREATE INDEX idx_event_assignment_user ON event_assignment (user_id);
CREATE INDEX idx_event_assignment_event ON event_assignment (event_id);

-- ─── 3.5 main_supply_item (global catalog, Admin-owned) ─────────────────────
CREATE TABLE main_supply_item (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name             varchar(200) NOT NULL,
    description      text,
    unit             varchar(50),
    default_quantity integer,
    active           boolean NOT NULL DEFAULT true,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ─── 3.6 material (event item/task with workflow state) ─────────────────────
CREATE TABLE material (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id        uuid NOT NULL REFERENCES event (id) ON DELETE CASCADE,
    catalog_item_id uuid REFERENCES main_supply_item (id) ON DELETE RESTRICT,
    name            varchar(200) NOT NULL,
    description     text,
    quantity        integer,
    status          varchar(16) NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN ('PENDING','IN_PROGRESS','NEEDS_REVIEW','DONE','ISSUE')),
    assigned_to     uuid REFERENCES "user" (id) ON DELETE SET NULL,
    created_by      uuid REFERENCES "user" (id),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_material_event ON material (event_id);
CREATE INDEX idx_material_assigned_to ON material (assigned_to);
CREATE INDEX idx_material_status ON material (status);

-- ─── 3.7 material_status_history (audit trail) ──────────────────────────────
CREATE TABLE material_status_history (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id uuid NOT NULL REFERENCES material (id) ON DELETE CASCADE,
    from_status varchar(16),
    to_status   varchar(16) NOT NULL,
    changed_by  uuid REFERENCES "user" (id),
    note        text,
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_material_history_material ON material_status_history (material_id, created_at);

-- ─── 3.8 agenda_template (global) + agenda_item (per-event) ─────────────────
CREATE TABLE agenda_template (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       varchar(200) NOT NULL,
    items      jsonb NOT NULL DEFAULT '[]',
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE agenda_item (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id   uuid NOT NULL REFERENCES event (id) ON DELETE CASCADE,
    title      varchar(200) NOT NULL,
    starts_at  timestamptz,
    ends_at    timestamptz,
    position   integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_agenda_item_event_position ON agenda_item (event_id, position);

-- ─── 3.9 registration_form (dynamic JSONB form, 1:1 with event) ─────────────
CREATE TABLE registration_form (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id   uuid NOT NULL UNIQUE REFERENCES event (id) ON DELETE CASCADE,
    title      varchar(200) NOT NULL,
    status     varchar(16) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ACTIVE','INACTIVE')),
    schema     jsonb NOT NULL DEFAULT '[]',
    version    integer NOT NULL DEFAULT 1,
    created_by uuid REFERENCES "user" (id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_registration_form_schema ON registration_form USING gin (schema);

-- ─── 3.10 registration_submission (guest response + personal QR ticket) ─────
CREATE TABLE registration_submission (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id       uuid NOT NULL REFERENCES registration_form (id) ON DELETE CASCADE,
    event_id      uuid NOT NULL REFERENCES event (id) ON DELETE CASCADE,
    answers       jsonb NOT NULL,
    guest_name    varchar(200),
    guest_email   varchar(255) NOT NULL,
    guest_phone   varchar(30) NOT NULL,
    checkin_token varchar(64) NOT NULL UNIQUE,
    qr_status     varchar(16) NOT NULL DEFAULT 'PENDING'
                      CHECK (qr_status IN ('PENDING','DELIVERED','CHECKED_IN','REVOKED')),
    qr_delivered_at timestamptz,
    form_version  integer NOT NULL,
    submitted_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_submission_event_submitted ON registration_submission (event_id, submitted_at);
CREATE INDEX idx_submission_guest_email ON registration_submission (guest_email);
CREATE INDEX idx_submission_guest_phone ON registration_submission (guest_phone);
CREATE INDEX idx_submission_answers ON registration_submission USING gin (answers);
-- One registration per email per event (docs/02 §9 default).
CREATE UNIQUE INDEX uq_submission_event_email ON registration_submission (event_id, guest_email);

-- ─── 3.11 event_checkin (organizer-confirmed attendance) ────────────────────
CREATE TABLE event_checkin (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id          uuid NOT NULL REFERENCES event (id) ON DELETE CASCADE,
    submission_id     uuid NOT NULL REFERENCES registration_submission (id) ON DELETE CASCADE,
    guest_phone       varchar(30) NOT NULL,
    guest_name        varchar(200),
    scanned_by        uuid NOT NULL REFERENCES "user" (id),
    source            varchar(16) NOT NULL DEFAULT 'QR_SCAN' CHECK (source IN ('QR_SCAN','MANUAL')),
    telegram_notified boolean NOT NULL DEFAULT false,
    checked_in_at     timestamptz NOT NULL DEFAULT now(),
    created_at        timestamptz NOT NULL DEFAULT now(),
    -- One attendance row per ticket — idempotent / replay-safe (docs/02 §3.11, §06 §4).
    CONSTRAINT uq_event_checkin_submission UNIQUE (submission_id)
);
CREATE INDEX idx_event_checkin_event_time ON event_checkin (event_id, checked_in_at);

-- ─── 3.12 refresh_token (JWT refresh rotation/revocation) ───────────────────
CREATE TABLE refresh_token (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
    token_hash  varchar(100) NOT NULL UNIQUE,
    expires_at  timestamptz NOT NULL,
    revoked     boolean NOT NULL DEFAULT false,
    replaced_by uuid,
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_token_user ON refresh_token (user_id);
