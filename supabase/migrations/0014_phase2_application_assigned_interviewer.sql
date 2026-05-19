-- Phase 2 — Bulk assign interviewer on applications
--
-- Stores the assigned interviewer (user) for a candidate.
-- Used by bulk-assign action and the Assigned Interviewer filter.
-- Depends on: 0009_phase2_users_table.sql

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS assigned_interviewer_id text NULL
    REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS applications_assigned_interviewer_idx
  ON public.applications (assigned_interviewer_id);
