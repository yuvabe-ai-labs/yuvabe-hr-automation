-- Phase 2 — Candidate blacklist flag
--
-- Global do-not-contact flag at the candidate level.
-- Admin-only action; fully reversible via blacklist_reason nullability.

ALTER TABLE public.candidates
  ADD COLUMN IF NOT EXISTS is_blacklisted   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS blacklist_reason text    NULL;

CREATE INDEX IF NOT EXISTS candidates_blacklisted_idx
  ON public.candidates (is_blacklisted)
  WHERE is_blacklisted = true;
