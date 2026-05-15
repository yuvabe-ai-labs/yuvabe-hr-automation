-- Reviewer notes on applications — one row per note, ordered by created_at desc.
-- author_email stores the reviewer's identity (no auth table yet; matches AUTH_USER env).
-- application_id is TEXT to match the parent applications.id type (see 0001_init.sql).

create table application_notes (
  id              text primary key,
  application_id  text not null,
  author_email    text not null,
  body            text not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index on application_notes (application_id, created_at desc);
