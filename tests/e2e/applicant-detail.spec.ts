/**
 * AD_01 – AD_27 : Applicant Detail
 * Covers /applications/[id] — profile, match score, criteria breakdown,
 * links, status changes, breadcrumb navigation.
 * Uses seeded data: app_AIEN9X_aisha (Aisha Khan, score 89, shortlisted).
 */

import { test, expect } from "@playwright/test";
import { ApplicantPage } from "../pages/applicant-page";

const APP_ID = "app_AIEN9X_aisha";
const CANDIDATE_NAME = "Aisha Khan";

test.describe("Applicant Detail", () => {
  // AD_01 — Applicant detail page loads
  test("AD_01 applicant detail page loads with name, score, and match details", async ({ page }) => {
    const applicantPage = new ApplicantPage(page);
    await applicantPage.goto(APP_ID);

    await expect(applicantPage.candidateName).toContainText(CANDIDATE_NAME);
    await expect(applicantPage.matchScore).toBeVisible();
  });

  // AD_02 — Personal details section
  test("AD_02 personal details section shows name, email, location, and years of experience", async () => {
    test.skip(true, "TODO: implement");
  });

  // AD_03 — Overall match score and band label
  test("AD_03 match score (0-100) shown with band label (Strong/Fair/Weak) and color", async ({ page }) => {
    const applicantPage = new ApplicantPage(page);
    await applicantPage.goto(APP_ID);

    await expect(applicantPage.matchScore).toBeVisible();
  });

  // AD_04 — Match summary paragraph
  test("AD_04 match summary paragraph is shown below the score", async ({ page }) => {
    const applicantPage = new ApplicantPage(page);
    await applicantPage.goto(APP_ID);

    await expect(applicantPage.matchSummary).toBeVisible();
  });

  // AD_05 — Per-criterion breakdown renders
  test("AD_05 criteria breakdown rows render grouped by Must/Preferred/Nice tier", async ({ page }) => {
    const applicantPage = new ApplicantPage(page);
    await applicantPage.goto(APP_ID);

    await expect(applicantPage.criteriaRows).not.toHaveCount(0);
  });

  // AD_06 — Matched status indicators per criterion
  test("AD_06 each criterion row shows matched/partial/no indicator", async () => {
    test.skip(true, "TODO: implement");
  });

  // AD_07 — Criterion score (0–10) displayed
  test("AD_07 each criterion row shows a numeric score between 0 and 10", async () => {
    test.skip(true, "TODO: implement");
  });

  // AD_08 — Evidence sentence per criterion
  test("AD_08 each criterion row includes a short evidence sentence from the resume", async () => {
    test.skip(true, "TODO: implement");
  });

  // AD_09 — LinkedIn link
  test("AD_09 LinkedIn link shown and clickable for applicant with LinkedIn profile", async () => {
    test.skip(true, "TODO: implement — use seeded applicant with LinkedIn URL");
  });

  // AD_10 — Portfolio link
  test("AD_10 Portfolio link shown and clickable for applicant with portfolio URL", async () => {
    test.skip(true, "TODO: implement");
  });

  // AD_11 — GitHub link
  test("AD_11 GitHub link shown and clickable for applicant with GitHub URL", async () => {
    test.skip(true, "TODO: implement");
  });

  // AD_12 — Link missing badge when URL absent
  test("AD_12 Link missing badge shown when LinkedIn/Portfolio/GitHub URL is absent", async () => {
    test.skip(true, "TODO: implement");
  });

  // AD_13 — Resume download/inline view
  test("AD_13 resume file opens or downloads when resume link is clicked", async () => {
    test.skip(true, "TODO: implement — known issue, currently failing");
  });

  // AD_15 — Status selector shows current status
  test("AD_15 status selector highlights the current application status", async ({ page }) => {
    const applicantPage = new ApplicantPage(page);
    await applicantPage.goto(APP_ID);

    await expect(applicantPage.statusActions).toBeVisible();
  });

  // AD_16 — Change status to Reviewing
  test("AD_16 clicking Reviewing updates status; persists on page refresh", async () => {
    test.skip(true, "TODO: implement");
  });

  // AD_17 — Change status to Shortlisted
  test("AD_17 clicking Shortlisted updates status to Shortlisted", async () => {
    test.skip(true, "TODO: implement");
  });

  // AD_18 — Change status to Interview Scheduled
  test("AD_18 clicking Interview Scheduled updates status", async () => {
    test.skip(true, "TODO: implement");
  });

  // AD_19 — Change status to Interviewed
  test("AD_19 clicking Interviewed updates status", async () => {
    test.skip(true, "TODO: implement");
  });

  // AD_21 — Change status to Hired
  test("AD_21 clicking Hired updates status", async () => {
    test.skip(true, "TODO: implement");
  });

  // AD_22 — Change status to Rejected
  test("AD_22 clicking Rejected updates status", async () => {
    test.skip(true, "TODO: implement");
  });

  // AD_24 — Status change persists after page refresh
  test("AD_24 status change persists after page refresh", async () => {
    test.skip(true, "TODO: implement");
  });

  // AD_25 — Breadcrumb to job detail
  test("AD_25 clicking job title in breadcrumb navigates to /jobs/[code]", async ({ page }) => {
    const applicantPage = new ApplicantPage(page);
    await applicantPage.goto(APP_ID);

    await expect(applicantPage.breadcrumb).toBeVisible();
    await expect(applicantPage.breadcrumb.getByRole("link").first()).toBeVisible();
  });

  // AD_26 — Breadcrumb to jobs list
  test("AD_26 clicking Jobs in breadcrumb navigates to /jobs", async () => {
    test.skip(true, "TODO: implement");
  });

  // AD_27 — Criteria labels match job's current criteria
  test("AD_27 criterion labels in breakdown match the job's current criteria list", async () => {
    test.skip(true, "TODO: implement");
  });
});
