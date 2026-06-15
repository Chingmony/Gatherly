# 02 — Database Schema

> **Status:** Draft · **Depends on:** [`00`](00-system-overview.md), [`01`](01-architecture-layout.md)
> PostgreSQL schema: relational integrity for roles/events/materials + **JSONB** for dynamic registration forms. Referenced by [`03`](03-api-routes-security.md) (endpoints) and [`04`](04-external-integrations.md) (Telegram/OTP/Rustfs fields).

---

## 1. Conventions

- **PK:** `uuid` (`gen_random_uuid()` via `pgcrypto`). Non-enumerable, merge-safe.
- **Timestamps:** `created_at`, `updated_at` (`timestamptz`, UTC) on every table via a shared base; JPA auditing populates them.
- **Enums:** stored as `varchar` + `CHECK (... IN ...)`, mapped with `@Enumerated(EnumType.STRING)`. Portable, diff-friendly.
- **Deletes:** users **deactivated** (`status=INACTIVE`) not physically removed when referenced; events support `ARCHIVED` + hard delete (Admin only).
- **Naming:** snake_case, singular tables.
- **Migrations:** Flyway, `V<n>__<desc>.sql`, forward-only in shared environments.

## 2. ERD overview

```
organization (1 row)

user ──< event_assignment >── event ──< material >── material_status_history
  │           (MANAGER|HANDLER)  │         │
  │                              │         └──(assigned_to) user
  │                              ├──< agenda_item        agenda_template (global)
  │                              ├──1 registration_form ──< registration_submission
  │                              │        (1:1, JSONB schema)   (JSONB answers + checkin_token = per-guest QR)
  │                              └──< event_checkin ──(submission, 1:1) ──(scanned_by) user
  │
  ├──< refresh_token
main_supply_item (global catalog) ──< material.catalog_item_id (RESTRICT)
```

Legend: `──<` one-to-many; `>──` many-to-one; `──1` one-to-one. `event_assignment` is the user×event join that carries the **event-scoped role**. `registration_form` is 1:1 with `event` — one event owns at most one form (`UNIQUE(event_id)`).

## 3. Tables

### 3.1 `organization` — single-row global profile
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | singleton (fixed id / partial-unique guard) |
| name | varchar(200) NOT NULL | company name |
| description | text | short company/org bio |
| logo_key | text | Rustfs object key |
| banner_key | text | Rustfs background banner key |
| contact_email | varchar(255) | |
| contact_phone | varchar(25) | |
| created_at / updated_at | timestamptz | |

> Editable by Admin only. `logo_key`/`banner_key` reference Rustfs objects (see [`04`](04-external-integrations.md)).

### 3.2 `user`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| email | varchar(255) NOT NULL UNIQUE | login id |
| password_hash | varchar(100) NULL | BCrypt; never serialized. **NULL until an invited user sets it** via the activation flow (§5c) |
| full_name | varchar(200) NOT NULL | |
| phone | varchar(30) | |
| gender | varchar(10) `CHECK IN ('MALE','FEMALE','OTHER')` NULL | optional |
| date_of_birth | date NULL | optional |
| address | varchar(500) NULL | optional free-text address |
| avatar_key | text | Rustfs object key |
| global_role | varchar(16) NOT NULL `CHECK IN ('ADMIN','MEMBER')` | coarse RBAC layer |
| default_event_role | varchar(16) NULL `CHECK IN ('MANAGER','HANDLER')` | optional designation chosen in the Add-User form (**Sub-admin = MANAGER**, Handler = HANDLER). Pre-fills the per-event grant when this member is assigned to an event (§5c, [`03`](03-api-routes-security.md)). Does **not** confer global privilege. |
| status | varchar(24) NOT NULL `CHECK IN ('ACTIVE','INACTIVE','PENDING_ACTIVATION')` default ACTIVE | invited users start `PENDING_ACTIVATION` until they set a password (§5c) |
| created_at / updated_at | timestamptz | |

Indexes: `UNIQUE(email)`, `INDEX(global_role)`.

