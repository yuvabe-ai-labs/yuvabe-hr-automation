/**
 * Applicant detail page tests — /applications/[id]
 * Uses seeded data: app_AIEN9X_aisha (Aisha Khan, score 89, shortlisted)
 */

import { test, expect } from "@playwright/test";
import { ApplicantPage } from "../pages/applicant-page";

const APP_ID = "app_AIEN9X_aisha";
const CANDIDATE_NAME = "Aisha Khan";

test.describe("Applicant detail page", () => {
  test("shows candidate name and match score", async ({ page }) => {
    const applicantPage = new ApplicantPage(page);
    await applicantPage.goto(APP_ID);

    await expect(applicantPage.candidateName).toContainText(CANDIDATE_NAME);
    await expect(applicantPage.matchScore).toBeVisible();
  });

  test("shows match summary", async ({ page }) => {
    const applicantPage = new ApplicantPage(page);
    await applicantPage.goto(APP_ID);

    await expect(applicantPage.matchSummary).toBeVisible();
  });

  test("shows criteria breakdown rows", async ({ page }) => {
    const applicantPage = new ApplicantPage(page);
    await applicantPage.goto(APP_ID);

    await expect(applicantPage.criteriaRows).not.toHaveCount(0);
  });

  test("shows status actions", async ({ page }) => {
    const applicantPage = new ApplicantPage(page);
    await applicantPage.goto(APP_ID);

    await expect(applicantPage.statusActions).toBeVisible();
  });

  test("breadcrumb is visible and links back", async ({ page }) => {
    const applicantPage = new ApplicantPage(page);
    await applicantPage.goto(APP_ID);

    await expect(applicantPage.breadcrumb).toBeVisible();
    await expect(
      applicantPage.breadcrumb.getByRole("link").first()
    ).toBeVisible();
  });
});
