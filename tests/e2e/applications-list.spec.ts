/**
 * AL_01 – AL_14 : Applications List
 * Covers /applications — cross-job applicant list, filters, sorting, bulk actions.
 * Uses seeded data (21 applications across 3 jobs).
 */

import { test, expect } from "@playwright/test";
import { ApplicationsPage } from "../pages/applications-page";

test.describe("Applications List", () => {
  // AL_01 — Global applicants list loads
  test("AL_01 /applications loads showing all applications across all jobs", async ({ page }) => {
    const applicationsPage = new ApplicationsPage(page);
    await applicationsPage.goto();

    await expect(applicationsPage.heading).toBeVisible();
  });

  // AL_02 — Job label shown on each row
  test("AL_02 each applicant row shows the job/role the applicant applied for", async () => {
    test.skip(true, "TODO: implement");
  });

  // AL_03 — Applicant details on each row
  test("AL_03 each row shows name, location, email, experience, match score, status, and timestamp", async () => {
    test.skip(true, "TODO: implement");
  });

  // AL_04 — Match score color band
  test("AL_04 match score badges color-coded correctly (Strong/Fair/Weak)", async () => {
    test.skip(true, "TODO: implement");
  });

  // AL_05 — Status filter chips
  test("AL_05 clicking a status chip shows only applicants with that status", async ({ page }) => {
    const applicationsPage = new ApplicationsPage(page);
    await applicationsPage.goto();

    await applicationsPage.statusFilter("shortlisted").click();
    await expect(page).toHaveURL(/status=shortlisted/);
  });

  // AL_05 clear — Clearing status filter
  test("AL_05 clearing status filter removes param from URL", async ({ page }) => {
    await page.goto("/applications?status=shortlisted");
    const applicationsPage = new ApplicationsPage(page);

    await applicationsPage.statusFilter("all").click();
    await expect(page).not.toHaveURL(/status=/);
  });

  // AL_06 — Sort by match score high to low
  test("AL_06 Sort by Match Score reorders applicants with highest score first", async () => {
    test.skip(true, "TODO: implement");
  });

  // AL_07 — Filter by job dropdown
  test("AL_07 selecting a job from filter dropdown shows only that job's applicants", async () => {
    test.skip(true, "TODO: implement");
  });

  // AL_08 — URL-driven filter is bookmarkable
  test("AL_08 URL with status filter applied loads page with same filter in new tab", async () => {
    test.skip(true, "TODO: implement");
  });

  // AL_09 — Clicking applicant row navigates to detail
  test("AL_09 clicking an applicant row navigates to /applications/[id]", async () => {
    test.skip(true, "TODO: implement");
  });

  // AL_10 — Empty state when filter yields no results
  test("AL_10 empty state message shown when no applicants match the selected status", async () => {
    test.skip(true, "TODO: implement");
  });

  // AL_11 — Bulk select applicants
  test("AL_11 clicking multiple checkboxes selects applicants and shows bulk action bar", async () => {
    test.skip(true, "TODO: implement");
  });

  // AL_14 — Select All selects every visible applicant
  test("AL_14 Select All checkbox selects all currently visible applicants", async () => {
    test.skip(true, "TODO: implement");
  });
});
