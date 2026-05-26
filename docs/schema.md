Yuvabe ATS — Database Schema

jobs
 PK   id
 UK   code
title
description
status
created_at
published_at
closed_at
 JSONB   criteria[]
· id  ·  nanoid
· category  ·  skill | experience | education…
· label  ·  string
· importance  ·  must | preferred | nice
· weight  ·  1–5






applications
 PK   id
 FK   job_id
 FK   candidate_id
job_code  ·  job_title
candidate_name  ·  email
resume_url  ·  resume_text
cover_letter
match_score  ·  scored_at
must_score  ·  preferred_score
nice_score  ·  match_summary
status  ·  received_at
 JSONB   match_breakdown[]
· criterion_id  ·  ref → criteria.id
· criterion_label  ·  string
· importance  ·  must | preferred | nice
· matched  ·  yes | partial | no
· score  ·  0–10
· evidence  ·  string






candidates
 PK   id
 UK   email
name  ·  phone  ·  location
summary
years_of_experience
created_at  ·  updated_at
 JSONB   skills[]
· string[]  ·  array of skill names
 JSONB   experience[]
· company  ·  string
· title  ·  string
· start_date  ·  YYYY-MM
· end_date  ·  YYYY-MM | present
· description  ·  string
 JSONB   education[]
· institution  ·  string
· degree  ·  string
· year  ·  int
 JSONB   links
· linkedin  ·  string | null
· github  ·  string | null
· portfolio  ·  string | null
· email  ·  string | null









application_notes
 PK   id
 FK   application_id
 FK   author_email → users
body
created_at  ·  updated_at






job_criteria_history
 PK   id
 FK   job_id
 FK   changed_by → users
changed_at  ·  change_note
 JSONB   criteria_before
· full criteria[] snapshot  ·  before edit
 JSONB   criteria_after
· full criteria[] snapshot  ·  after edit






users
 PK   id
 UK   email
name
role  ·  admin | manager | viewer
created_at






RELATIONSHIPS
jobs  1 ──< applications >── 1  candidates
applications  1 ──< application_notes
jobs  1 ──< job_criteria_history
users  1 ──< application_notes  (via author_email)
users  1 ──< job_criteria_history  (via changed_by)
 PK   Primary key      FK   Foreign key      UK   Unique      JSONB   Embedded doc     





