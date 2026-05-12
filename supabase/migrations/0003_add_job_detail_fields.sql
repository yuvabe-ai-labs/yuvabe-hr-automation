alter table jobs_duplicate
  add column if not exists department text,
  add column if not exists location text,
  add column if not exists compensation text,
  add column if not exists type text,
  add column if not exists level text,
  add column if not exists summary text,
  add column if not exists responsibilities jsonb default '[]'::jsonb,
  add column if not exists requirements jsonb default '[]'::jsonb,
  add column if not exists nicetohave jsonb default '[]'::jsonb,
  add column if not exists portfoliorequirement text,
  add column if not exists benefits_remote jsonb default '[]'::jsonb,
  add column if not exists benefits_inperson jsonb default '[]'::jsonb,
  add column if not exists workculture jsonb default '[]'::jsonb,
  add column if not exists updated_at timestamptz default now();

create index if not exists idx_jobs_level on jobs_duplicate (level) tablespace pg_default;

create index if not exists idx_jobs_department on jobs_duplicate (department) tablespace pg_default;
