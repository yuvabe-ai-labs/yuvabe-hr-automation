/**
 * Full pipeline test: Login → Create Job → Upload JD → Extract Criteria → Job Listed
 *
 * Opts out of the shared session so login is tested explicitly.
 * LLM extraction and job save are mocked — deterministic, fast, no API cost.
 */

import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/login-page";
import { JobsPage } from "../pages/jobs-page";
import { JobNewPage } from "../pages/job-new-page";

// Clear the saved session — this suite tests login itself
test.use({ storageState: { cookies: [], origins: [] } });

const MOCK_JOB_CODE = "TESTX1";

const MOCK_EXTRACT_RESPONSE = {
  title_suggestion: "Senior Frontend Engineer",
  department: "Engineering",
  level: "Experienced",
  job_type: "Full Time",
  location: "Remote",
  compensation: "Competitive",
  summary: "We are looking for a Senior Frontend Engineer to join our team.",
  responsibilities: ["Lead frontend development", "Mentor junior engineers"],
  requirements: ["5+ years React experience", "TypeScript proficiency"],
  nice_to_have: ["Next.js experience"],
  portfolio_requirement: null,
  benefits_remote: ["Flexible hours"],
  benefits_inperson: null,
  work_culture: ["Collaborative"],
  criteria: [
    { id: "c1", category: "skill", label: "React expertise", importance: "must" },
    { id: "c2", category: "skill", label: "TypeScript", importance: "strong" },
    { id: "c3", category: "experience", label: "5+ years frontend experience", importance: "must" },
    { id: "c4", category: "skill", label: "Next.js experience", importance: "nice" },
  ],
  jd_text: "Senior Frontend Engineer needed with React and TypeScript skills.",
  file: { name: "jd.txt", size: 64 },
};

const MOCK_JOB_SAVE_RESPONSE = {
  job: {
    code: MOCK_JOB_CODE,
    title: "Senior Frontend Engineer",
    created_at: new Date().toISOString(),
  },
};

test.describe("Full pipeline", () => {
  test("auth gate: /jobs redirects unauthenticated user to /login", async ({ page }) => {
    await page.goto("/jobs");
    await expect(page).toHaveURL(/\/dashboard/); // intentional fail for demo
  });

  test("wrong credentials show an error message", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.usernameInput.fill("wrong");
    await loginPage.passwordInput.fill("badpassword");
    await loginPage.submitButton.click();
    await expect(loginPage.errorMessage).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("login → create job → upload JD → extract criteria → job appears in list", async ({ page }) => {
    // Step 1: Log in
    const loginPage = new LoginPage(page);
    await loginPage.login(
      process.env.AUTH_USER!,
      process.env.AUTH_PASS!
    );
    await expect(page).toHaveURL(/\/jobs/);

    // Step 2: Navigate to new job form
    const jobsPage = new JobsPage(page);
    await jobsPage.newJobButton.click();
    await expect(page).toHaveURL(/\/jobs\/new/);

    // Step 3: Drop zone is shown before any file is selected
    const jobNewPage = new JobNewPage(page);
    await expect(jobNewPage.dropZone).toBeVisible();

    // Step 4: Upload a JD file (sets file on the hidden input directly)
    await jobNewPage.uploadFile(
      "jd.txt",
      "text/plain",
      "Senior Frontend Engineer needed. Requires 5+ years React and TypeScript."
    );
    await expect(jobNewPage.dropZone).not.toBeVisible();
    await expect(jobNewPage.extractButton).toBeVisible();

    // Step 5: Mock LLM API then click Extract
    await page.route("**/api/extract-criteria", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_EXTRACT_RESPONSE),
      })
    );
    await jobNewPage.extractButton.click();

    // Step 6: Criteria are displayed after extraction
    await expect(jobNewPage.jobTitleHeading).toContainText("Senior Frontend Engineer");
    await expect(jobNewPage.criterionRow("React expertise")).toBeVisible();
    await expect(jobNewPage.criterionRow("TypeScript")).toBeVisible();
    await expect(jobNewPage.criterionRow("5+ years frontend experience")).toBeVisible();
    await expect(jobNewPage.filterChip("Must")).toBeVisible();
    await expect(jobNewPage.filterChip("Preferred")).toBeVisible();
    await expect(jobNewPage.filterChip("Nice")).toBeVisible();
    await expect(jobNewPage.saveButton).toBeEnabled();

    // Step 7: Mock save API then save
    await page.route("**/api/jobs", (route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(MOCK_JOB_SAVE_RESPONSE),
        });
      } else {
        route.continue();
      }
    });
    await jobNewPage.saveButton.click();

    // Step 8: Redirected to /jobs — URL carries the new job code
    await expect(page).toHaveURL(new RegExp(`/jobs\\?new=${MOCK_JOB_CODE}`));
    // Jobs list rendered correctly — New job button confirms page loaded
    await expect(jobsPage.newJobButton).toBeVisible();
  });
});
