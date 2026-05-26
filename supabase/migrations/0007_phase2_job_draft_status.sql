-- Phase 2 — Job lifecycle: add 'draft' status + published_at / closed_at timestamps
--
-- Drops the existing status check constraint (auto-named from 0006) and replaces it
-- with one that includes 'draft'. Uses a DO block to find the constraint by content
-- so the drop works regardless of the auto-generated name.

DO $$
DECLARE
  v_constraint text;
BEGIN
  SELECT conname INTO v_constraint
  FROM pg_constraint
  WHERE conrelid = 'public.jobs'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%status%';
  IF v_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.jobs DROP CONSTRAINT %I', v_constraint);
  END IF;
END $$;

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_status_check
  CHECK (status IN ('draft', 'active', 'archived'));

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS published_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS closed_at     timestamptz NULL;

-- Backfill: if archived_at column exists, copy it into closed_at for archived jobs
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'archived_at'
  ) THEN
    UPDATE public.jobs
      SET closed_at = archived_at
      WHERE status = 'archived' AND archived_at IS NOT NULL AND closed_at IS NULL;
  END IF;
END $$;
