-- Phase 2 — Update interviews table
--
-- Removes Google Calendar integration fields and adds plain scheduling fields.
-- interviewer_id references the users table (text PK).

ALTER TABLE public.interviews
  DROP COLUMN IF EXISTS google_event_id,
  DROP COLUMN IF EXISTS google_meet_link,
  ADD COLUMN IF NOT EXISTS location      text         NULL,
  ADD COLUMN IF NOT EXISTS meeting_link  text         NULL,
  ADD COLUMN IF NOT EXISTS interviewer_id text        NULL REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS interviewer_name text      NULL;

CREATE INDEX IF NOT EXISTS interviews_interviewer_id_idx
  ON public.interviews (interviewer_id);

CREATE INDEX IF NOT EXISTS interviews_scheduled_at_idx
  ON public.interviews (scheduled_at);
