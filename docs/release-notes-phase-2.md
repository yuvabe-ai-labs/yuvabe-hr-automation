# Yuvabe People — Phase 2 Release Notes

**Project:** Yuvabe People — HR Candidate Management System
**Release:** Phase 2

---

## Overview

Phase 2 extends the core hiring workflow with multi-user role management, a structured job creation flow, advanced filtering controls, and a complete interview scheduling lifecycle.

**Primary objective:** Give each user type (Admin, Hiring Manager, Viewer) the right level of access, and support the full candidate journey from shortlisting through to interview scheduling with automated email notifications.

For reference, see the [Phase 1 Release Notes](https://docs.google.com/document/d/1aAs2M-6MwqbH5at3Z2BWlJzw2xhQ1gn_mt-5t1iBa94/edit?tab=t.0).

> **Note on user accounts:** User accounts (Hiring Managers and Viewers) will be created from the backend once the list of users to be onboarded is received. Please share the names, email addresses, and roles of all users who need access.

---

## Access

**App URL:** [https://yuvabe-ats.vercel.app/jobs](https://yuvabe-ats.vercel.app/jobs)

**Role-based Login Credentials**

| Role | Email | Password |
|---|---|---|
| **Admin** | hr@yuvabe.com | hr@yuvabe |
| **Manager** | manager@yuvabe.com | *(set during invite)* |
| **Viewer** | viewer@yuvabe.com | *(set during invite)* |

---

## Features Delivered

---

### 1. Role-Based Access Control (RBAC)

Three user roles with distinct access levels across the entire application.

#### Admin
Full access to all features:
- Create, publish, and archive job postings
- Assign a Hiring Manager to any job
- Save jobs as drafts before publishing
- Change the status of any application
- Schedule, reschedule, and cancel interviews for any candidate
- Add, edit, and delete review notes on any application
- View and export all applications across all jobs

#### Hiring Manager
Scoped to their assigned jobs only:
- View job listings and applicant lists for jobs assigned to them
- Change the status of applications on their jobs (Reviewing, Shortlisted, Rejected, etc.)
- Schedule, reschedule, and cancel interviews for candidates on their jobs
- Add, edit, and delete review notes on their applications
- Cannot create new jobs or access jobs assigned to other managers

#### Viewer
Read-only access across the entire app:
- Browse all jobs and applicants
- Use all filter and search controls
- Export applications to CSV or Excel
- Read review notes on any candidate
- Cannot change any status, add notes, or schedule interviews

---

### 2. New Job Creation Flow (Admin Only)

A structured two-stage flow for creating and publishing job postings.

#### Save as Draft
- Upload a JD (PDF, DOCX, or text) — AI extracts the job title, criteria, department, location, type, and level
- Review and adjust extracted criteria before saving
- Click **"Save as Draft"** to save without publishing — the job is visible only inside the app, not on the public careers page
- Draft jobs appear under a dedicated **"Drafts"** tab on the Jobs list

#### Publish with Preview
- From the job creation page, click **"Publish"** to open a full job preview before it goes live
- The preview shows exactly how the job will appear — title, department, location, responsibilities, requirements, benefits, and all criteria
- Confirm to publish — the job moves to the **Active** tab and appears on [yuvabestudios.com/careers](https://www.yuvabestudios.com/careers)

#### Promote a Draft
- From the **Drafts** tab, open the overflow menu on any draft job
- Click **"Publish"** to open the preview dialog and confirm before going live

#### Assign Hiring Manager
- During job creation, select a Hiring Manager from the dropdown
- Only that manager can see and manage this job's applicants once assigned

**Job status lifecycle:** Draft → Active → Archived

---

### 3. Advanced Filter Features

#### Jobs List Filters
Available from the filter icon on the Jobs page:

| Filter | Options |
|---|---|
| Job Type | Full-time, Part-time, Contract, Internship |
| Date Posted | Date range (From / To) |
| Sort | Newest first / Oldest first |
| Hiring Manager | Filter by assigned manager *(admin only)* |

All filters are URL-based — they persist on page refresh and can be shared as a link.

#### Applications List Filters
Available from the filter icon on the All Applications page:

| Filter | Options |
|---|---|
| Status | All, New, Reviewing, Shortlisted, Interview, Rejected |
| Minimum Score | Slider (0–100) |
| Date Applied | Date range (From / To) |
| Years of Experience | Any, 0–2, 3–5, 6–10, 10+ |
| Top Candidates | Show top 10, 15, or 20 |
| Sort | Newest first / Oldest first |
| Hiring Manager | Filter by manager *(admin only)* |
| Search | Search by candidate name |

Export remains available for all roles (CSV or Excel) using the existing selection flow.

---

### 4. Interview Scheduling

A complete interview workflow from the candidate detail page.

#### Schedule an Interview
- On any shortlisted candidate's profile, click **"Schedule Interview"**
- Fill in the interview details:
  - Title (e.g. "Round 1: Technical Interview")
  - Date and time
  - Duration (15 min – 8 hours)
  - Timezone
  - Format: Video call (with meeting link) or In-person (with venue)
  - Interviewer name
  - Preparation notes (optional)
- On save: the application status automatically advances to **Interview Scheduled**
- A confirmation email is sent to the candidate with all interview details

#### Reschedule an Interview
- On the interview card, click **"Reschedule"**
- Update date, time, duration, or any other field
- Candidate receives an updated email notification with the new schedule

#### Cancel an Interview
- On the interview card, click **"Cancel"**
- The interview is marked as cancelled on the candidate's profile
- A cancellation email is sent to the candidate

#### Email Notifications
All three actions trigger automated emails to the candidate via Resend:

| Trigger | Email Sent |
|---|---|
| Interview scheduled | Confirmation with full interview details |
| Interview rescheduled | Updated schedule with new date/time |
| Interview cancelled | Cancellation notice |

Emails include: interview title, date and time in the candidate's timezone, duration, interviewer name, location or meeting link, and preparation notes.

#### Interviews Overview
The **Interviews** page (`/interviews`) shows all upcoming scheduled interviews at a glance — candidate name, role, date, time, and interviewer — with a direct link to each candidate's profile.

---

## HR Workflow (Phase 2)

1. **Admin creates a job** — uploads JD, reviews AI-extracted criteria, saves as Draft or publishes directly
2. **Admin assigns a Hiring Manager** to the job
3. **Candidates apply** via the public careers page
4. **AI scores and ranks** resumes automatically
5. **Manager reviews** candidates on their assigned job — moves to Reviewing or Shortlisted
6. **Manager (or Admin) schedules** an interview — candidate receives a confirmation email
7. **After the interview**, update the candidate to Interviewed → Hired or Rejected
8. **Viewer** can browse all candidates and export at any stage

---

## Role Capabilities Summary

| Action | Admin | Manager | Viewer |
|---|---|---|---|
| Create / publish a job | ✅ | ✗ | ✗ |
| Save job as draft | ✅ | ✗ | ✗ |
| Assign hiring manager | ✅ | ✗ | ✗ |
| View all jobs | ✅ | Own jobs only | ✅ |
| Change application status | ✅ | Own jobs only | ✗ |
| Schedule / reschedule / cancel interview | ✅ | Own jobs only | ✗ |
| Add / edit / delete review notes | ✅ | Own jobs only | ✗ |
| Read review notes | ✅ | ✅ | ✅ |
| Filter and search | ✅ | ✅ | ✅ |
| Export applications | ✅ | ✅ | ✅ |

---

## Loom Walkthroughs

| Admin |  |  |
| :---- | :---- | :---- |
| **Topic** | **Description** | **Link** |
| Job creation and assigning to manager | New job creation workflow with manager assigning and save as draft | [Watch](https://www.loom.com/share/f1e182cdd82b4dd79ba54b106fb71922) |
| Listing of Jobs in archive, draft, active tabs | Feature in job listing page with new filters | [Watch](https://www.loom.com/share/941d1d7ea0b04a5e9bc0caea22ceedb3) |
| Managing applications, status updates | Management of received applications by changing their status | [Watch](https://www.loom.com/share/3dcfb35241dd4a8b80961f3d7c856b88) |
| Interview scheduling for applications | New interview scheduling workflow — send mail while scheduling, rescheduling and cancelling | [Watch](https://www.loom.com/share/b1a4245d363941a4b35588d7056dde16) |
| Exporting the applications | Exporting received applications in bulk as CSV or Excel | [Watch](https://www.loom.com/share/2819b528512c4064a86771ebc1e10c8f) |

| Manager |  |  |
| :---- | :---- | :---- |
| **Topic** | **Description** | **Link** |
| Viewing assigned jobs | Navigating the jobs listing page scoped to the manager's assigned jobs only | [Watch](https://www.loom.com/share/abdf721bf68f4bf3b81ef2c98580b1ab) |
| Managing applications, status updates | Reviewing candidates and updating application statuses on assigned jobs | [Watch](https://www.loom.com/share/81818ca22b0d42f1bac1feb91f55f696) |
| Interview scheduling for applications | Scheduling, rescheduling, and cancelling interviews for candidates on assigned jobs | [Watch](https://www.loom.com/share/25b5415b3b2c46a5909750aaf3db3db8) |
| Exporting the applications | Exporting received applications in bulk as CSV or Excel | [Watch](https://www.loom.com/share/2819b528512c4064a86771ebc1e10c8f) |

| Viewer |  |  |
| :---- | :---- | :---- |
| **Topic** | **Description** | **Link** |
| Browsing jobs and applications with filters | Read-only view of all jobs and applicants — using filters, search, and score controls | [Watch](https://www.loom.com/share/56b3ee94286344a99b8c259a54787add) |
| Exporting the applications | Exporting received applications in bulk as CSV or Excel | [Watch](https://www.loom.com/share/2819b528512c4064a86771ebc1e10c8f) |

---

## Notes

Phase 2 builds directly on the Phase 1 candidate ranking and export workflow. All Phase 1 features (AI scoring, match breakdown, shortlisting, notes, export) remain unchanged. Phase 2 adds role-based access, a draft/publish job flow, expanded filters, and the full interview scheduling lifecycle.

---
