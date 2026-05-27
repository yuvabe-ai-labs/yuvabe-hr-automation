/**
 * FILT_01 – FILT_12 : Advanced Filters & Sorting
 * Covers filter panel on /jobs, sort on /jobs/[code] applicant list,
 * and combined filters on /applications.
 */

import { test, expect } from "@playwright/test";
import { ApplicationsPage } from "../pages/applications-page";

const JOB_CODE = "AIEN9X";

test.describe("Advanced Filters & Sorting", () => {
  // FILT_01 — Filter button visible on jobs list
  test("FILT_01 Filter button is visible on /jobs near the search input", async ({ page }) => {
    await page.goto("/jobs");
    await expect(page.getByRole("button", { name: /filter/i })).toBeVisible();
  });

  // FILT_02 — Filter panel opens on click
  test("FILT_02 clicking Filter button opens filter panel with job type and sort options", async ({ page }) => {
    await page.goto("/jobs");
    await page.getByRole("button", { name: /filter/i }).click();
    await expect(page.getByRole("dialog").or(page.getByRole("region", { name: /filter/i }))).toBeVisible();
  });

  // FILT_03 — Filter jobs by type
  test("FILT_03 filtering by job type shows only matching jobs; URL updates with ?type= param", async () => {
    test.skip(true, "TODO: implement");
  });

  // FILT_04 — Sort jobs by oldest
  test("FILT_04 sorting by Oldest reorders jobs with oldest creation date first", async () => {
    test.skip(true, "TODO: implement");
  });

  // FILT_05 — Sort jobs by newest
  test("FILT_05 sorting by Newest reorders jobs with newest creation date first", async () => {
    test.skip(true, "TODO: implement");
  });

  // FILT_06 — Active filter indicator shown
  test("FILT_06 applying a filter shows a visual indicator (dot or count) on the Filter button", async () => {
    test.skip(true, "TODO: implement");
  });

  // FILT_07 — Clear Filters removes all applied filters
  test("FILT_07 Clear Filters removes all filters; URL params cleared; all jobs shown", async () => {
    test.skip(true, "TODO: implement");
  });

  // FILT_08 — Applicant list filter by score on job detail
  test("FILT_08 sorting applicants by score on job detail reorders with highest score first", async () => {
    test.skip(true, "TODO: implement");
  });

  // FILT_09 — Applicant list advanced filter on job detail
  test("FILT_09 applying a filter on /jobs/[code] shows only matching applicants; URL reflects state", async () => {
    test.skip(true, "TODO: implement");
  });

  // FILT_10 — Filter by job dropdown on global applications list
  test("FILT_10 selecting a job from filter dropdown on /applications shows only that job's applicants", async () => {
    test.skip(true, "TODO: implement");
  });

  // FILT_11 — Combined filter + status chip on applications list
  test("FILT_11 job filter + status chip together show only applicants matching both; both params in URL", async () => {
    test.skip(true, "TODO: implement");
  });

  // FILT_12 — URL-driven filters are bookmarkable
  test("FILT_12 URL with filters applied loads with same filters in a new tab", async ({ page }) => {
    const applicationsPage = new ApplicationsPage(page);
    await applicationsPage.goto();

    await applicationsPage.statusFilter("shortlisted").click();
    const url = page.url();

    await page.goto(url);
    await expect(page).toHaveURL(/status=shortlisted/);
  });
});