> `ADMIN` = Super Admin. `MEMBER` is default; a member becomes **Sub-admin or Handler only through `event_assignment`** — there is no global SUB_ADMIN/HANDLER value, because those roles are inherently event-scoped.
>
> **Add-User invite (Admin-only):** the Add-User form creates **MEMBER** accounts only — it can never mint a new global Admin (elevation to `ADMIN` is a deliberate, separate action / bootstrap seed). Its role dropdown offers **Sub-admin** and **Handler**, persisted as `default_event_role` (`MANAGER`/`HANDLER`) and surfaced as the user's "Role" in the list; the actual privilege is granted per-event in M3. The admin enters **no password** — the user receives an emailed one-time code, redeems it on the login page, and sets their own password to activate (§5c).

### 3.3 `event`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| title | varchar(200) NOT NULL | |
| slug | varchar(220) UNIQUE | public URL key |
| description | text | |
| venue | varchar(300) | |
| starts_at / ends_at | timestamptz | |
| status | varchar(16) NOT NULL `CHECK IN ('DRAFT','PUBLIC','ARCHIVED')` default DRAFT | Public activates guest registration |
| category | varchar(60) | free-text label (Conference, Festival, Workshop…) for cards/filters (added V4) |
| capacity | integer NULL `CHECK (capacity IS NULL OR capacity >= 0)` | max registrations; **NULL = unlimited** (added V4) |
| cover_gradient | varchar(10) NOT NULL default 'a' `CHECK IN ('a'..'f')` | cover gradient preset key used when no cover image (added V4) |
| cover_image_key | text | Rustfs object key for an uploaded cover image; overrides the gradient (added V4) |
| registration_qr_token | varchar(64) UNIQUE | optional poster QR that links to the **registration** form (discovery only — NOT attendance) |
| checkin_opens_at | timestamptz | optional time from which organizer attendance scans are accepted |
| created_by | uuid FK→user | Admin creator |
| created_at / updated_at | timestamptz | |

Indexes: `UNIQUE(slug)`, `UNIQUE(registration_qr_token)`, `INDEX(status)`.

> `registration_qr_token` is an **optional** discovery aid — a printed/poster QR that opens the public registration form (resolved at `/public/r?token=...`). It is distinct from the **per-guest attendance QR** (see `registration_submission.checkin_token`, §3.10), which is the ticket an organizer scans to confirm attendance. Rotatable by Admin to invalidate printed posters.

### 3.4 `event_assignment` — delegation join (event-scoped role)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| event_id | uuid FK→event `ON DELETE CASCADE` | |
| user_id | uuid FK→user `ON DELETE CASCADE` | |
| event_role | varchar(16) NOT NULL `CHECK IN ('MANAGER','HANDLER')` | MANAGER = Sub-admin |
| assigned_by | uuid FK→user | who granted it |
| created_at | timestamptz | |

Constraints: `UNIQUE(event_id, user_id)`. Indexes: `INDEX(user_id)`, `INDEX(event_id)`.

> **Heart of event-scoped authorization** ([`03`](03-api-routes-security.md)). `MANAGER` ⇒ Sub-admin powers on that event; `HANDLER` ⇒ task-executor.

### 3.5 `main_supply_item` — global catalog (Admin-owned)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | varchar(200) NOT NULL | |
| description | text | |
| unit | varchar(50) | "box", "each"… |
| default_quantity | integer | |
| active | boolean NOT NULL default true | |
| created_at / updated_at | timestamptz | |

> CRUD restricted to Admin; Sub-admins read only. Referenced by `material.catalog_item_id` with `ON DELETE RESTRICT` so an in-use item cannot be deleted (supports the "cannot delete main supply list" rule).

### 3.6 `material` — event item/task with workflow state
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| event_id | uuid FK→event `ON DELETE CASCADE` | scoping key |
| catalog_item_id | uuid FK→main_supply_item NULL `ON DELETE RESTRICT` | optional catalog link |
| name | varchar(200) NOT NULL | |
| description | text | |
| quantity | integer | |
| status | varchar(16) NOT NULL `CHECK IN ('PENDING','IN_PROGRESS','NEEDS_REVIEW','DONE','ISSUE')` default PENDING | 5-state workflow |
| assigned_to | uuid FK→user NULL `ON DELETE SET NULL` | the Handler |
| created_by | uuid FK→user | |
| created_at / updated_at | timestamptz | |

Indexes: `INDEX(event_id, created_at DESC)`, `INDEX(assigned_to, created_at DESC)`, `INDEX(status)`, `INDEX(catalog_item_id)` (the composites — added in V7 — back the event material list and the Handler "My Tasks" reads; `catalog_item_id` backs the supply-item delete reference probe).

