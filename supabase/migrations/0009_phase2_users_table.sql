-- Phase 2 — RBAC: users table
--
-- Replaces the single hardcoded AUTH_USER/AUTH_PASS with proper per-user accounts.
-- Roles: admin (full access) | manager (assigned jobs only) | viewer (read-only).
-- password_hash stores bcrypt hash — empty default is overwritten during RBAC setup.
-- The initial admin row is seeded here; password is set programmatically in Block B.

CREATE TABLE IF NOT EXISTS public.users (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email         text UNIQUE NOT NULL,
  name          text NOT NULL DEFAULT '',
  role          text NOT NULL DEFAULT 'viewer'
                  CHECK (role IN ('admin', 'manager', 'viewer')),
  password_hash text NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON public.users (email);

-- Seed the initial admin — password set during Block B implementation
INSERT INTO public.users (id, email, name, role)
VALUES (gen_random_uuid()::text, 'arunkumar@yuvabe.com', 'Arun Kumar', 'admin')
ON CONFLICT (email) DO NOTHING;
