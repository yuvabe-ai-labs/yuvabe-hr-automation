alter table public.jobs
  add column if not exists status text not null default 'active'
  check (status in ('active', 'archived'));

-- Backfill: any row with archived_at set is already archived
update public.jobs set status = 'archived' where archived_at is not null;
