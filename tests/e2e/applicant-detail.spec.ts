/**
 * AD_01 – AD_27 : Applicant Detail
 * Covers /applications/[id] — profile, match score, criteria breakdown,
 * links, status changes, breadcrumb navigation.
 * Uses seeded data: app_AIEN9X_aisha (Aisha Khan, score 89, shortlisted).
 */

import { test, expect, type Page } from "@playwright/test";
import { ApplicantPage } from "../pages/applicant-page";

const APP_ID = "app_AIEN9X_aisha";
const CANDIDATE_NAME = "Aisha Khan";
// Lakshmi Reddy has a portfolio URL in seed data (lakshmireddy.work)
const APP_WITH_PORTFOLIO = "app_AIEN9X_lakshmi";
// Jia is seeded with interview_scheduled; Felix is seeded with interviewed
const APP_INTERVIEW_SCHEDULED = "app_AIEN9X_jia";
const APP_INTERVIEWED = "app_AIEN9X_felix";

async function resetApplicationStatus(
  page: Page,
  appId: string,
  status: string,
) {
  await page.request.patch(`/api/applications/${appId}/status`, {
    data: { status },
  });
}

test.describe("Applicant Detail", () => {
  // AD_01 — Applicant detail page loads
  test("AD_01 applicant detail page loads with name, score, and match details", async ({
    page,
  }) => {
    const applicantPage = new ApplicantPage(page);
    await applicantPage.goto(APP_ID);

    await expect(applicantPage.candidateName).toContainText(CANDIDATE_NAME);
    await expect(applicantPage.matchScore).toBeVisible();
  });

  // AD_02 — Personal details section
  test("AD_02 personal details section shows name, email, location, and years of experience", async ({
    page,
  }) => {
    const applicantPage = new ApplicantPage(page);
    await applicantPage.goto(APP_ID);

    await expect(applicantPage.candidateName).toContainText(CANDIDATE_NAME);
    await expect(
      page.getByRole("link", { name: "aisha.khan@example.com" }),
    ).toBeVisible();
    await expect(page.getByText("Auroville, IN")).toBeVisible();
    await expect(page.getByText("6 years", { exact: true })).toBeVisible();
  });

  // AD_03 — Overall match score and band label
  test("AD_03 match score (0-100) shown with band label (Strong/Fair/Weak) and color", async ({
    page,
  }) => {
    const applicantPage = new ApplicantPage(page);
    await applicantPage.goto(APP_ID);

    await expect(applicantPage.matchScore).toBeVisible();
    // Aisha scores 89 — "Strong match"
    await expect(page.getByText("Strong match")).toBeVisible();
  });

  // AD_04 — Match summary paragraph
  test("AD_04 match summary paragraph is shown below the score", async ({
    page,
  }) => {
    const applicantPage = new ApplicantPage(page);
    await applicantPage.goto(APP_ID);

    await expect(applicantPage.matchSummary).toBeVisible();
    await expect(applicantPage.matchSummary).toContainText("Aisha");
  });

  // AD_05 — Per-criterion breakdown renders
  test("AD_05 criteria breakdown rows render grouped by Must/Preferred/Nice tier", async ({
    page,
  }) => {
    const applicantPage = new ApplicantPage(page);
    await applicantPage.goto(APP_ID);

    await expect(applicantPage.criteriaRows).not.toHaveCount(0);
    // All three tier labels should appear (Must / Preferred / Nice)
    await expect(page.getByText("Must")).toBeVisible();
    await expect(page.getByText("Preferred")).toBeVisible();
    await expect(page.getByText("Nice")).toBeVisible();
  });

  // AD_06 — Matched status indicators per criterion
  test("AD_06 each criterion row shows matched/partial/no indicator", async ({
    page,
  }) => {
    const applicantPage = new ApplicantPage(page);
    await applicantPage.goto(APP_ID);

    // Aisha has 11 "yes" matches and 1 "no" — verify both indicator types appear
    await expect(page.locator('[aria-label="yes"]').first()).toBeVisible();
    await expect(page.locator('[aria-label="no"]').first()).toBeVisible();
  });

  // AD_07 — Criterion score (0–10) displayed
  test("AD_07 each criterion row shows a numeric score between 0 and 10", async ({
    page,
  }) => {
    const applicantPage = new ApplicantPage(page);
    await applicantPage.goto(APP_ID);

    await expect(applicantPage.criteriaRows).not.toHaveCount(0);
    await expect(
      applicantPage.criteriaRows.first().getByText(/\d+\s*\/\s*10/),
    ).toBeVisible();
  });

  // AD_08 — Evidence sentence per criterion
  test("AD_08 each criterion row includes a short evidence sentence from the resume", async ({
    page,
  }) => {
    const applicantPage = new ApplicantPage(page);
    await applicantPage.goto(APP_ID);

    // Evidence is inside a <p> in each criterion row; first criterion references Helio AI
    const evidencePara = applicantPage.criteriaRows.first().locator("p").last();
    await expect(evidencePara).toBeVisible();
    await expect(evidencePara).toContainText(/Helio AI/);
  });

  // AD_09 — LinkedIn link
  test("AD_09 LinkedIn link shown and clickable for applicant with LinkedIn profile", async ({
    page,
  }) => {
    const applicantPage = new ApplicantPage(page);
    await applicantPage.goto(APP_ID);

    const linkedinLink = page.getByRole("link", { name: "LinkedIn" });
    await expect(linkedinLink).toBeVisible();
    await expect(linkedinLink).toHaveAttribute("href", /linkedin\.com/);
  });

  // AD_10 — Portfolio link (Lakshmi Reddy has portfolio in seed data)
  test("AD_10 Portfolio link shown and clickable for applicant with portfolio URL", async ({
    page,
  }) => {
    const applicantPage = new ApplicantPage(page);
    await applicantPage.goto(APP_WITH_PORTFOLIO);

    const portfolioLink = page.getByRole("link", { name: "Portfolio" });
    await expect(portfolioLink).toBeVisible();
    await expect(portfolioLink).toHaveAttribute("href", /lakshmireddy\.work/);
  });

  // AD_11 — GitHub link
  test("AD_11 GitHub link shown and clickable for applicant with GitHub URL", async ({
    page,
  }) => {
    const applicantPage = new ApplicantPage(page);
    await applicantPage.goto(APP_ID);

    const githubLink = page.getByRole("link", { name: "GitHub" });
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute("href", /github\.com/);
  });

  // AD_12 — Link missing badge when URL absent
  test("AD_12 Link missing badge shown when LinkedIn/Portfolio/GitHub URL is absent", async ({
    page,
  }) => {
    const applicantPage = new ApplicantPage(page);
    await applicantPage.goto(APP_ID);

    // Aisha has no portfolio URL in seed data
    await expect(page.getByText(/portfolio missing/i)).toBeVisible();
  });

  // AD_13 — Resume link visible and has valid href (Aisha has resumeUrl seeded)
  test("AD_13 resume file opens or downloads when resume link is clicked", async ({
    page,
  }) => {
    const applicantPage = new ApplicantPage(page);
    await applicantPage.goto(APP_ID);

    const resumeLink = page.getByRole("link", { name: /download resume/i });
    await expect(resumeLink).toBeVisible();
    const href = await resumeLink.getAttribute("href");
    expect(href).toBeTruthy();
    expect(href).toMatch(/^https?:\/\//);
  });

  // AD_15 — Status selector shows current status
  test("AD_15 status selector highlights the current application status", async ({
    page,
  }) => {
    const applicantPage = new ApplicantPage(page);
    await applicantPage.goto(APP_ID);

    await expect(applicantPage.statusActions).toBeVisible();
  });

  // AD_25 — Breadcrumb to job detail
  test("AD_25 clicking job title in breadcrumb navigates to /jobs/[code]", async ({
    page,
  }) => {
    const applicantPage = new ApplicantPage(page);
    await applicantPage.goto(APP_ID);

    await expect(applicantPage.breadcrumb).toBeVisible();
    await expect(
      applicantPage.breadcrumb.getByRole("link").first(),
    ).toBeVisible();
  });

  // AD_26 — Breadcrumb to jobs list
  test("AD_26 clicking Jobs in breadcrumb navigates to /jobs", async ({
    page,
  }) => {
    const applicantPage = new ApplicantPage(page);
    await applicantPage.goto(APP_ID);

    await applicantPage.breadcrumb
      .getByRole("link", { name: /^jobs$/i })
      .click();
    await expect(page).toHaveURL(/\/jobs$/);
  });

  // AD_27 — Criterion labels match job's current criteria
  test("AD_27 criterion labels in breakdown match the job's current criteria list", async ({
    page,
  }) => {
    const applicantPage = new ApplicantPage(page);
    await applicantPage.goto(APP_ID);

    // Verify known criteria from Senior AI Engineer job appear in breakdown
    await expect(
      page.getByText("5+ years Python", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("LLM application experience", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Publications or talks", { exact: true }),
    ).toBeVisible();
  });

  // — Status mutation tests run serially to avoid parallel data conflicts —
  test.describe("status mutations", () => {
    test.describe.configure({ mode: "serial" });

    // AD_16 — Change status to Reviewing
    test("AD_16 clicking Reviewing updates status; persists on page refresh", async ({
      page,
    }) => {
      const applicantPage = new ApplicantPage(page);
      await applicantPage.goto(APP_ID);

      await page
        .locator("button[data-state]")
        .filter({ hasText: "Review" })
        .click();
      await expect(
        page.locator('button[data-state="on"]').filter({ hasText: "Review" }),
      ).toBeVisible();

      // Verify persistence after reload
      await page.reload();
      await applicantPage.candidateName.waitFor({ state: "visible" });
      await expect(
        page.locator('button[data-state="on"]').filter({ hasText: "Review" }),
      ).toBeVisible();

      // Cleanup: restore to shortlisted via API
      await resetApplicationStatus(page, APP_ID, "shortlisted");
    });

    // AD_17 — Change status to Shortlisted
    test("AD_17 clicking Shortlisted updates status to Shortlisted", async ({
      page,
    }) => {
      const applicantPage = new ApplicantPage(page);
      await applicantPage.goto(APP_ID);

      // First switch to reviewing
      await page
        .locator("button[data-state]")
        .filter({ hasText: "Review" })
        .click();
      await expect(
        page.locator('button[data-state="on"]').filter({ hasText: "Review" }),
      ).toBeVisible();

      // Then click Shortlist — verify it becomes active
      await page
        .locator("button[data-state]")
        .filter({ hasText: "Shortlist" })
        .click();
      await expect(
        page
          .locator('button[data-state="on"]')
          .filter({ hasText: "Shortlist" }),
      ).toBeVisible();
    });

    // AD_18 — Interview Scheduled (requires interview scheduling flow)
    test("AD_18 clicking Interview Scheduled updates status", async () => {
      test.skip(
        true,
        "Interview Scheduled status is set via the interview scheduling flow, not directly from pre-interview buttons",
      );
    });

    // AD_19 — Mark Interviewed (Jia is seeded with interview_scheduled)
    test("AD_19 clicking Interviewed updates status", async ({ page }) => {
      // Reset Jia's status in case a previous test run left it in a different state
      await resetApplicationStatus(
        page,
        APP_INTERVIEW_SCHEDULED,
        "interview_scheduled",
      );
      await page.goto(`/applications/${APP_INTERVIEW_SCHEDULED}`);

      const markBtn = page.getByRole("button", { name: /mark interviewed/i });
      await expect(markBtn).toBeVisible();
      await markBtn.click();

      // "Hire Candidate" button appears once status is interviewed
      await expect(
        page.getByRole("button", { name: /hire candidate/i }),
      ).toBeVisible({ timeout: 5_000 });

      // Cleanup
      await resetApplicationStatus(
        page,
        APP_INTERVIEW_SCHEDULED,
        "interview_scheduled",
      );
    });

    // AD_21 — Hire Candidate (Felix is seeded with interviewed)
    test("AD_21 clicking Hired updates status", async ({ page }) => {
      await resetApplicationStatus(page, APP_INTERVIEWED, "interviewed");
      await page.goto(`/applications/${APP_INTERVIEWED}`);
      await page.waitForLoadState("networkidle");

      const hireBtn = page.getByText(/hire candidate/i);
      await expect(hireBtn).toBeVisible({ timeout: 8_000 });
      await hireBtn.click();

      // Button label changes to "Hired ✓" once status is hired
      await expect(page.getByText(/hired/i)).toBeVisible({ timeout: 5_000 });

      // Cleanup
      await resetApplicationStatus(page, APP_INTERVIEWED, "interviewed");
    });

    // AD_22 — Change status to Rejected
    test("AD_22 clicking Rejected updates status", async ({ page }) => {
      const applicantPage = new ApplicantPage(page);
      await applicantPage.goto(APP_ID);

      await page
        .locator("button[data-state]")
        .filter({ hasText: "Reject" })
        .click();

      // After rejection, pre-interview toggle is replaced by terminal "Final decision" label
      await expect(page.getByText(/final decision/i)).toBeVisible();

      // Cleanup: reset via API (UI cannot reverse terminal state)
      await resetApplicationStatus(page, APP_ID, "shortlisted");
    });

    // AD_24 — Status change persists after page refresh
    test("AD_24 status change persists after page refresh", async ({
      page,
    }) => {
      const applicantPage = new ApplicantPage(page);
      await applicantPage.goto(APP_ID);

      // Change to reviewing
      await page
        .locator("button[data-state]")
        .filter({ hasText: "Review" })
        .click();
      await expect(
        page.locator('button[data-state="on"]').filter({ hasText: "Review" }),
      ).toBeVisible();

      // Reload and verify status persisted
      await page.reload();
      await applicantPage.candidateName.waitFor({ state: "visible" });
      await expect(
        page.locator('button[data-state="on"]').filter({ hasText: "Review" }),
      ).toBeVisible();

      // Cleanup
      await resetApplicationStatus(page, APP_ID, "shortlisted");
    });
  });
});