> `assigned_to` drives Handler-scoped authz (`canUpdateMaterial`). Transition rules below (§5).

### 3.7 `material_status_history` — audit trail
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| material_id | uuid FK→material `ON DELETE CASCADE` | |
| from_status | varchar(16) NULL | null on creation |
| to_status | varchar(16) NOT NULL | |
| changed_by | uuid FK→user | actor |
| note | text | reason (esp. ISSUE) |
| created_at | timestamptz | |

Indexes: `INDEX(material_id, created_at)`. Provides real-time, attributable progress visibility.

### 3.8 `agenda_template` & `agenda_item`
**`agenda_template`** (global, built-in defaults + custom):
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| name | varchar(200) NOT NULL | |
| items | jsonb NOT NULL default '[]' | `[{title, durationMin, order}]` |
| is_default | boolean NOT NULL default false | seeded built-ins |
| created_at / updated_at | timestamptz | |

**`agenda_item`** (per-event, instantiated/edited):
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| event_id | uuid FK→event `ON DELETE CASCADE` | |
| title | varchar(200) NOT NULL | |
| starts_at / ends_at | timestamptz | |
| position | integer NOT NULL | ordering |
| created_at / updated_at | timestamptz | |

Indexes: `INDEX(event_id, position)`.

### 3.9 `registration_form` — dynamic form definition (JSONB)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| event_id | uuid FK→event `ON DELETE CASCADE` UNIQUE | **one form per event** — enforced at DB level |
| title | varchar(200) NOT NULL | |
| status | varchar(16) NOT NULL `CHECK IN ('DRAFT','ACTIVE','INACTIVE')` default DRAFT | editable while DRAFT (pre-live) |
| schema | jsonb NOT NULL default '[]' | ordered field-definition array |
| version | integer NOT NULL default 1 | bump on schema change |
| created_by | uuid FK→user | |
| created_at / updated_at | timestamptz | |

Indexes: `UNIQUE(event_id)`, `GIN(schema)`.

> **1:1 with `event`** — `UNIQUE(event_id)` enforces one form per event at the DB level. An event has no form until Admin explicitly creates one; a second creation attempt returns a conflict error. The form is editable while `DRAFT`; once `ACTIVE` the schema is locked (field keys are immutable because existing submissions reference them by key).

### 3.10 `registration_submission` — guest response + personal QR ticket (JSONB)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| form_id | uuid FK→registration_form `ON DELETE CASCADE` | |
| event_id | uuid FK→event `ON DELETE CASCADE` | denormalized for fast event queries |
| answers | jsonb NOT NULL | `{ "<field key>": <value> }` |
| guest_name | varchar(200) | promoted from answers |
| guest_email | varchar(255) NOT NULL | **delivery address for the QR ticket** (required) |
| guest_phone | varchar(30) NOT NULL | **securely collected phone** (required per product req; shown in ops channel) |
| **checkin_token** | varchar(64) NOT NULL UNIQUE | high-entropy token encoded in the guest's **personal attendance QR** |
| **qr_status** | varchar(16) NOT NULL `CHECK IN ('PENDING','DELIVERED','CHECKED_IN','REVOKED')` default PENDING | ticket lifecycle |
| **qr_delivered_at** | timestamptz NULL | when the QR ticket email was sent |
| form_version | integer NOT NULL | schema version answered |
| submitted_at | timestamptz NOT NULL | |
| **telegram_notified** | boolean NOT NULL default false | ops-channel forwarding status; retry source (V9) |

Indexes: `INDEX(event_id, submitted_at)`, `INDEX(guest_email)`, `INDEX(guest_phone)`, `UNIQUE(checkin_token)`, `GIN(answers)`. One registration per email per event is enforced **case-insensitively**: `UNIQUE(event_id, lower(guest_email))` (V5 — also serves the per-registration duplicate probe). Partial index `idx_submission_ops_sweep (submitted_at ASC) WHERE telegram_notified = false` (V9) keeps the Telegram retry sweep bounded.

> `answers` validated server-side against the form `schema` before insert. `guest_email` is mandatory and is the address the QR ticket is emailed to; `guest_phone` is also required (product requirement) and appears in the ops-channel notification. On insert the service generates a unique `checkin_token` (the value encoded in the **per-guest QR**); `qr_status` tracks the ticket through `PENDING → DELIVERED` (email sent) `→ CHECKED_IN` (organizer scan). Email delivery mechanics in [`04`](04-external-integrations.md). GIN index powers attendee-discovery queries (`answers @> '{"company":"Acme"}'`).

