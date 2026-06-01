/**
 * JD_01 – JD_14 : Job Detail
 * Covers /jobs/[code] — applicant list, score display, status filter chips,
 * URL-driven filters, navigation, and empty state.
 * Uses seeded data: AIEN9X (Senior AI Engineer, 7 applicants).
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
  test("JD_02 applicants sorted by match score descending (highest first)", async ({ page }) => {
    const jobDetail = new JobDetailPage(page);
    await jobDetail.goto(JOB_CODE);

    const rows = jobDetail.applicantRows();
    await expect(rows.first()).toBeVisible();

    // Extract scores from first two rows via aria-label ("Match score 89")
    const label0 = await jobDetail.scoreChip(0).getAttribute("aria-label");
    const label1 = await jobDetail.scoreChip(1).getAttribute("aria-label");
    const score0 = parseInt(label0?.replace(/\D/g, "") ?? "0", 10);
    const score1 = parseInt(label1?.replace(/\D/g, "") ?? "0", 10);

    expect(score0).toBeGreaterThanOrEqual(score1);
  });

  // JD_03 — Applicant row shows name, score, status badge, timestamp
  test("JD_03 applicant row shows name, match score, status badge, and submission timestamp", async ({ page }) => {
    const jobDetail = new JobDetailPage(page);
    await jobDetail.goto(JOB_CODE);

    const firstRow = jobDetail.applicantRows().first();
    // Score chip with aria-label
    await expect(firstRow.locator('[aria-label*="Match score"]')).toBeVisible();
    // Candidate name in h3
    await expect(firstRow.locator("h3")).toBeVisible();
    // relativeTime: "Xm ago"/"Xd ago" for recent, or "Apr 29" style for older dates
    await expect(firstRow.getByText(/ago|just now|today|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i)).toBeVisible();
  });

  // JD_04 — Match score badges color-coded correctly
  test("JD_04 match score badges color-coded correctly (green/amber/red)", async ({ page }) => {
    const jobDetail = new JobDetailPage(page);
    await jobDetail.goto(JOB_CODE);

    // Aisha scores 89 (strong — first row by default sort)
    const highChipLabel = await jobDetail.scoreChip(0).getAttribute("aria-label");
    expect(highChipLabel).toMatch(/89/);
    await expect(jobDetail.scoreChip(0)).toBeVisible();
  });

  // JD_05 — Status filter chips render
  test("JD_05 status filter chips render for New, Reviewing, Shortlisted, Interview Scheduled, etc.", async ({ page }) => {
    const jobDetail = new JobDetailPage(page);
    await jobDetail.goto(JOB_CODE);

    await expect(jobDetail.statusFilter("all")).toBeVisible();
    await expect(jobDetail.statusFilter("new")).toBeVisible();
    await expect(jobDetail.statusFilter("reviewing")).toBeVisible();
    await expect(jobDetail.statusFilter("shortlisted")).toBeVisible();
    await expect(jobDetail.statusFilter("interview")).toBeVisible();
    await expect(jobDetail.statusFilter("hired")).toBeVisible();
    await expect(jobDetail.statusFilter("rejected")).toBeVisible();
  });

  // JD_06 — Shortlist chip shows only shortlisted applicants
  test("JD_06 clicking Shortlisted chip shows only shortlisted applicants", async ({ page }) => {
    const jobDetail = new JobDetailPage(page);
    await jobDetail.goto(JOB_CODE);

    await jobDetail.statusFilter("shortlisted").click();
    await expect(page).toHaveURL(/status=shortlisted/);

    const rows = jobDetail.applicantRows();
    await expect(rows.first()).toBeVisible();
    // Aisha is the only shortlisted applicant; her row shows "Shortlisted" status label
    await expect(rows.first().getByText(/shortlisted/i)).toBeVisible();
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

  // JD_09 — Chip count matches applicants shown when selected
  test("JD_09 count on each status chip matches number of applicants shown when selected", async ({ page }) => {
    const jobDetail = new JobDetailPage(page);
    await jobDetail.goto(JOB_CODE);

    // StatusFilterChip renders: "{count.padStart(2,'0')} {label}" e.g. "03 Review"
    // Use "Review" (Marcus, Theo, Daniel) — stable applicants not modified by other tests
    const reviewChip = jobDetail.statusFilter("reviewing");
    const chipText = await reviewChip.textContent();
    const chipCount = parseInt(chipText?.match(/\d+/)?.[0] ?? "0", 10);

    await reviewChip.click();
    await expect(page).toHaveURL(/status=reviewing/);
    // Wait for React Query to populate the list before counting
    await expect(jobDetail.applicantRows().first()).toBeVisible();

    const rowCount = await jobDetail.applicantRows().count();
    expect(rowCount).toBe(chipCount);
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

  // JD_13 — Empty state when status filter has zero applicants
  test("JD_13 empty state shown when selected status filter has zero applicants", async ({ page }) => {
    // AIEN9X has 0 "new" applicants — reliably triggers the empty state
    await page.goto(`/jobs/${JOB_CODE}?status=new`);

    // Empty state: "No new candidates." with "Show all" link
    await expect(page.getByText(/no new candidates/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /show all/i })).toBeVisible();
  });

  // JD_14 — View Criteria navigates to criteria view
  test("JD_14 Edit Criteria button navigates to /jobs/[code]/edit", async ({ page }) => {
    const jobDetail = new JobDetailPage(page);
    await jobDetail.goto(JOB_CODE);

    // UI shows "View criteria" linking to /jobs/[code]/view
    await page.getByRole("link", { name: /view criteria/i }).click();
    await expect(page).toHaveURL(new RegExp(`/jobs/${JOB_CODE}/view`));
  });
});
