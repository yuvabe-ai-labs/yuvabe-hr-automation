# Yuvabe People — Phase 2 Scope

**Project:** Yuvabe People — HR Candidate Management System  
**Phase:** 2  
**Prepared by:** Arun  
**Date:** 2026-05-18

---

## Overview

Phase 1 delivered the core hiring workflow — job creation, AI candidate scoring, shortlisting, and export.

Phase 2 completes the hiring lifecycle. The focus is on giving HR more control over the pipeline (scheduling interviews, tracking candidates all the way to hire), separating what different users can see and do (role-based access), and adding the operational filters and workflow improvements the team asked for after Phase 1.

---

## What's Being Built

---

### 1. Job Draft & Publish Workflow

Jobs currently go live the moment they're saved. Phase 2 introduces a draft state so HR can prepare a posting, review it, and publish when ready.

**What changes:**
- Jobs can be saved as a draft before going live
- Draft jobs are not visible on the public careers page
- HR can publish a draft, unpublish an active job back to draft, or archive it
- Archived jobs can be cloned into a new draft (useful when rehiring for the same role)

---

### 2. Full Hiring Pipeline Stages

The current candidate statuses stop at "Shortlisted." Phase 2 extends the pipeline to track candidates all the way through to a hiring decision.

**New pipeline:**

New → Reviewing → Shortlisted → Interview Scheduled → Interviewed → Offered → Hired  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ Rejected (with reason)  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;→ Withdrawn

When rejecting a candidate, HR must provide a reason. The reason is saved on the candidate record and included in exports.

The candidate list can be filtered by any stage.

---

### 3. Interview Scheduling

HR can schedule interviews directly from the candidate profile. The goal is a Calendly-style experience — where the hiring manager sets their availability once, and interviews are booked against those open slots — rather than manually picking a time each time.

**What it does:**
- Hiring manager sets their available time windows (days, hours, buffer between slots)
- HR selects a candidate and picks from the manager's open slots to book the interview
- The candidate automatically receives a calendar invite by email (works with Gmail and Outlook)
- HR can reschedule or cancel — the candidate gets an updated or cancellation invite
- The candidate's status automatically moves to "Interview Scheduled" when booked

> **Note:** The exact UX for how hiring managers manage their availability — whether it's a recurring weekly schedule, a one-time block, or something else — needs to be ideated and designed before implementation begins. The reference model is Calendly's approach to time control.

---

### 4. Role-Based Access (RBAC)

Currently the system has a single shared login. Phase 2 introduces proper user accounts with three roles.

| Role | Access |
|---|---|
| **Admin** | Full access — manage jobs, candidates, users, and all settings |
| **Hiring Manager** | Can view and manage only the jobs assigned to them and their candidates |
| **Basic Viewer** | Read-only access across all jobs and candidates |

**What's included:**
- Each user has their own login (email + password)
- Admins can invite new users and assign roles
- Hiring Managers are assigned to specific jobs — they only see what's relevant to them
- The system enforces permissions automatically (no manual workarounds needed)

---

### 5. Advanced Filters & Sorting

Phase 1 filters covered status, search, and score. Phase 2 adds richer filtering and sorting across both jobs and candidates.

**Jobs list — new filters:**
- Department, Location, Job Type, Date Posted range

**Jobs list — sorting:**
- Posted date (newest first / oldest first)
- Number of applicants (most / least)

**Candidates list — new filters:**
- Date Applied range, Location, Years of Experience, Assigned Interviewer

**Candidates list — sorting:**
- Date applied (newest first / oldest first)
- Match score (highest / lowest)

All filters and sort state are reflected in the URL so pages can be shared or bookmarked.

---

## Summary

| Feature | What it delivers |
|---|---|
| Job Draft & Publish | Prepare postings before going live; clone past roles |
| Full Hiring Pipeline | Track candidates from application to hire/reject (with rejection reason) |
| Interview Scheduling | Calendly-style availability + calendar invites to candidates |
| Role-Based Access | Separate logins and permissions per user role |
| Advanced Filters & Sorting | Filter and sort jobs and candidates by more dimensions |
