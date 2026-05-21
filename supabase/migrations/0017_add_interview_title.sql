-- Add title column to interviews table
-- HR manually enters a title for each scheduled interview (e.g. "In-person Interview — Round 1")
-- Used as the section heading in the candidate confirmation email.

ALTER TABLE public.interviews
  ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '';