### 3.11 `event_checkin` — organizer-confirmed attendance record
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| event_id | uuid FK→event `ON DELETE CASCADE` | |
| submission_id | uuid FK→registration_submission NOT NULL `ON DELETE CASCADE` | the scanned ticket's registration |
| guest_phone | varchar(30) NOT NULL | snapshot of checked-in identity |
| guest_name | varchar(200) | snapshot |
| scanned_by | uuid FK→user NOT NULL | the **organizer** who scanned (Admin/Sub-admin/Handler assigned to the event) |
| source | varchar(16) NOT NULL `CHECK IN ('QR_SCAN','MANUAL')` default QR_SCAN | manual = staff override without QR |
| telegram_notified | boolean NOT NULL default false | ops-channel forwarding status |
| checked_in_at | timestamptz NOT NULL | |
| created_at | timestamptz | |

Indexes: `INDEX(event_id, checked_in_at)`, `INDEX(submission_id)`, `UNIQUE(submission_id)` — **one attendance row per ticket (idempotent / replay-safe)**. Partial index `idx_event_checkin_ops_sweep (checked_in_at ASC) WHERE telegram_notified = false` (V9) keeps the Telegram ops retry sweep bounded.

> Created when an **organizer scans a guest's QR** (resolves `checkin_token` → submission). The `UNIQUE(submission_id)` constraint makes a second scan a no-op conflict (already checked in), satisfying single-use. `scanned_by` attributes the confirmation. `telegram_notified` tracks the ops-channel push (retry source — see [`04`](04-external-integrations.md)).

### 3.12 `refresh_token` — JWT refresh rotation/revocation
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid FK→user `ON DELETE CASCADE` | |
| token_hash | varchar(100) NOT NULL UNIQUE | store hash, not raw |
| expires_at | timestamptz NOT NULL | |
| revoked | boolean NOT NULL default false | |
| replaced_by | uuid NULL | rotation chain |
| created_at | timestamptz | |

Indexes: `UNIQUE(token_hash)`, `INDEX(user_id)`.

> **OTP codes are NOT in PostgreSQL** — they live in Redis with TTL (see [`01` §6](01-architecture-layout.md) and [`04`](04-external-integrations.md)).

## 4. Enumerations (canonical)

| Enum | Values | Column |
|------|--------|--------|
| GlobalRole | `ADMIN`, `MEMBER` | `user.global_role` |
| EventRole | `MANAGER`, `HANDLER` | `event_assignment.event_role` |
| EventStatus | `DRAFT`, `PUBLIC`, `ARCHIVED` | `event.status` |
| **MaterialStatus** | `PENDING`, `IN_PROGRESS`, `NEEDS_REVIEW`, `DONE`, `ISSUE` | `material.status` |
| FormStatus | `DRAFT`, `ACTIVE`, `INACTIVE` | `registration_form.status` |
| TicketStatus | `PENDING`, `DELIVERED`, `CHECKED_IN`, `REVOKED` | `registration_submission.qr_status` |
| CheckinSource | `QR_SCAN`, `MANUAL` | `event_checkin.source` |
| UserStatus | `ACTIVE`, `INACTIVE`, `PENDING_ACTIVATION` | `user.status` |
| (default_event_role) | reuses `EventRole` (`MANAGER`, `HANDLER`) | `user.default_event_role` (nullable designation) |

## 5. Material state machine

```
            ┌───────────────────────── ISSUE ◀──────────────┐
            ▼                                                │ (any active state can raise an issue)
        PENDING ──▶ IN_PROGRESS ──▶ NEEDS_REVIEW ──▶ DONE
            ▲             ▲               │
            │             └───────────────┘  (review sends back)
            └─ ISSUE can be resolved back to PENDING/IN_PROGRESS
```

| From → To | Who | Notes |
|-----------|-----|-------|
| `*` → IN_PROGRESS / NEEDS_REVIEW / ISSUE | assigned Handler, event MANAGER, Admin | Handler limited to own assigned material |
| NEEDS_REVIEW → DONE | event MANAGER, Admin | review approval |
| NEEDS_REVIEW → IN_PROGRESS | event MANAGER, Admin | send back |
| ISSUE → PENDING/IN_PROGRESS | event MANAGER, Admin | issue resolved |
| DONE → * | event MANAGER, Admin | reopen |

