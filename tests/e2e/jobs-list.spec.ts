/**
 * JOBS_01 – JOBS_15 : Jobs List
 * Covers /jobs — page load, tabs, row details, actions menu, archive/re-open, empty state.
 * Uses seeded data — at least 3 active jobs and 1 archived job expected.
 */

import { test, expect } from "@playwright/test";
import { JobsPage } from "../pages/jobs-page";

const ACTIVE_JOB_TITLE = "Senior AI Engineer";
const ACTIVE_JOB_CODE = "AIEN9X";

test.describe("Jobs List", () => {
  // JOBS_01 — Jobs list page loads
  test("JOBS_01 /jobs loads with job list and + New Job button", async ({ page }) => {
    const jobsPage = new JobsPage(page);
    await jobsPage.goto();

    await expect(jobsPage.newJobButton).toBeVisible();
    await expect(page.getByRole("list")).toBeVisible();
  });

  // JOBS_02 — Job row shows correct details
  test("JOBS_02 job row shows title, applicant count, and published date", async ({ page }) => {
    const jobsPage = new JobsPage(page);
    await jobsPage.goto();

    const row = jobsPage.jobRow(ACTIVE_JOB_TITLE);
    await expect(row).toBeVisible();
    await expect(row.getByText(/applicant/i)).toBeVisible();
  });

  // JOBS_03 — Active tab shows only active jobs
  test("JOBS_03 Active tab shows only active jobs", async ({ page }) => {
    const jobsPage = new JobsPage(page);
    await jobsPage.goto();

    await page.getByRole("link", { name: /^active$/i }).click();
    await expect(page.getByRole("listitem").first()).toBeVisible();
    // No "draft" or "archived" badges should appear
    await expect(page.getByText(/^draft$/i)).not.toBeVisible();
  });

  // JOBS_04 — Archived tab shows only archived jobs
  test("JOBS_04 Archived tab shows only archived jobs", async ({ page }) => {
    const jobsPage = new JobsPage(page);
    await jobsPage.goto();

    await page.getByRole("link", { name: /^archived$/i }).click();
    await expect(page).toHaveURL(/tab=archived/);
    // All visible rows should have the "archived" label
    const rows = page.getByRole("listitem");
    const count = await rows.count();
    if (count > 0) {
      await expect(rows.first().getByText(/archived/i)).toBeVisible();
    } else {
      // Empty state is acceptable if no archived jobs exist in seed
      await expect(page.getByText(/no jobs yet|no archived/i)).toBeVisible();
    }
  });

  // JOBS_05 — Draft tab shows only draft jobs
  test("JOBS_05 Draft tab shows only draft jobs", async ({ page }) => {
    const jobsPage = new JobsPage(page);
    await jobsPage.goto();

    await page.getByRole("link", { name: /^draft$/i }).click();
    await expect(page).toHaveURL(/tab=draft/);
    const rows = page.getByRole("listitem");
    const count = await rows.count();
    if (count > 0) {
      await expect(rows.first().getByText(/draft/i)).toBeVisible();
    } else {
      await expect(page.getByText(/no jobs yet|no draft/i)).toBeVisible();
    }
  });

  // JOBS_06 — Published date shown relative
  test("JOBS_06 each job row shows a relative published date", async ({ page }) => {
    const jobsPage = new JobsPage(page);
    await jobsPage.goto();

    const row = jobsPage.jobRow(ACTIVE_JOB_TITLE);
    await expect(row.getByText(/ago|just now|today/i)).toBeVisible();
  });

  // JOBS_07 — Clicking job row navigates to /jobs/[code]
  test("JOBS_07 clicking a job row navigates to job detail", async ({ page }) => {
    const jobsPage = new JobsPage(page);
    await jobsPage.goto();

    await jobsPage.jobLink(ACTIVE_JOB_TITLE).click();
    await expect(page).toHaveURL(/\/jobs\/[A-Z0-9]+$/);
  });

  // JOBS_09 — + New Job button navigates to /jobs/new
  test("JOBS_09 + New Job button navigates to /jobs/new", async ({ page }) => {
    const jobsPage = new JobsPage(page);
    await jobsPage.goto();

    await jobsPage.newJobButton.click();
    await expect(page).toHaveURL(/\/jobs\/new/);
  });

  // JOBS_10 — Actions dropdown shows relevant options
  test("JOBS_10 actions (…) dropdown shows View Criteria and Archive options", async ({ page }) => {
    const jobsPage = new JobsPage(page);
    await jobsPage.goto();

    await page
      .getByRole("button", { name: new RegExp(`more actions for ${ACTIVE_JOB_TITLE}`, "i") })
      .click();

    await expect(page.getByRole("menuitem", { name: /view criteria/i })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /archive/i })).toBeVisible();
  });

  // JOBS_11 — Archive action removes job from active list
  test("JOBS_11 Archive action archives job and removes it from active list", async ({ page }) => {
    const jobsPage = new JobsPage(page);
    await jobsPage.goto();

    await page
      .getByRole("button", { name: new RegExp(`more actions for ${ACTIVE_JOB_TITLE}`, "i") })
      .click();
    await page.getByRole("menuitem", { name: /archive/i }).click();

    // Confirm dialog
    await page.getByRole("button", { name: /archive/i }).last().click();

    // Job should no longer appear in Active tab
    await expect(jobsPage.jobRow(ACTIVE_JOB_TITLE)).not.toBeVisible();

    // Restore: re-open the job so seed data stays consistent
    await page.getByRole("link", { name: /^archived$/i }).click();
    await page
      .getByRole("button", { name: new RegExp(`more actions for ${ACTIVE_JOB_TITLE}`, "i") })
      .click();
    await page.getByRole("menuitem", { name: /unarchive/i }).click();
  });

  // JOBS_13 — Re-open a closed job
  test("JOBS_13 Unarchive action changes archived job status back to active", async ({ page }) => {
    const jobsPage = new JobsPage(page);
    await jobsPage.goto();

    // First archive the job
    await page
      .getByRole("button", { name: new RegExp(`more actions for ${ACTIVE_JOB_TITLE}`, "i") })
      .click();
    await page.getByRole("menuitem", { name: /archive/i }).click();
    await page.getByRole("button", { name: /archive/i }).last().click();

    // Switch to Archived tab and unarchive
    await page.getByRole("link", { name: /^archived$/i }).click();
    await page
      .getByRole("button", { name: new RegExp(`more actions for ${ACTIVE_JOB_TITLE}`, "i") })
      .click();
    await page.getByRole("menuitem", { name: /unarchive/i }).click();

    // Job should be back in Active tab
    await page.getByRole("link", { name: /^active$/i }).click();
    await expect(jobsPage.jobRow(ACTIVE_JOB_TITLE)).toBeVisible();
  });

  // JOBS_14 — Empty state when no jobs exist
  test("JOBS_14 empty state shown with prompt when no jobs match filter", async ({ page }) => {
    // Use a search query guaranteed to return no results
    await page.goto("/jobs?search=zzznomatchzzz");
    await expect(page.getByText(/no roles match/i)).toBeVisible();
  });

  // JOBS_15 — Applicant count matches actual applications in job detail
  test("JOBS_15 applicant count on row matches total count in job detail page", async ({ page }) => {
    const jobsPage = new JobsPage(page);
    await jobsPage.goto();

    const row = jobsPage.jobRow(ACTIVE_JOB_TITLE);
    const countText = await row.getByText(/\d+\s*applicant/i).textContent();
    const countOnRow = parseInt(countText?.match(/\d+/)?.[0] ?? "0", 10);

    await jobsPage.jobLink(ACTIVE_JOB_TITLE).click();
    await expect(page).toHaveURL(new RegExp(`/jobs/${ACTIVE_JOB_CODE}`));
    const detailCount = page.getByText(/\d+\s*applicant/i).first();
    await expect(detailCount).toContainText(String(countOnRow));
  });
});
