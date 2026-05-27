/**
 * JD_01 – JD_14 : Job Detail
 * Covers /jobs/[code] — applicant list, score display, status filter chips,
 * URL-driven filters, navigation, and empty state.
 * Uses seeded data: AIEN9X (Senior AI Engineer).
 */

import { test, expect } from "@playwright/test";
import { JobDetailPage } from "../pages/job-detail-page";

const JOB_CODE = "AIEN9X";
const JOB_TITLE = "Senior AI Engineer";

test.describe("Job Detail", () => {
  // JD_01 — Job detail page loads
  test("JD_01 job detail page loads with title, criteria summary, and applicant list", async ({ page }) => {
    const jobDetail = new JobDetailPage(page);
    await jobDetail.goto(JOB_CODE);

    await expect(jobDetail.jobTitle).toContainText(JOB_TITLE);
    await expect(jobDetail.applicantCount).toBeVisible();
    await expect(jobDetail.backLink).toBeVisible();
  });

  // JD_02 — Applicants sorted by match score descending
  test("JD_02 applicants sorted by match score descending (highest first)", async () => {
    test.skip(true, "TODO: implement");
  });

  // JD_03 — Applicant row shows name, score, status badge, timestamp
  test("JD_03 applicant row shows name, match score, status badge, and submission timestamp", async () => {
    test.skip(true, "TODO: implement");
  });

  // JD_04 — Match score color-coding
  test("JD_04 match score badges color-coded correctly (green/amber/red)", async () => {
    test.skip(true, "TODO: implement");
  });

  // JD_05 — Status filter chips render
  test("JD_05 status filter chips render for New, Reviewing, Shortlisted, Interview Scheduled, etc.", async () => {
    test.skip(true, "TODO: implement");
  });

  // JD_06 — Status filter shows only matching applicants
  test("JD_06 clicking Shortlisted chip shows only shortlisted applicants", async () => {
    test.skip(true, "TODO: implement");
  });

  // JD_07 — URL reflects selected status filter
  test("JD_07 clicking a status chip updates the URL with status param", async ({ page }) => {
    const jobDetail = new JobDetailPage(page);
    await jobDetail.goto(JOB_CODE);

    await jobDetail.statusFilter("shortlisted").click();
    await expect(page).toHaveURL(/status=shortlisted/);
  });

  // JD_08 — All chip clears filter and shows every applicant
  test("JD_08 All chip clears filter and shows every applicant", async ({ page }) => {
    await page.goto(`/jobs/${JOB_CODE}?status=shortlisted`);
    const jobDetail = new JobDetailPage(page);

    await jobDetail.statusFilter("all").click();
    await expect(page).not.toHaveURL(/status=/);
  });

  // JD_09 — Chip counts accurate
  test("JD_09 count on each status chip matches number of applicants shown when selected", async () => {
    test.skip(true, "TODO: implement");
  });

  // JD_11 — Clicking applicant row navigates to detail
  test("JD_11 clicking an applicant row navigates to /applications/[id]", async ({ page }) => {
    const jobDetail = new JobDetailPage(page);
    await jobDetail.goto(JOB_CODE);

    await jobDetail.applicantRow("Aisha").click();
    await expect(page).toHaveURL(/\/applications\//);
  });

  // JD_12 — Breadcrumb back to jobs list
  test("JD_12 back link navigates to /jobs", async ({ page }) => {
    const jobDetail = new JobDetailPage(page);
    await jobDetail.goto(JOB_CODE);

    await jobDetail.backLink.click();
    await expect(page).toHaveURL(/\/jobs$/);
  });

  // JD_13 — Empty state when no applicants for a status
  test("JD_13 empty state shown when selected status filter has zero applicants", async () => {
    test.skip(true, "TODO: implement");
  });

  // JD_14 — Edit Criteria button navigates to edit page
  test("JD_14 Edit Criteria button navigates to /jobs/[code]/edit", async () => {
    test.skip(true, "TODO: implement");
  });
});
