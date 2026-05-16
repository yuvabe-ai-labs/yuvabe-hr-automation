# Yuvabe People — Phase 1 Release Notes

**Project:** Yuvabe People — HR Candidate Management System
**Release:** Phase 1

---

## Overview

Phase 1 delivers the core HR hiring workflow — from creating a job opening to AI-ranked candidate shortlisting and export.

**Primary objective:** Get the top-ranked CVs matched and scored per role, so HR can focus review time on the best candidates.

---

## Access

**App URL:** [https://yuvabe-ats.vercel.app/jobs](https://yuvabe-ats.vercel.app/jobs)

**Login Credentials**

| | |
|---|---|
| **Email** | hr@yuvabe.com |
| **Password** | hr@yuvabe |

---

## Features Delivered

### 1. Job Management

HR can:

- Create a job posting by uploading a JD (PDF, DOCX, or text) — the system extracts criteria automatically via AI
- Review and adjust criterion importance (Must / Strong / Nice to Have) before saving
- View all active job listings with applicant counts
- Open any job to see its full applicant list

Published jobs appear automatically on the public careers page at **[yuvabestudios.com/careers](https://www.yuvabestudios.com/careers)**. Only active jobs are listed — archiving a job removes it from the page.

---

### 2. AI Candidate Matching

For each application, the system automatically:

- Scores the resume against all job criteria (0–100 overall)
- Breaks down scores per criterion with evidence quoted from the resume
- Indicates match level per criterion: Yes / Partial / No
- Ranks candidates by score (high to low)
- Provides quick views for Top 10 / Top 15 / Top 20 candidates

Score bands: **High ≥ 75** · **Mid 50–74** · **Low < 50**

---

### 3. Export

Export applicants to **CSV or Excel**, including:

- Candidate name, email, phone, location, years of experience
- Match score
- Resume URL, LinkedIn, GitHub, Portfolio
- Review notes
- Date applied

Supports exporting selected candidates or all visible candidates.

---

### 4. Missing Information Indicators

Candidate profiles flag missing fields:

- No resume uploaded
- No phone / location
- No LinkedIn / GitHub / Portfolio

Missing fields are visually highlighted and affect score confidence.

---

### 5. Shortlisting Workflow

HR can move candidates through statuses:

**New → Reviewing → Shortlisted → Rejected**

- Update status from the candidate detail page
- Filter the applicant list by any status
- Track progress across the hiring pipeline

---

### 6. Review Notes

On any candidate's profile, HR can:

- Add a review note (up to 4,000 characters)
- Edit or delete existing notes
- See author and timestamp on each note
- Sort notes newest or oldest first

Notes are included in CSV / Excel exports.

---

## HR Workflow

1. Create a job posting (upload JD → AI extracts criteria)
2. Candidates submit applications
3. AI scores and ranks resumes automatically
4. HR reviews ranked candidates and score breakdowns
5. Add review notes on candidates
6. Move candidates to Shortlisted (or Rejected)
7. Export shortlisted candidates for interview coordination

---

## Loom Walkthroughs

| # | Topic | Link |
|---|---|---|
| 1 | Creating a New Job | [Watch](https://www.loom.com/share/f1e182cdd82b4dd79ba54b106fb71922) |
| 2 | Job Listing — Active & Archive Tab | [Watch](https://www.loom.com/share/ef1b0c7753a3449b99569c34fb50653d) |
| 3 | Listing Applicants & Changing Status | [Watch](https://www.loom.com/share/a6ed64bef623495f9e3fa7e2623f54b3) |
| 4 | Extracting Applicants | [Watch](https://www.loom.com/share/25d56d27541149cda8e9f703c3a0deba) |
| 5 | Candidate Application (from Yuvabe Studios) | [Watch](https://www.loom.com/share/cafd492efa834cae869778a6c00784bb) |

---

## Notes

This is the Phase 1 release covering the foundational candidate management workflow. Additional features and workflow improvements are planned for upcoming phases.

---

---

## Email to HR Team

**To:** Hari, Sharath
**Subject:** Yuvabe People — Phase 1 Release

---

Hi Hari and Sharath,

Sharing the Phase 1 release for **Yuvabe People — HR Candidate Management System**.

Please find the release notes and walkthrough document below:
[Yuvabe People — Phase 1 Release Notes](https://docs.google.com/document/d/1aAs2M-6MwqbH5at3Z2BWlJzw2xhQ1gn_mt-5t1iBa94/edit?usp=sharing)

**App URL:** [https://yuvabe-ats.vercel.app/jobs](https://yuvabe-ats.vercel.app/jobs)

**Login Credentials**

- Email: hr@yuvabe.com
- Password: hr@yuvabe

The document includes:

- Features delivered in Phase 1
- HR workflow overview
- Loom walkthrough videos:
  - Creating a New Job
  - Job Listing — Active & Archive Tab
  - Listing Applicants & Changing Status
  - Extracting Applicants
  - Candidate Application (from Yuvabe Studios)

Please review and share your feedback.

Thanks,
Arun
