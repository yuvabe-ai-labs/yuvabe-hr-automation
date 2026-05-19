-- Phase 2 — LinkedIn paid/free job flag
--
-- LinkedIn allows one free active posting; additional postings are paid.
-- HR uses this flag to track which jobs consume the free slot vs a paid slot.
-- Default false = free listing.

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS is_paid_listing boolean NOT NULL DEFAULT false;
