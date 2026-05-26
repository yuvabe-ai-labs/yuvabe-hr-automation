# Interview Scheduling — Design & Architecture

**Feature:** Phase 2 — Interview Scheduling  
**Project:** Yuvabe People (HR Candidate Management System)  
**Author:** Arun  
**Date:** 2026-05-18  
**Status:** Design / Ideation

---

## 1. Context & Problem

HR needs to schedule interviews with shortlisted candidates without leaving the ATS. Currently there is no way to do this — teams rely on email threads and manual calendar invites.

The goal is a **self-contained Calendly-style system**:
- Hiring managers set their availability once, in-app
- HR books from those open slots — no back-and-forth
- Candidate receives a calendar invite automatically via email

**Constraints confirmed:**
- No Google Calendar API / OAuth (explicitly out of scope)
- No candidate self-booking link (HR picks on behalf of candidate)
- Email delivery via Resend + `.ics` attachment
- Must work with Gmail and Outlook (standard `.ics` support)

**Current codebase state:**
- `interviews` table exists in Supabase with Google Calendar fields (`google_event_id`, `google_meet_link`) — these need to be removed
- No interviews service, hooks, UI, or API routes exist yet (greenfield)
- No `/settings/` pages exist yet
- RBAC (users table) is being built in Phase 2 — interviews must account for `user_id` on availability
- Architecture is mid-refactor: new code must follow target layered pattern (repo → service → hook → UI)

---

## 2. Actor Model

| Actor | Role |
|---|---|
| **Hiring Manager** | Sets their weekly availability once in `/settings/availability`. Does not book — just configures open time. |
| **HR / Admin** | Books interviews by picking from the manager's open slots. Manages reschedules and cancellations. |
| **Candidate** | Receives `.ics` email invite. Does not interact with the system directly for scheduling. |

---

## 3. Key Design Decisions

---

### Decision A — How availability is modelled

Three proposals considered:

#### Proposal A1: Weekly recurring template (Recommended)
The manager defines a weekly schedule that repeats indefinitely. Days, hours, and slot settings are set once.

```
Monday    09:00 – 17:00
Tuesday   09:00 – 17:00
Wednesday OFF
Thursday  10:00 – 16:00
Friday    09:00 – 13:00

Slot duration: 60 min
Buffer:        15 min
Timezone:      Asia/Kolkata
```

The system generates open slots from this template for the next N days, then subtracts already-booked interviews.

**Pros:** One-time setup, low maintenance, closest to Calendly's model.  
**Cons:** Doesn't reflect ad-hoc conflicts (can be patched with overrides — see Decision B).

---

#### Proposal A2: Manual slot entry
Manager creates individual interview slots one by one: "I'm free on May 20, 10:00–11:00".

**Pros:** Simple data model, exact control.  
**Cons:** High friction — manager must add slots manually before every hiring cycle. Not scalable.

---

#### Proposal A3: Per-week availability blocks
Manager sets availability week-by-week, not as a repeating rule.

**Pros:** More accurate, can vary each week.  
**Cons:** Requires weekly maintenance. Manager must remember to update before each week. Higher operational burden.

**→ Decision: Proposal A1 (weekly recurring template).** Matches Calendly's core model, lowest ongoing maintenance, can be extended with date overrides.

---

### Decision B — Date overrides (blocking specific dates)

The weekly template covers recurring availability. Overrides handle exceptions.

#### Proposal B1: Block specific dates (Recommended)
Manager marks specific dates as unavailable (vacation, public holiday, all-day training). The slot generator skips any date in the blocked list.

```
Blocked: 2026-05-19 (reason: "Team offsite")
Blocked: 2026-05-25 (reason: "Public holiday")
```

#### Proposal B2: Custom day overrides
Manager can override any individual day's hours: "On May 20, I'm available 14:00–16:00 only instead of the usual 09:00–17:00."

**Pros of B2:** More precise. **Cons:** More complex UI and data model.

**→ Decision: Proposal B1 (block/unblock dates only)** for Phase 2. Custom day overrides can come in Phase 3.

---

### Decision C — Availability UI layout

