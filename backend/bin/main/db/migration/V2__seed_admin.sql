-- V2: seed default admin account
-- Depends on: user table created in a prior schema migration (see docs/02-database-schema.md §3.2)
-- Password "123" BCrypt-hashed (strength 10) — CHANGE ON FIRST LOGIN IN PRODUCTION
--
-- To regenerate the hash:
--   new BCryptPasswordEncoder(10).encode("123")

INSERT INTO "user" (
    id,
    email,
    password_hash,
    full_name,
    global_role,
    status,
    created_at,
    updated_at
)
VALUES (
    gen_random_uuid(),
    'admin@gmail.com',
    '$2b$10$kqh94dKIaidnIGGXyqYCleHD66mPiqvHJ1.LaS8Xs5ZAQvXNLOThO',
    'System Admin',
    'ADMIN',
    'ACTIVE',
    now(),
    now()
)
ON CONFLICT (email) DO NOTHING;
