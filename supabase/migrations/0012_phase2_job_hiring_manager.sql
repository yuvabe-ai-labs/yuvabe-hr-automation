-- Phase 2 — RBAC: hiring manager assignment on jobs
--
-- Managers only see jobs where hiring_manager_id = their user id.
-- NULL means unassigned (admin/viewer can still see it).
-- Depends on: 0009_phase2_users_table.sql

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS hiring_manager_id text NULL
    REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS jobs_hiring_manager_id_idx
  ON public.jobs (hiring_manager_id);