#### Proposal C1: Visual day/time grid
A 7-column × time-row grid (like Calendly's setup). Click cells to toggle availability.

```
        Mon   Tue   Wed   Thu   Fri   Sat   Sun
09:00  [ ON ] [ ON ] [OFF] [ ON ] [ ON ] [OFF] [OFF]
10:00  [ ON ] [ ON ] [OFF] [ ON ] [ ON ] [OFF] [OFF]
...
```

**Pros:** Intuitive, visual, handles per-hour granularity.  
**Cons:** Complex component to build. Overkill if we only need day-level + hour range.

---

#### Proposal C2: Day checkboxes + time range inputs (Recommended)
Each day is a row: checkbox to enable/disable, then start time + end time inputs.

```
[✓] Monday     10:00 AM  →  06:00 PM
[✓] Tuesday    10:00 AM  →  06:00 PM
[ ] Wednesday  ──────────────────────
[✓] Thursday   10:00 AM  →  06:00 PM
[✓] Friday     10:00 AM  →  02:00 PM
[ ] Saturday   ──────────────────────
[ ] Sunday     ──────────────────────

Slot duration:  [60 min ▼]
Buffer:         [15 min ▼]
Timezone:       [Asia/Kolkata ▼]
```

**Pros:** Simple to build, covers all real use cases, easy to understand.  
**Cons:** Cannot set different hours per time-of-day block within a day (morning + afternoon with a gap).

---

#### Proposal C3: Add-slot pattern
Manager adds individual availability windows. "Add slot: Thursday 10:00–12:00". No repeating template — just a list of named windows.

**Pros:** Most flexible.  
**Cons:** Highest setup friction. Not repeating — manager must re-add for each week.

**→ Decision: Proposal C2 (day rows + time range).** Best balance of simplicity and usability for Phase 2.

---

### Decision D — Timezone handling strategy

Interviews involve at least three timezones: manager's timezone, HR's timezone, and candidate's timezone.

#### Proposal D1: Store in UTC, display in each actor's timezone (Recommended)
- All times stored as UTC in the DB
- Manager sets their timezone once in the availability settings
- HR sees slots in their own timezone (from browser)
- Candidate receives `.ics` with the interview time in UTC; their calendar app converts to local time

This is the standard approach for any multi-timezone scheduling system.

#### Proposal D2: Store in manager's timezone
- Store times as-is in the manager's timezone
- Convert only at display time

**Cons:** Fragile if the manager ever changes timezone. DST transitions cause ambiguous times.

**→ Decision: Proposal D1.** Always store UTC, convert on display.

---

### Decision E — Where to surface the interview UI on the candidate detail page

#### Proposal E1: Section on the existing candidate detail page (Recommended)
Add an "Interviews" section at the bottom of `app/applications/[id]/page.tsx`. Schedule button is inline. No navigation required.

```
──────────────────────────────────
Interviews
──────────────────────────────────
No interviews scheduled yet.
[Schedule Interview]
```

After scheduling:
```
──────────────────────────────────
Interviews
──────────────────────────────────
[●] May 25, 2026 · 10:00 AM IST · 60 min
    With: Priya (Hiring Manager)
    Location: Google Meet  ↗
    [Reschedule]  [Cancel]
```

#### Proposal E2: Separate route `/applications/[id]/interviews`
A dedicated sub-page.

**Cons:** Extra navigation step, less contextual — HR needs to leave the candidate profile to manage interviews.

**→ Decision: Proposal E1 (inline section on detail page).**

---

## 4. Database Schema

### 4.1 Changes to existing `interviews` table

**Remove:**
- `google_event_id` (string)
- `google_meet_link` (string)

**Add:**
- `location` (text, nullable) — physical address or "Google Meet", "Zoom", etc.
- `meeting_link` (text, nullable) — plain URL
- `interviewer_id` (uuid, FK → users) — who is conducting the interview
- `interviewer_name` (text) — denormalized snapshot for display

**Keep as-is:**
- `id`, `application_id`, `candidate_id`, `candidate_name`, `candidate_email`
- `job_id`, `job_code`, `job_title`
- `scheduled_at` (stored as UTC ISO 8601)
- `duration_minutes`
- `status` (string — see interview status enum below)
- `timezone` — the timezone context the interview was scheduled in
- `notes`
- `created_at`

**Interview status enum:**
```
pending → scheduled → completed → cancelled | rescheduled
```

**Migration file:** `supabase/migrations/[timestamp]_update_interviews_table.sql`

---

### 4.2 New: `interviewer_availability` table

Stores the recurring weekly availability template per hiring manager.

```sql
CREATE TABLE interviewer_availability (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week     int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
                  -- 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  start_time      time NOT NULL,  -- e.g., 09:00:00
  end_time        time NOT NULL,  -- e.g., 17:00:00
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, day_of_week)
);

-- Slot settings are per-user, not per-day
-- Stored in a separate settings record
```

**Note:** `slot_duration_minutes` and `buffer_minutes` are stored on a `user_scheduling_settings` record (one per user), not on every availability row. This avoids repeating the same values 5–7 times.

---

### 4.3 New: `user_scheduling_settings` table

Per-user scheduling preferences.

```sql
CREATE TABLE user_scheduling_settings (
  user_id              uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  timezone             text NOT NULL DEFAULT 'UTC',
  slot_duration_minutes int NOT NULL DEFAULT 60,
  buffer_minutes        int NOT NULL DEFAULT 15,
  booking_window_days   int NOT NULL DEFAULT 30,
                        -- How far in future HR can book
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);
```

---

### 4.4 New: `availability_overrides` table

Blocks specific dates for a hiring manager (vacation, holiday, out-of-office).

```sql
CREATE TABLE availability_overrides (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date        date NOT NULL,
  is_blocked  boolean NOT NULL DEFAULT true,
  reason      text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
```

---

### 4.5 Schema relationships

```
users  1 ──< interviewer_availability
users  1 ──  user_scheduling_settings (1:1)
users  1 ──< availability_overrides
users  1 ──< interviews  (via interviewer_id)
applications  1 ──< interviews
```

---

## 5. API Design

All routes are under `app/api/`.

---

### 5.1 Availability routes (hiring manager manages their schedule)

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/availability/[userId]` | Get a user's full availability template + settings |
| `PUT` | `/api/availability/[userId]` | Replace the full availability template (all 7 days) |
| `GET` | `/api/availability/[userId]/slots` | Get open slots for a date range (query: `from`, `to`) |
| `GET` | `/api/availability/[userId]/overrides` | List date overrides |
| `POST` | `/api/availability/[userId]/overrides` | Add a date override (block a date) |
| `DELETE` | `/api/availability/[userId]/overrides/[id]` | Remove a date override (unblock) |

**`GET /api/availability/[userId]/slots` query params:**
```
from=2026-05-20        (required, ISO date)
to=2026-06-20          (required, ISO date, max 90 days out)
duration=60            (optional, override slot duration)
```

**Response — slot list:**
```json
{
  "slots": [
    {
      "start": "2026-05-20T04:30:00Z",
      "end": "2026-05-20T05:30:00Z",
      "startLocal": "2026-05-20T10:00:00+05:30",
      "endLocal": "2026-05-20T11:00:00+05:30",
      "timezone": "Asia/Kolkata"
    }
  ]
}
```

---

### 5.2 Interview routes

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/applications/[id]/interviews` | Schedule a new interview |
| `GET` | `/api/applications/[id]/interviews` | List interviews for an application |
| `PATCH` | `/api/interviews/[id]` | Update / reschedule an interview |
| `DELETE` | `/api/interviews/[id]` | Cancel an interview |

**`POST /api/applications/[id]/interviews` body:**
```json
{
  "interviewerId": "uuid",
  "scheduledAt": "2026-05-20T04:30:00Z",
  "durationMinutes": 60,
  "timezone": "Asia/Kolkata",
  "location": "Yuvabe Office, Floor 3",
  "meetingLink": "https://meet.google.com/abc-defg",
  "notes": "Please bring your portfolio."
}
```

**On create:**
1. Create `interviews` record
2. Auto-advance application status to `interview_scheduled`
3. Send confirmation email + `.ics` to candidate via Resend

**`PATCH /api/interviews/[id]` body (reschedule):**
```json
{
  "scheduledAt": "2026-05-22T05:30:00Z",
  "durationMinutes": 60,
  "timezone": "Asia/Kolkata",
  "location": "...",
  "notes": "..."
}
```

**On update:** Send new `.ics` with `SEQUENCE` incremented.

**`DELETE /api/interviews/[id]`:** Send `METHOD:CANCEL` `.ics` to candidate.

---

## 6. Slot Generation Algorithm

Pure TypeScript function — no external scheduling library needed.

```
Input:
  availability: DayAvailability[]     (from DB — the weekly template)
  overrides: AvailabilityOverride[]   (blocked dates)
  existingBookings: Interview[]       (already-scheduled interviews)
  settings: UserSchedulingSettings    (slot_duration, buffer, timezone)
  from: Date
  to: Date

Output:
  Slot[]  { start: Date, end: Date }

Algorithm:
  for each date D between from and to:
    1. dayOfWeek = D.getDay()
    2. Find availability rule for dayOfWeek
       → if none or !is_active → skip date
    3. Check overrides: if D is in blocked overrides → skip
    4. Generate candidate slots from start_time to end_time:
       slotStart = D at start_time (in manager's timezone, converted to UTC)
       while slotStart + duration <= D at end_time:
         slots.push({ start: slotStart, end: slotStart + duration })
         slotStart += duration + buffer
    5. For each candidate slot, check against existingBookings:
       conflict if: booking.start < slot.end AND booking.end > slot.start
       (add buffer on both sides of existing bookings)
       → remove conflicting slots
    6. Append remaining slots to result
  
  return result sorted by start time
```

**Libraries:**
- `date-fns` — `addMinutes`, `isSameDay`, `getDay`, `isWithinInterval`
- `date-fns-tz` — `fromZonedTime`, `toZonedTime`, `formatInTimeZone`

---

## 7. Email & .ics

### 7.1 Package
`ics` npm package — generates RFC 5545-compliant `.ics` files.

### 7.2 Events sent

| Trigger | Email type | .ics method |
|---|---|---|
| Interview scheduled | "Interview Confirmed" | `METHOD:REQUEST` |
| Interview rescheduled | "Interview Rescheduled" | `METHOD:REQUEST` + `SEQUENCE: N+1` |
| Interview cancelled | "Interview Cancelled" | `METHOD:CANCEL` |

### 7.3 .ics content
```
SUMMARY: Interview — {Job Title} at Yuvabe
DTSTART: {scheduled_at in UTC}
DTEND:   {scheduled_at + duration_minutes}
ORGANIZER: HR@yuvabe.com
ATTENDEE: {candidate_email}
LOCATION: {location or meeting_link}
DESCRIPTION: {notes}
```

### 7.4 Email template (Resend)
- Subject: `"Interview Confirmed: {Job Title} — {date} at {time} {tz}"`
- Body: HTML email with job title, date, time, duration, location, interviewer name, and notes
- Attachment: `.ics` file

### 7.5 Implementation location
`lib/emails/interview-invite.ts` — generates the `.ics` content and calls Resend.
Called from the interviews service, not directly from the API route.

---

## 8. Architecture — Layer by Layer

Following the target architecture in CLAUDE.md.

```
app/applications/[id]/page.tsx
  └── InterviewsSection component
        └── useInterviews hook  (features/interviews/hooks/)
              └── interviewsService  (services/interviews.service.ts)
                    └── interviewsRepository  (repositories/interviews.repository.ts)
                          └── getSupabasePeopleClient()

app/settings/availability/page.tsx
  └── AvailabilityForm component
        └── useAvailability hook  (features/availability/hooks/)
              └── availabilityService  (services/availability.service.ts)
                    └── availabilityRepository  (repositories/availability.repository.ts)

app/api/applications/[id]/interviews/route.ts
  └── interviewsService.schedule()

app/api/interviews/[id]/route.ts
  └── interviewsService.update() / cancel()

app/api/availability/[userId]/slots/route.ts
  └── availabilityService.getOpenSlots()
```

---

## 9. File Structure

New files to create:

```
repositories/
  interviews.repository.ts
  availability.repository.ts

services/
  interviews.service.ts
  availability.service.ts

features/
  interviews/
    hooks/
      use-interviews.ts          (list + get queries)
      use-schedule-interview.ts  (mutation)
      use-cancel-interview.ts    (mutation)
    types/
      interview.ts               (z.infer from schema)
  availability/
    hooks/
      use-availability.ts        (get availability + open slots)
      use-update-availability.ts (mutation)
    types/
      availability.ts

schemas/
  interview.schema.ts
  availability.schema.ts

lib/
  emails/
    interview-invite.ts          (ics generation + Resend call)

constants/
  query-keys.ts                  (add interviewKeys, availabilityKeys)

app/
  api/
    applications/[id]/interviews/
      route.ts                   (POST, GET)
    interviews/[id]/
      route.ts                   (PATCH, DELETE)
    availability/[userId]/
      route.ts                   (GET, PUT)
      slots/
        route.ts                 (GET)
      overrides/
        route.ts                 (GET, POST)
        [id]/
          route.ts               (DELETE)
  settings/
    availability/
      page.tsx                   (availability setup UI)
      _components/
        availability-form.tsx
        day-availability-row.tsx
        override-list.tsx
        block-date-modal.tsx
  applications/[id]/
    _components/
      interviews-section.tsx
      schedule-interview-modal.tsx
      interview-card.tsx
      slot-picker.tsx

supabase/
  migrations/
    [timestamp]_update_interviews_table.sql
    [timestamp]_create_interviewer_availability.sql
    [timestamp]_create_user_scheduling_settings.sql
    [timestamp]_create_availability_overrides.sql
```

---

## 10. UI/UX Flows

### 10.1 Manager availability setup — `/settings/availability`

```
┌─────────────────────────────────────────────────────────┐
│  Availability Settings                                   │
│  Set the times you're available for interviews.          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Weekly schedule                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │ [✓] Monday      [09:00 AM ▼] → [06:00 PM ▼]      │  │
│  │ [✓] Tuesday     [09:00 AM ▼] → [06:00 PM ▼]      │  │
│  │ [ ] Wednesday   ─────────── not available ──────  │  │
│  │ [✓] Thursday    [10:00 AM ▼] → [05:00 PM ▼]      │  │
│  │ [✓] Friday      [09:00 AM ▼] → [01:00 PM ▼]      │  │
│  │ [ ] Saturday    ─────────── not available ──────  │  │
│  │ [ ] Sunday      ─────────── not available ──────  │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  Interview settings                                      │
│  Slot duration   [60 min ▼]                             │
│  Buffer          [15 min ▼]  (gap between interviews)   │
│  Timezone        [Asia/Kolkata (IST) ▼]                 │
│                                                          │
│  Blocked dates                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  May 19 · Team offsite                    [Remove]│  │
│  │  May 25 · Public holiday                  [Remove]│  │
│  └───────────────────────────────────────────────────┘  │
│  [+ Block a date]                                        │
│                                                          │
│                              [Cancel]  [Save settings]  │
└─────────────────────────────────────────────────────────┘
```

---

### 10.2 HR booking flow — Schedule Interview modal

Triggered from the "Schedule Interview" button on the candidate detail page (visible when status is `shortlisted`).

```
┌──────────────────────────────────────────────────────────┐
│  Schedule Interview                              [✕]      │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Candidate    Ravi Kumar                                  │
│  Job          Senior Product Designer                     │
│                                                           │
│  Interviewer  [Priya Nair (Hiring Manager) ▼]            │
│                                                           │
│  Duration     [60 min ▼]                                  │
│                                                           │
│  ── Pick a date ─────────────────────────────────────── │
│                                                           │
│       May 2026                                            │
│  Mo Tu We Th Fr Sa Su                                     │
│              1  2  3                                      │
│   4  5  6  7  8  9 10                                     │
│  11 12 13 14 15 16 17                                     │
│  18 19 20 21 22 23 24   ← available days highlighted      │
│  25 26 27 28 29 30 31                                     │
│                                                           │
│  ── Available times on May 20 ──────────────────────── │
│                                                           │
│  [10:00 AM] [11:00 AM] [12:00 PM]                        │
│  [ 2:00 PM] [ 3:00 PM] [ 4:00 PM]                        │
│                                                           │
│  ── Details ────────────────────────────────────────── │
│                                                           │
│  Location        [                              ]         │
│  Meeting link    [                              ]         │
│  Notes           [                              ]         │
│                  [                              ]         │
│                                                           │
│                              [Cancel]  [Schedule →]       │
└──────────────────────────────────────────────────────────┘
```

---

### 10.3 Interview card on candidate profile

After scheduling, the interview appears inline in the "Interviews" section:

```
┌─────────────────────────────────────────────────────────┐
│  Interviews                                              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ● Scheduled                                             │
│  Wed, May 20, 2026 · 10:00 AM IST · 60 min             │
│  Interviewer: Priya Nair                                 │
│  Location: Yuvabe Office, Floor 3                        │
│  Notes: Please bring your portfolio.                     │
│                                                          │
│  [Reschedule]  [Cancel interview]                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

### 10.4 Cancel confirmation dialog

```
┌──────────────────────────────────────┐
│  Cancel interview?              [✕]  │
├──────────────────────────────────────┤
│                                      │
│  Ravi Kumar will receive a           │
│  cancellation email automatically.   │
│                                      │
│  [Keep interview]  [Yes, cancel]     │
└──────────────────────────────────────┘
```

---

## 11. Zod Schemas

```ts
// schemas/interview.schema.ts

export const InterviewStatusSchema = z.enum([
  'pending', 'scheduled', 'completed', 'cancelled', 'rescheduled'
])

export const ScheduleInterviewInputSchema = z.object({
  interviewerId:     z.string().uuid(),
  scheduledAt:       z.string().datetime(),  // UTC ISO 8601
  durationMinutes:   z.number().int().min(15).max(480),
  timezone:          z.string().min(1),
  location:          z.string().max(500).optional(),
  meetingLink:       z.string().url().optional(),
  notes:             z.string().max(2000).optional(),
})

export const InterviewSchema = ScheduleInterviewInputSchema.extend({
  id:                z.string().uuid(),
  applicationId:     z.string().uuid(),
  candidateId:       z.string().uuid(),
  candidateName:     z.string(),
  candidateEmail:    z.string().email(),
  jobId:             z.string().uuid(),
  jobCode:           z.string(),
  jobTitle:          z.string(),
  interviewerName:   z.string(),
  status:            InterviewStatusSchema,
  createdAt:         z.string().datetime(),
})

export type Interview = z.infer<typeof InterviewSchema>
export type ScheduleInterviewInput = z.infer<typeof ScheduleInterviewInputSchema>
```

```ts
// schemas/availability.schema.ts

export const DayAvailabilitySchema = z.object({
  dayOfWeek:  z.number().int().min(0).max(6),
  startTime:  z.string().regex(/^\d{2}:\d{2}$/),  // "09:00"
  endTime:    z.string().regex(/^\d{2}:\d{2}$/),
  isActive:   z.boolean(),
})

export const UserSchedulingSettingsSchema = z.object({
  userId:               z.string().uuid(),
  timezone:             z.string().min(1),
  slotDurationMinutes:  z.number().int().min(15).max(240),
  bufferMinutes:        z.number().int().min(0).max(120),
  bookingWindowDays:    z.number().int().min(1).max(90),
})

export const AvailabilityOverrideSchema = z.object({
  id:         z.string().uuid(),
  userId:     z.string().uuid(),
  date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isBlocked:  z.boolean(),
  reason:     z.string().optional(),
  createdAt:  z.string().datetime(),
})

export const OpenSlotSchema = z.object({
  start:      z.string().datetime(),  // UTC
  end:        z.string().datetime(),  // UTC
  startLocal: z.string(),             // ISO 8601 with offset
  endLocal:   z.string(),
  timezone:   z.string(),
})
```

---

## 12. Query Keys

```ts
// constants/query-keys.ts (additions)

export const interviewKeys = {
  all:    ['interviews'] as const,
  byApp:  (appId: string) => [...interviewKeys.all, 'app', appId] as const,
  detail: (id: string)   => [...interviewKeys.all, 'detail', id] as const,
}

export const availabilityKeys = {
  all:       ['availability'] as const,
  user:      (userId: string) => [...availabilityKeys.all, userId] as const,
  slots:     (userId: string, from: string, to: string) =>
               [...availabilityKeys.user(userId), 'slots', from, to] as const,
  overrides: (userId: string) =>
               [...availabilityKeys.user(userId), 'overrides'] as const,
}
```

---

## 13. Implementation Order (Tickets)

Dependencies flow downward — each block unblocks the next.

```
Block A — DB & Types (prerequisite for everything)
  ├── Migration: update interviews table (remove GCal fields, add location/meeting_link/interviewer_id)
  ├── Migration: create interviewer_availability
  ├── Migration: create user_scheduling_settings
  ├── Migration: create availability_overrides
  ├── Update integrations/database.types.ts
  └── Create schemas/interview.schema.ts + schemas/availability.schema.ts

Block B — Data layer (after A)
  ├── repositories/interviews.repository.ts
  ├── repositories/availability.repository.ts
  ├── services/interviews.service.ts
  └── services/availability.service.ts

Block C — Slot engine + Email (after B)
  ├── lib/scheduling/slot-generator.ts   (pure function, unit-testable)
  └── lib/emails/interview-invite.ts     (ics + Resend)

Block D — API routes (after B + C)
  ├── app/api/applications/[id]/interviews/route.ts
  ├── app/api/interviews/[id]/route.ts
  ├── app/api/availability/[userId]/route.ts
  ├── app/api/availability/[userId]/slots/route.ts
  └── app/api/availability/[userId]/overrides/route.ts

Block E — Hooks (after D)
  ├── constants/query-keys.ts (add interviewKeys + availabilityKeys)
  ├── features/interviews/hooks/use-interviews.ts
  ├── features/interviews/hooks/use-schedule-interview.ts
  ├── features/interviews/hooks/use-cancel-interview.ts
  ├── features/availability/hooks/use-availability.ts
  └── features/availability/hooks/use-update-availability.ts

Block F — UI (after E)
  ├── app/settings/availability/page.tsx
  ├── app/settings/availability/_components/availability-form.tsx
  ├── app/settings/availability/_components/day-availability-row.tsx
  ├── app/settings/availability/_components/override-list.tsx
  ├── app/settings/availability/_components/block-date-modal.tsx
  ├── app/applications/[id]/_components/interviews-section.tsx
  ├── app/applications/[id]/_components/interview-card.tsx
  ├── app/applications/[id]/_components/schedule-interview-modal.tsx
  └── app/applications/[id]/_components/slot-picker.tsx
```

**Total tickets: 29**  
(4 migrations + 2 schemas + 2 repos + 2 services + 1 slot engine + 1 email helper + 5 API routes + 1 query keys + 5 hooks + 9 UI components)

---

## 14. Open Questions (Business)

These need a decision before or during implementation:

| # | Question | Impact |
|---|---|---|
| 1 | When the hiring manager hasn't configured availability yet, what should HR see? Options: (a) disabled "Schedule" button with tooltip, (b) manual date/time picker as fallback | Affects schedule-interview-modal behavior |
| 2 | Can HR override the manager's availability and book any arbitrary time (e.g., manager is off Wednesday but needs a one-off)? | Affects slot picker — do we add a "Custom time" escape hatch? |
| 3 | Should the candidate receive an email when the interview is first scheduled, or only after HR explicitly confirms? (i.e., is "pending" a real state or does create go straight to "scheduled"?) | Affects interview status flow and email trigger |
| 4 | Does the interviewer (hiring manager) receive any notification when HR books a slot in their calendar? (Just the `.ics` to the candidate — or also one to the manager?) | Affects email sending in the service |
| 5 | What timezone should the slot picker show times in — HR's browser timezone or the manager's configured timezone? | Affects slot-picker UX, display conversion logic |

---

## 15. Dependencies to Install

```
ics           — .ics file generation
date-fns-tz   — timezone-aware date arithmetic (date-fns may already be installed)
```

Check `package.json` first — `date-fns` is likely already present. `ics` and `date-fns-tz` are likely new.

---

## 16. Verification Checklist

End-to-end test sequence before marking feature done:

- [ ] Manager opens `/settings/availability`, sets Mon–Fri 10am–6pm, slot 60 min, buffer 15 min, IST
- [ ] Manager blocks May 25 (holiday)
- [ ] HR opens a `shortlisted` candidate — "Schedule Interview" button is visible
- [ ] HR opens modal, selects manager — calendar shows available days (May 25 greyed out)
- [ ] HR picks May 20, 10:00 AM slot — slot list loads correctly
- [ ] HR fills location + meeting link + notes, confirms
- [ ] Application status updates to `interview_scheduled`
- [ ] Interview card appears on candidate detail page
- [ ] Candidate email arrives in inbox with correct details
- [ ] `.ics` opens in Google Calendar / Outlook and shows correct date/time
- [ ] HR clicks Reschedule, picks May 22 — new email arrives, original event updated in calendar
- [ ] HR clicks Cancel — cancellation email arrives, calendar event is removed
- [ ] Slot taken by first booking no longer appears for second candidate booking on same manager
