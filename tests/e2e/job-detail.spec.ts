/**
 * Job detail page tests — /jobs/[code]
 * Uses seeded data: AIEN9X (Senior AI Engineer, 7 applicants)
 */

import { test, expect } from "@playwright/test";
import { JobDetailPage } from "../pages/job-detail-page";

const JOB_CODE = "AIEN9X";
const JOB_TITLE = "Senior AI Engineer";

test.describe("Job detail page", () => {
  test("shows job title and applicant list", async ({ page }) => {
    const jobDetail = new JobDetailPage(page);
    await jobDetail.goto(JOB_CODE);

    await expect(jobDetail.jobTitle).toContainText(JOB_TITLE);
    await expect(jobDetail.applicantCount).toBeVisible();
    await expect(jobDetail.backLink).toBeVisible();
  });

  test("back link navigates to jobs list", async ({ page }) => {
    const jobDetail = new JobDetailPage(page);
    await jobDetail.goto(JOB_CODE);

    await jobDetail.backLink.click();
    await expect(page).toHaveURL(/\/jobs$/);
  });

  test("status filter updates URL", async ({ page }) => {
    const jobDetail = new JobDetailPage(page);
    await jobDetail.goto(JOB_CODE);

    await jobDetail.statusFilter("shortlisted").click();
    await expect(page).toHaveURL(/status=shortlisted/);
  });

  test("clear filter removes status from URL", async ({ page }) => {
    await page.goto(`/jobs/${JOB_CODE}?status=shortlisted`);
    const jobDetail = new JobDetailPage(page);

    await jobDetail.statusFilter("all").click();
    await expect(page).not.toHaveURL(/status=/);
  });

  test("clicking applicant navigates to applicant detail", async ({ page }) => {
    const jobDetail = new JobDetailPage(page);
    await jobDetail.goto(JOB_CODE);

    await jobDetail.applicantRow("Aisha").click();
    await expect(page).toHaveURL(/\/applications\//);
  });
});
