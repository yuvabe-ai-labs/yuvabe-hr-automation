# Yuvabe People — Phase 2 Deliverables

**Date:** 2026-05-18  
**Branch baseline:** `development` (Phase 1 complete)

---

## Current State Snapshot

| Area | Current state | Gap |
|---|---|---|
| Job status | `active \| archived` | No `draft` state |
| Application status | `new \| reviewing \| shortlisted \| rejected \| offered` | Missing `interview_scheduled`, `interviewed`, `hired`, `withdrawn` |
| Interview scheduling | DB table exists, zero implementation, has Google Calendar fields | Full implementation needed; remove GCal refs |
| RBAC | Single hardcoded account (ENV vars) | No users table, no roles, no per-job assignment |
| Bulk actions | Bulk export only | No bulk status change, archive, or assign |
| Candidate blacklist | Not implemented | No flag on candidates schema |
| Paid/unpaid job flag | Not in schema | Needed for LinkedIn job board use |
| Advanced filters | Status tabs + search + min score + top N | No department / location / date / type filters |
| Criteria editing | Locked after JD submission | HR flagged as blocking issue |

---

## Tickets

---

### Job Lifecycle: Draft → Active → Archived

---

**Add `draft` status to jobs schema**  
_Backend / Schema_

- Add `"draft"` to the job `status` enum in the DB and all type definitions
- Add `published_at` timestamp (set when status moves draft → active)
- Add `closed_at` timestamp (set when status moves active → archived)
- Files: `integrations/database.types.ts`, `types/jobs.ts`, `lib/jobs-store.ts`, `services/jobs.service.ts`
- DB migration required

**Acceptance:** A job can exist with status `draft`. `published_at` is null until published. `closed_at` is set on archive.

---

**Save job as draft UI**  
_Frontend_

- On the "Create Job" form, add two action buttons: **"Save as Draft"** and **"Publish"**
- Draft jobs appear in a new "Drafts" tab on the jobs list page (alongside Active / Archived)
- Draft jobs do NOT appear on the public careers page (`yuvabestudios.com/careers`)
- Files: `app/jobs/new/page.tsx`, `app/api/jobs/route.ts`, `app/jobs/_components/jobs-list.tsx`

**Acceptance:** Clicking "Save as Draft" creates a job with `status: draft`. Hidden from public. Appears under Drafts tab.

---

**Publish and unpublish actions**  
_Frontend + Backend_

- Draft job detail page: **"Publish"** button → sets status to `active`, sets `published_at`
- Active job detail page: **"Unpublish"** button → moves back to `draft`
- Archive remains a separate action (soft-delete, sets `closed_at`)
- API: `PATCH /api/jobs/[code]/status` with body `{ status: 'active' | 'draft' | 'archived' }`

**Acceptance:** Full round-trip: draft → active → draft → active → archived. `published_at` set correctly.

---

**Clone an archived job**  
_Frontend + Backend_

- Archived job row: **"Clone"** action in overflow menu
- Clones title, description, and all criteria into a new `draft` job
- API: `POST /api/jobs/[code]/clone`

**Acceptance:** Cloned job appears in Drafts tab with all criteria inherited. Original is unmodified.

---

### Application Pipeline Expansion

---

**Expand application status enum**  
_Backend / Schema_

Current: `new | reviewing | shortlisted | rejected | offered`  
New pipeline: `new → reviewing → shortlisted → interview_scheduled → interviewed → offered → hired | rejected | withdrawn`

- Add `interview_scheduled`, `interviewed`, `hired`, `withdrawn` to the enum
- DB migration: update status column check constraint
- Files: `types/applications.ts`, `lib/applications-store.ts`, `integrations/database.types.ts`

**Acceptance:** All 9 statuses valid in DB and type system. Existing records unaffected.

---

**Update status-actions UI for full pipeline**  
_Frontend_

- Rebuild `app/applications/[id]/_components/status-actions.tsx` to reflect the full pipeline
- Display current status as a visual stage tracker
- Transition guards: cannot skip stages (e.g. `new` → `hired` blocked)

**Acceptance:** Stage tracker visible on candidate detail. Invalid transitions blocked.

---

**Filter applications by new statuses**  
_Frontend_

- Update filter tabs on applications list to include `interview_scheduled`, `interviewed`, `hired`, `withdrawn`
- Update status groups in `services/applications.service.ts`

**Acceptance:** Each new status is filterable. Counts accurate.

---

### Interview Scheduling

---

**Clean up interviews table (remove Google Calendar fields)**  
_Backend / Schema_

- Remove `google_event_id` and `google_meet_link` from the `interviews` table
- Add `location` (string) and `meeting_link` (plain URL, optional) instead
- DB migration required

**Acceptance:** Interviews table has no Google-specific fields.

---

**Schedule interview API**  
_Backend_

- `POST /api/applications/[id]/interviews` — create interview
- `PATCH /api/interviews/[id]` — update (reschedule)
- `DELETE /api/interviews/[id]` — cancel

