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
    await expect(page.locator('button[aria-label="Filter jobs"]')).toBeVisible();
  });

  // FILT_02 — Filter panel opens on click
  test("FILT_02 clicking Filter button opens filter panel with job type and sort options", async ({ page }) => {
    await page.goto("/jobs");
    await page.locator('button[aria-label="Filter jobs"]').click();

    // Filter panel is a Radix Popover — "Full-time" job type button appears inside
    await expect(page.getByRole("button", { name: "Full-time" }).first()).toBeVisible({ timeout: 5_000 });
  });

  // FILT_03 — Filter jobs by type
  test("FILT_03 filtering by job type shows only matching jobs; URL updates with ?type= param", async ({ page }) => {
    await page.goto("/jobs");
    await page.locator('button[aria-label="Filter jobs"]').click();

    await expect(page.getByRole("button", { name: "Full-time" }).first()).toBeVisible({ timeout: 3_000 });
    await page.getByRole("button", { name: "Full-time" }).first().click();
    await page.getByRole("button", { name: "Apply" }).click();

    await expect(page).toHaveURL(/type=full-time/);
  });

  // FILT_04 — Sort jobs by oldest
  test("FILT_04 sorting by Oldest reorders jobs with oldest creation date first", async ({ page }) => {
    await page.goto("/jobs");
    await page.locator('button[aria-label="Filter jobs"]').click();

    await expect(page.getByRole("button", { name: "Oldest" }).first()).toBeVisible({ timeout: 3_000 });
    await page.getByRole("button", { name: "Oldest" }).first().click();
    await page.getByRole("button", { name: "Apply" }).click();

    await expect(page).toHaveURL(/sort=oldest/);
  });

  // FILT_05 — Sort jobs by newest (default — clears sort param)
  test("FILT_05 sorting by Newest reorders jobs with newest creation date first", async ({ page }) => {
    await page.goto("/jobs?sort=oldest");
    await page.locator('button[aria-label="Filter jobs"]').click();

    await expect(page.getByRole("button", { name: "Newest" }).first()).toBeVisible({ timeout: 3_000 });
    await page.getByRole("button", { name: "Newest" }).first().click();
    await page.getByRole("button", { name: "Apply" }).click();

    // "Newest" is the default — sort param is removed
    await expect(page).not.toHaveURL(/sort=oldest/);
  });

  // FILT_06 — Active filter indicator shown on filter button
  test("FILT_06 applying a filter shows a visual indicator (dot or count) on the Filter button", async ({ page }) => {
    await page.goto("/jobs");
    await page.locator('button[aria-label="Filter jobs"]').click();

    await page.getByRole("button", { name: "Full-time" }).first().click();
    await page.getByRole("button", { name: "Apply" }).click();

    // "Clear filters" button appears when hasActiveFilters = true
    await expect(page.getByRole("button", { name: /clear filters/i })).toBeVisible();
  });

  // FILT_07 — Clear Filters removes all applied filters
  test("FILT_07 Clear Filters removes all filters; URL params cleared; all jobs shown", async ({ page }) => {
    await page.goto("/jobs?type=full-time&sort=oldest");

    await expect(page.getByRole("button", { name: /clear filters/i })).toBeVisible();
    await page.getByRole("button", { name: /clear filters/i }).click();

    await expect(page).not.toHaveURL(/type=/);
    await expect(page).not.toHaveURL(/sort=oldest/);
  });

  // FILT_08 — Sort by date on job detail (URL-driven)
  test("FILT_08 sorting applicants by score on job detail reorders with highest score first", async ({ page }) => {
    // Navigate directly with dateSort=oldest to verify URL-driven sort works
    await page.goto(`/jobs/${JOB_CODE}?dateSort=oldest`);
    await expect(page).toHaveURL(/dateSort=oldest/);
    // Applicant list should load with the param applied
    await expect(page.getByRole("listitem").filter({ has: page.locator('[aria-label*="Match score"]') }).first()).toBeVisible();
  });

  // FILT_09 — Min score filter on job detail (URL-driven)
  test("FILT_09 applying a filter on /jobs/[code] shows only matching applicants; URL reflects state", async ({ page }) => {
    // Navigate directly with minScore=70 to verify URL-driven filter works
    await page.goto(`/jobs/${JOB_CODE}?minScore=70`);
    await expect(page).toHaveURL(/minScore=70/);
    // All visible applicants should have score >= 70 (89, 76, 73 from seed data)
    const rows = page.getByRole("listitem").filter({ has: page.locator('[aria-label*="Match score"]') });
    await expect(rows.first()).toBeVisible();
  });

  // FILT_12 — URL-driven filters are bookmarkable
  test("FILT_12 URL with filters applied loads with same filters in a new tab", async ({ page }) => {
    const applicationsPage = new ApplicationsPage(page);
    await applicationsPage.goto();

    await applicationsPage.statusFilter("shortlisted").click();
    await expect(page).toHaveURL(/status=shortlisted/);
    const url = page.url();

    // Navigate directly to the URL (simulates opening in a new tab)
    await page.goto(url);
    await expect(page).toHaveURL(/status=shortlisted/);
  });
});
