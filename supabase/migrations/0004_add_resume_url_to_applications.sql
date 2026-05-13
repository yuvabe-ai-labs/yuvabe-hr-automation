-- Add resume_url to applications for Supabase Storage path
alter table public.applications
  add column if not exists resume_url text null;