Fields: `scheduled_at`, `duration_minutes`, `timezone`, `interviewer_name`, `location`, `meeting_link`, `notes`  
On create → application status auto-advances to `interview_scheduled`

**Acceptance:** Interview record created. Application status updated. No Google dependency.

---

**Schedule interview UI**  
_Frontend_

- Candidate detail page: **"Schedule Interview"** button (visible when status is `shortlisted`)
- Modal with date-time picker, duration, location/meeting link, notes
- After save: status updates, interview card appears on profile
- Reschedule / cancel from same card

**Acceptance:** Schedulable from candidate page. Cancel/reschedule works.

---

**Send .ics invite via Resend**  
_Backend_

On interview create/update/cancel, send candidate email via Resend:
- HTML confirmation email + `.ics` calendar file attached
- `.ics`: title "Interview — {Job Title} at Yuvabe", date/time, duration, location/meeting link
- Reschedule: new invite with `SEQUENCE` increment
- Cancel: `.ics` with `METHOD:CANCEL`

Tech: `ics` npm package + Resend

**Acceptance:** Candidate receives email with `.ics`. Gmail/Outlook detects as calendar invite.

---

### RBAC (Role-Based Access Control)

---

**Users table + auth migration**  
_Backend / Schema_

- Create `users` table: `id`, `email`, `name`, `role` (`admin | manager | viewer`), `password_hash`, `created_at`
- Update `lib/auth.ts` `verifyCredentials()` to query Supabase `users` table
- Session cookie encodes `userId` + `role`
- DB seed: admin (hr@yuvabe.com) + demo hiring manager
- Files: `lib/auth.ts`, `middleware.ts`, `app/api/auth/login/route.ts`

**Acceptance:** Login works against DB users. Session encodes role.

---

**Role-based middleware gates**  
_Backend_

- `middleware.ts` reads `role` from session
- Route rules: `/jobs/new` → admin only; `/jobs/[code]` → manager sees assigned jobs only; status mutations → admin + manager only
- Returns 403 for unauthorized access

**Acceptance:** Manager cannot access `/jobs/new`. Viewer cannot change statuses.

---

**Assign hiring manager to a job**  
_Frontend + Backend_

- Job creation / edit form: "Assign Hiring Manager" dropdown (manager-role users)
- Stored as `hiring_manager_id` FK on `jobs` table
- Managers only see jobs where `hiring_manager_id = their userId`
- API: `PATCH /api/jobs/[code]` supports `hiringManagerId`

**Acceptance:** Manager only sees assigned jobs when logged in.

---

**User management screen (admin only)**  
_Frontend_

- `/settings/users` — admin only
- List all users (name, email, role)
- Invite new user: email + role → Resend invite email with one-time setup link
- Edit role / deactivate user

**Acceptance:** Admin can invite a hiring manager. Manager receives email and can log in.

---

### Bulk Actions

---

**Bulk status change on applications list**  
_Frontend + Backend_

- Bulk action bar: add **"Move to…"** status dropdown
- API: `PATCH /api/applications/bulk-status` with `{ ids: string[], status: ApplicationStatus }`
- Invalidates applications query cache after mutation

**Acceptance:** Select 5 candidates, pick status, all 5 update. Toast confirms.

---

**Bulk reject**  
_Frontend_

- Bulk action bar: **"Reject Selected"** button with confirmation dialog
- Reuses `PATCH /api/applications/bulk-status` with `status: 'rejected'`

**Acceptance:** Confirmation dialog appears. Selected candidates move to rejected.

---

**Bulk archive jobs**  
_Frontend + Backend_

- Jobs list: add row checkboxes
- Bulk action bar: **"Archive Selected"**
- API: `PATCH /api/jobs/bulk-archive` with `{ codes: string[] }`

**Acceptance:** Selected jobs move to Archived tab.

---

**Bulk assign interviewer**  
_Frontend + Backend_

- Applications bulk action bar: **"Assign Interviewer"** dropdown
- Stores `assigned_interviewer_id` on application record
- API: `PATCH /api/applications/bulk-assign` with `{ ids: string[], interviewerId: string }`

**Acceptance:** Interviewer visible on candidate cards after assignment.

---

### Candidate Blacklist

---

**Add blacklist flag to candidates schema**  
_Backend / Schema_

- Add `is_blacklisted` boolean (default false) and `blacklist_reason` text to `candidates` table
- DB migration required
- Files: `integrations/database.types.ts`, `types/candidates.ts`

**Acceptance:** Columns exist in DB and type system.

---

**Blacklist action on candidate profile**  
_Frontend + Backend_

- Candidate detail page: **"Blacklist Candidate"** in overflow (admin only), with confirmation modal + optional reason
- API: `PATCH /api/candidates/[id]/blacklist`
- Blacklisted candidates show warning banner on profile
- Reversible: **"Remove from Blacklist"**

**Acceptance:** Flag set on blacklist. Banner visible. Reversible.

---

**Block blacklisted candidates at application intake**  
_Backend_