Every transition writes a `material_status_history` row. Transition legality is enforced in the `material` service; authority in [`03`](03-api-routes-security.md).

## 5b. Per-guest QR ticket lifecycle

```
 register ──▶ PENDING ──(QR ticket email sent)──▶ DELIVERED
                 │  (retry / resend on demand)        │ organizer scans QR at venue
                 ▼                                     ▼
              PENDING                              CHECKED_IN  (terminal; second scan = no-op)

 REVOKED ◀── Admin/Manager invalidates a ticket (e.g. duplicate/abuse) from PENDING or DELIVERED
```

| Transition | Trigger | Effect |
|------------|---------|--------|
| → `PENDING` | guest submits registration | `checkin_token` generated; QR email not yet sent |
| `PENDING` → `DELIVERED` | QR ticket emailed to `guest_email` (after commit) | set `qr_delivered_at` |
| `DELIVERED`/`PENDING` → `CHECKED_IN` | **organizer scans** the guest QR within the check-in window | create `event_checkin` (1:1), terminal |
| any non-terminal → `REVOKED` | Admin/event MANAGER invalidates | scans rejected |
| `CHECKED_IN` (re-scan) | organizer scans again | **no-op** — returns existing check-in (UNIQUE on `submission_id`) |

> A guest can still be checked in even if the email never arrived (`PENDING`): the post-registration page shows the QR as a fallback, and `PENDING → CHECKED_IN` is permitted.

> A guest can be checked in **only via an organizer scan**; guests never self-check-in. The terminal `CHECKED_IN` + `UNIQUE(event_checkin.submission_id)` guarantee single-use, replay-safe attendance.

## 5c. User account lifecycle (invite → activation)

Admin-created accounts are **invited**, not given a password by the Admin (docs/03 §4.2, docs/06 §3a):

```
 Admin "Add User" (name, email, role=Sub-admin|Handler)
    └─ create user { global_role=MEMBER, default_event_role=MANAGER|HANDLER,
                     password_hash=NULL, status=PENDING_ACTIVATION }
    └─ commit ─▶ AFTER COMMIT: publish UserCreatedEvent
                    └─ OtpService mints a one-time invite code (Redis otp:pwd:{userId}, invite TTL)
                    └─ EmailService emails the code (no link)

 User enters email + code on /login ──▶ POST /auth/login { email, password=code }
    └─ account is PENDING_ACTIVATION → verify code as OTP → return { setupRequired, resetGrant }
       (no session)
 User sets password ──▶ POST /auth/reset-password { email, resetGrant, newPassword }
    └─ consume grant; set BCrypt password_hash; status PENDING_ACTIVATION → ACTIVE
```

| Transition | Trigger | Effect |
|------------|---------|--------|
| → `PENDING_ACTIVATION` | Admin invites a user | `password_hash` NULL; one-time invite code emailed (after commit) |
| `PENDING_ACTIVATION` → `ACTIVE` | user redeems the code on login, then sets a password | `password_hash` set; account usable for login |
| `ACTIVE` ↔ `INACTIVE` | Admin deactivates / reactivates | login blocked while `INACTIVE` |

> A `PENDING_ACTIVATION` user **cannot log in** with a password (they have none); entering their email + one-time code on the login page routes them to set one. The invite code is high-entropy, attempt-capped, single-use, time-expiring (TTL in [`04` §3](04-external-integrations.md)), and resolved server-side only. The bootstrap Admin seed and any future migration-seeded accounts are created `ACTIVE` with a password and are exempt from this flow.

## 6. JSONB document structures (dynamic forms)

### 6.1 `registration_form.schema` — field definitions (one source of truth, consumed by the FE renderer and BE validator)
```json
[
  { "key": "full_name", "label": "Full name", "type": "text",
    "required": true, "order": 1, "validation": { "minLength": 2, "maxLength": 120 } },

  { "key": "email", "label": "Email", "type": "email",
    "required": true, "order": 2, "validation": { "pattern": "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$" } },

  { "key": "phone", "label": "Phone number", "type": "phone",
    "required": true, "order": 3, "validation": { "pattern": "^[0-9+\\-\\s]{7,20}$" } },

  { "key": "company", "label": "Company", "type": "text",
    "required": false, "order": 4 },

  { "key": "meal", "label": "Meal preference", "type": "select",
    "required": false, "order": 5, "options": ["Veg", "Non-veg", "Vegan"] }
]
```

