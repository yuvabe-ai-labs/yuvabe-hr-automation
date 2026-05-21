-- Phase 2 — Create interviews table
--
-- Stores scheduled interviews for candidates. interviewer_id references
-- the users table (text PK). All times stored as UTC ISO 8601.
-- Depends on: 0001_init.sql, 0009_phase2_users_table.sql

CREATE TABLE IF NOT EXISTS public.interviews (
  id               text        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  application_id   text        NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  candidate_id     text        NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  candidate_name   text        NOT NULL DEFAULT '',
  candidate_email  text        NOT NULL DEFAULT '',
  job_id           text        NOT NULL DEFAULT '',
  job_code         text        NOT NULL DEFAULT '',
  job_title        text        NOT NULL DEFAULT '',
  scheduled_at     timestamptz NOT NULL,
  duration_minutes int         NOT NULL DEFAULT 60,
  timezone         text        NOT NULL DEFAULT 'UTC',
  status           text        NOT NULL DEFAULT 'scheduled',
  notes            text        NULL,
  location         text        NULL,
  meeting_link     text        NULL,
  interviewer_id   text        NULL REFERENCES public.users(id) ON DELETE SET NULL,
  interviewer_name text        NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS interviews_application_id_idx
  ON public.interviews (application_id);

CREATE INDEX IF NOT EXISTS interviews_interviewer_id_idx
  ON public.interviews (interviewer_id);

CREATE INDEX IF NOT EXISTS interviews_scheduled_at_idx
  ON public.interviews (scheduled_at);
