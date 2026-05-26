# Yuvabe People — Phase 3 Scope

**Project:** Yuvabe People — HR Candidate Management System  
**Phase:** 3  
**Prepared by:** Arun  
**Date:** 2026-05-18

---

## Overview

Phase 3 builds on the full hiring lifecycle delivered in Phases 1 and 2. The focus is on operational efficiency — tools that reduce manual effort for HR when managing large applicant pools, and tighter control over job listings and data quality.

---

## What's Being Built

---

### 1. Bulk Actions

HR often needs to process many candidates at once. Phase 3 adds bulk operations across the candidate and job lists.

**What HR can do in bulk:**
- Move selected candidates to a new pipeline status (e.g. shortlist 15 at once)
- Reject multiple candidates with a single action (with confirmation and rejection reason)
- Archive multiple jobs at once from the jobs list
- Assign an interviewer to multiple candidates at once

---

### 2. Candidate Blacklist

If a candidate should not be considered for any future role at Yuvabe, HR can flag them at a global level.

**How it works:**
- Blacklist a candidate from their profile, with an optional reason
- Blacklisted candidates are flagged visually if they apply again in the future
- Any new application from a blacklisted candidate is flagged for HR review rather than entering the normal pipeline
- Admin-only action; fully reversible

---

### 3. Paid / Unpaid Job Flag

LinkedIn allows one free active job posting — additional postings are paid. HR needs to track which jobs are intended for paid promotion to manage costs.

**What changes:**
- Each job has a "LinkedIn Paid Listing" toggle (on/off, default off)
- The jobs list shows a Free or Paid badge per job
- A warning is surfaced if more than one active job is set to free (exceeding LinkedIn's free tier limit)

---

### 4. Criteria Editing & Audit Trail

Once a job's criteria are saved today, they cannot be changed — HR flagged this as a blocking issue in Phase 1 feedback. Phase 3 fixes this and adds a full history of changes.

**What changes:**
- Job criteria can be edited on any active job (admin only)
- Every edit is logged: who changed it, when, and what was changed (before vs. after)
- The change history is visible on the job detail page
- Optional: a change note can be added explaining why criteria were updated

---

## Summary

| Feature | What it delivers |
|---|---|
| Bulk Actions | Process many candidates or jobs in one action |
| Candidate Blacklist | Global do-not-contact flag at the candidate level |
| Paid / Unpaid Job Flag | Track LinkedIn free vs. paid posting slots |
| Criteria Editing | Edit job criteria after creation, with full audit trail |