**Field object contract**
| Property | Type | Meaning |
|----------|------|---------|
| `key` | string | unique within a form, immutable once submissions exist |
| `label` | string | display label |
| `type` | enum | `text · email · phone · number · date · select · multiselect · checkbox · textarea` |
| `required` | boolean | server-enforced presence |
| `order` | number | render/sort order |
| `options` | string[] | for `select`/`multiselect` |
| `validation` | object | optional: `minLength, maxLength, min, max, pattern` |

> An `email` field (QR-ticket delivery) **and** a `phone` field (product requirement) are **mandatory** in any active event form; the form-builder enforces both before a form can go `ACTIVE`. `guest_email`/`guest_phone` are promoted from these answers.

### 6.2 `registration_submission.answers` — keyed by field `key`
```json
{
  "full_name": "Dara Sok",
  "email": "dara@example.com",
  "phone": "+855 12 345 678",
  "company": "Acme Co",
  "meal": "Vegan"
}
```

**Validation on submit:** the service loads the form's `schema`, then checks (a) all `required` keys present, (b) each value matches its field `type` + `validation`, (c) `select`/`multiselect` values are within `options`, (d) no unknown keys. `guest_email` is promoted from `answers.email` and `guest_phone` from `answers.phone`. Invalid submissions are rejected with field-level errors (no DB write, no migration ever needed for new fields).

## 7. Indexing strategy

- **Scoping/lookup:** B-tree on every filtered FK (`event_id`, `user_id`, `assigned_to`, `status`, `guest_email`, `guest_phone`).
- **JSONB search:** GIN on `registration_form.schema` and `registration_submission.answers` (`@>` containment) for attendee discovery.
- **Ticket resolution:** `UNIQUE(registration_submission.checkin_token)` — O(1) lookup when an organizer scans a QR.
- **Uniqueness:** `user.email`, `event.slug`, `event.registration_qr_token`, `event_assignment(event_id,user_id)`, `registration_form.event_id` (one form per event), `registration_submission.checkin_token`, `event_checkin.submission_id` (one attendance per ticket), `refresh_token.token_hash`.
- **Audit/timeline reads:** composite `(material_id, created_at)`, `(event_id, checked_in_at)`.
- **Dashboard aggregates (V6, docs/03 §4.13):** composite `(registration_submission.event_id, qr_status)` for org-wide/grouped check-in counts; `(event_assignment.event_id, event_role)` for managers-per-event; `(event.starts_at DESC NULLS LAST)` for the bounded most-recent-first control feed.
- **Telegram ops retry sweeps (V9, docs/04 §2.2, docs/06 §7):** partial indexes `idx_submission_ops_sweep (registration_submission.submitted_at ASC) WHERE telegram_notified = false` and `idx_event_checkin_ops_sweep (event_checkin.checked_in_at ASC) WHERE telegram_notified = false` keep both org-wide retry sweeps to a tiny working set (only un-notified rows are indexed; rows disappear from the index within seconds of a successful push).

## 8. Migration & seed plan (Flyway)

`V1__init.sql` order: extensions (`pgcrypto`) → organization → user → event → event_assignment → main_supply_item → material → material_status_history → agenda_template → agenda_item → registration_form → registration_submission → event_checkin → refresh_token.
Seed (separate migration): singleton organization row, built-in default agenda templates (`is_default=true`), bootstrap Admin user (credential injected via env, never hard-coded).

## 9. Open questions for review

- **One registration per email per event?** If yes, add `UNIQUE(event_id, guest_email)` on `registration_submission` and re-send the existing QR on re-registration. *(Default: enforce uniqueness — one ticket per email per event.)*
- **What does the QR encode** — the raw `checkin_token`, or a signed URL `…/scan?t=<token>`? *(Default: opaque `checkin_token`; the authenticated organizer app resolves it server-side.)*
- **Re-entry:** is a single `CHECKED_IN` enough, or do we need multiple scans (in/out)? *(Default: single terminal check-in in v1.)*
- Track material `quantity` as required/received split for partial fulfillment? *(Default: single quantity in v1.)*
- Allow custom agenda templates beyond built-ins in v1? *(Default: yes, `is_default=false` rows.)*
