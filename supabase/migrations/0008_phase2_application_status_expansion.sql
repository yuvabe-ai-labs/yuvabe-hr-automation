-- Phase 2 — Expand application pipeline
--
-- Old pipeline: new | reviewing | shortlisted | rejected | offered
-- New pipeline: new | reviewing | shortlisted | interview_scheduled | interviewed
--               | offered | hired | rejected | withdrawn
--
-- Also adds rejection_reason and missing scoring columns.

DO $$
DECLARE
  v_constraint text;
BEGIN
  SELECT conname INTO v_constraint
  FROM pg_constraint
  WHERE conrelid = 'public.applications'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%status%';
  IF v_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.applications DROP CONSTRAINT %I', v_constraint);
  END IF;
END $$;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_status_check
  CHECK (status IN (
    'new', 'reviewing', 'shortlisted',
    'interview_scheduled', 'interviewed',
    'offered', 'hired',
    'rejected', 'withdrawn'
  ));

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS rejection_reason text NULL;

-- Scoring columns that may not exist yet
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS must_score      int NULL,
  ADD COLUMN IF NOT EXISTS preferred_score int NULL,
  ADD COLUMN IF NOT EXISTS nice_score      int NULL,
  ADD COLUMN IF NOT EXISTS scored_at       timestamptz NULL;
