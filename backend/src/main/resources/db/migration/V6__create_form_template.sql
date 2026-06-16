-- V5: registration-form templates (reusable schemas, not bound to an event).
-- The form builder (admin / sub-admin) designs these; an event's registration_form can later be
-- seeded from a template. Mirrors the registration_form JSONB schema contract (docs/02 §6.1) minus
-- the event lifecycle columns (event_id/status/version) — a template has no live state.

CREATE TABLE form_template (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       varchar(200) NOT NULL,
    event_type varchar(80)  NOT NULL,
    title      varchar(200) NOT NULL,
    schema     jsonb NOT NULL DEFAULT '[]',
    created_by uuid REFERENCES "user" (id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_form_template_event_type ON form_template (event_type);
CREATE INDEX idx_form_template_schema ON form_template USING gin (schema);

-- ── Starter templates by event type ──────────────────────────────────────────
-- email + phone are mandatory and always required (QR delivery + product rule, docs/07 §3).
INSERT INTO form_template (name, event_type, title, schema) VALUES
(
    'Conference registration', 'Conference', 'Conference Registration',
    '[
      {"key":"email","label":"Email address","type":"email","required":true,"order":0},
      {"key":"phone","label":"Phone number","type":"phone","required":true,"order":1},
      {"key":"full_name","label":"Full name","type":"text","required":true,"order":2},
      {"key":"company","label":"Company / Organization","type":"text","required":false,"order":3},
      {"key":"job_title","label":"Job title","type":"text","required":false,"order":4},
      {"key":"dietary","label":"Dietary preference","type":"select","required":false,"order":5,"options":["No preference","Vegetarian","Vegan","Halal","Gluten-free"]}
    ]'::jsonb
),
(
    'Workshop registration', 'Workshop', 'Workshop Registration',
    '[
      {"key":"email","label":"Email address","type":"email","required":true,"order":0},
      {"key":"phone","label":"Phone number","type":"phone","required":true,"order":1},
      {"key":"full_name","label":"Full name","type":"text","required":true,"order":2},
      {"key":"experience","label":"Experience level","type":"select","required":true,"order":3,"options":["Beginner","Intermediate","Advanced"]},
      {"key":"bring_laptop","label":"I will bring my own laptop","type":"checkbox","required":false,"order":4}
    ]'::jsonb
),
(
    'Webinar registration', 'Webinar', 'Webinar Registration',
    '[
      {"key":"email","label":"Email address","type":"email","required":true,"order":0},
      {"key":"phone","label":"Phone number","type":"phone","required":true,"order":1},
      {"key":"full_name","label":"Full name","type":"text","required":true,"order":2},
      {"key":"questions","label":"Questions for the speaker","type":"textarea","required":false,"order":3}
    ]'::jsonb
),
(
    'Networking event registration', 'Networking', 'Networking Registration',
    '[
      {"key":"email","label":"Email address","type":"email","required":true,"order":0},
      {"key":"phone","label":"Phone number","type":"phone","required":true,"order":1},
      {"key":"full_name","label":"Full name","type":"text","required":true,"order":2},
      {"key":"company","label":"Company / Organization","type":"text","required":false,"order":3},
      {"key":"interests","label":"Areas of interest","type":"multiselect","required":false,"order":4,"options":["Engineering","Design","Product","Marketing","Sales","Founders"]}
    ]'::jsonb
);
