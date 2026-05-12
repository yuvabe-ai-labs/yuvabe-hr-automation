-- Add resume_url column to applications table
-- Stores the Supabase Storage path to the uploaded resume file
-- Nullable: old applications without stored files have null
alter table applications add column resume_url text null;
