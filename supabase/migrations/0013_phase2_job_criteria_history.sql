-- Phase 2 — Criteria audit trail
--
-- Every edit to a job's criteria is logged as a before/after JSONB snapshot.
-- changed_by stores the user's email for display without a join.
-- Depends on: 0009_phase2_users_table.sql

CREATE TABLE IF NOT EXISTS public.job_criteria_history (
  id              text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  job_id          text NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  changed_by      text NOT NULL,   -- user email, denormalized for display
  changed_at      timestamptz NOT NULL DEFAULT now(),
  change_note     text NOT NULL DEFAULT '',
  criteria_before jsonb NOT NULL,
  criteria_after  jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS job_criteria_history_job_id_idx
  ON public.job_criteria_history (job_id, changed_at DESC);
