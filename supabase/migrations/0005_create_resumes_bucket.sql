-- Create the resumes storage bucket (public for direct URL access)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes',
  'resumes',
  true,
  52428800, -- 50MB max file size
  array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
)
on conflict (id) do nothing;

-- Allow service role to upload resumes
create policy "Service role can upload resumes"
  on storage.objects
  for insert
  with check (
    bucket_id = 'resumes'
    and auth.role() = 'service_role'
  );

-- Allow public read access to resume files (bucket is public)
create policy "Public can read resumes"
  on storage.objects
  for select
  using (
    bucket_id = 'resumes'
  );

-- Allow service role to delete resumes (for cleanup if needed)
create policy "Service role can delete resumes"
  on storage.objects
  for delete
  using (
    bucket_id = 'resumes'
    and auth.role() = 'service_role'
  );
