-- V1: baseline — enable extensions required by the schema
-- See docs/02-database-schema.md for the full ERD

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_bytes() for checkin_token
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- uuid_generate_v4() fallback