- On new application submission, check if candidate email is blacklisted
- Flag for HR review if blacklisted (behavior TBD — see open questions)

**Acceptance:** Application from blacklisted email does not silently pass through.

---

### Paid / Unpaid Job Flag

---

**Add `is_paid_listing` field to jobs schema**  
_Backend / Schema_

- Add `is_paid_listing` boolean (default false) to `jobs` table
- DB migration required
- Files: `integrations/database.types.ts`, `types/jobs.ts`

---

**Paid/unpaid toggle in job creation form**  
_Frontend_

- Create / edit job form: **"LinkedIn Paid Listing"** toggle (default: off)
- Helper note: "LinkedIn allows 1 free active job. Enable for additional paid postings."
- Jobs list: show Free / Paid badge per job
- Warning if >1 active jobs have `is_paid_listing = false`

**Acceptance:** Toggle saves to DB. Badge visible. Free-tier warning shown when applicable.

---

### Advanced Filters

---

**Jobs list advanced filters**  
_Frontend_

New filter controls:
- Department — multi-select
- Location — multi-select
- Job Type — multi-select (`full-time | part-time | contract | internship`)
- Date Posted — date range picker (uses `published_at`)
- All URL-param driven

**Acceptance:** Filters work, persist on refresh, have a clear button.

---

**Applications list advanced filters**  
_Frontend_

New filter controls:
- Date Applied — date range (uses `received_at`)
- Location — multi-select (from candidate `location`)
- Years of Experience — range slider
- Assigned Interviewer — dropdown (after bulk-assign is built)
- All URL-param driven

**Acceptance:** Each filter narrows the list correctly.

---

### Criteria Editing + Audit Trail

---

**Allow editing criteria on active jobs**  
_Frontend + Backend_

- Job detail criteria view: **"Edit Criteria"** button (admin only)
- On save: record before/after snapshot in `job_criteria_history` with author + timestamp
- API: `PATCH /api/jobs/[code]/criteria` with `{ criteria: CriterionInput[], changeNote?: string }`

**Acceptance:** Active job criteria editable. History saved on every edit.

---

**Criteria change history view**  
_Frontend_

- Job detail page: "Criteria History" section
- Shows all edits: date, author, change note, before/after diff
- Component: `app/jobs/[code]/_components/criteria-history.tsx`

**Acceptance:** History list shows all past changes with timestamps and authors.

---

## Dependency Order

```
2A — Foundation (schema migrations first)
  Job status enum (draft)
  Application status enum expansion
  Users table + auth migration
  Candidate blacklist schema
  is_paid_listing schema
  Clean up interviews table

2B — Core Features (after 2A)
  Draft/publish UI
  Application pipeline UI
  RBAC middleware + job assignment
  Criteria editing

2C — Scheduling (after pipeline UI)
  Interview scheduling API
  Schedule interview UI
  .ics invite via Resend

2D — Bulk + Filters (after 2B)
  Bulk status change / reject
  Bulk archive jobs
  Bulk assign interviewer
  Advanced filters (jobs + applications)

2E — Admin + Polish (after RBAC)
  User management screen
  Blacklist UI + intake gate
  Paid/unpaid job UI
  Clone archived job
  Criteria history view
```

---

## Open Business Questions

1. **Blacklist intake behavior** — When a blacklisted candidate applies again, should it be silently rejected or flagged for HR review?
2. **Viewer role scope** — Should Basic Viewer see candidate contact details (email, phone), or only scores and names?
3. **Criteria re-score** — When criteria are edited on an active job, should existing match scores be re-run automatically, or left as-is with a manual "re-score" prompt?

---

## Ticket Summary

| Title | Type |
|---|---|
| Add `draft` status to jobs schema | Schema |
| Save job as draft UI | Frontend |
| Publish and unpublish actions | Full-stack |
| Clone an archived job | Full-stack |
| Expand application status enum | Schema |
| Update status-actions UI for full pipeline | Frontend |
| Filter applications by new statuses | Frontend |
| Clean up interviews table | Schema |
| Schedule interview API | Backend |
| Schedule interview UI | Frontend |
| Send .ics invite via Resend | Backend |
| Users table + auth migration | Schema + Backend |
| Role-based middleware gates | Backend |
| Assign hiring manager to a job | Full-stack |
| User management screen | Full-stack |
| Bulk status change on applications list | Full-stack |
| Bulk reject | Frontend |
| Bulk archive jobs | Full-stack |
| Bulk assign interviewer | Full-stack |
| Add blacklist flag to candidates schema | Schema |
| Blacklist action on candidate profile | Full-stack |
| Block blacklisted candidates at intake | Backend |
| Add `is_paid_listing` to jobs schema | Schema |
| Paid/unpaid toggle in job form | Frontend |
| Jobs list advanced filters | Frontend |
| Applications list advanced filters | Frontend |
| Allow editing criteria on active jobs | Full-stack |
| Criteria change history view | Frontend |

**Total: 28 tickets**
