/**
 * Real flow test: upload an actual JD → OpenAI extracts criteria → save to test Supabase.
 * No mocks. Uses real API calls. Writes to the test database (not production).
 *
 * Run separately from the fast mock suite:
 *   pnpm exec playwright test real-flow --headed
 */

import { test, expect } from "@playwright/test";
import path from "path";
import { JobsPage } from "../pages/jobs-page";
import { JobNewPage } from "../pages/job-new-page";

const JD_FILE = path.join(__dirname, "../fixtures/senior-product-designer.txt");

test.describe("Real flow — live OpenAI + test Supabase", () => {
  test("upload JD → LLM extracts criteria → save job to test DB", async ({
    page,
  }) => {
    // Step 1: Navigate to new job form (session already logged in via globalSetup)
    const jobNewPage = new JobNewPage(page);
    await jobNewPage.goto();
    // Wait for full client-side hydration before interacting
    await page.waitForLoadState("networkidle");
    await expect(jobNewPage.dropZone).toBeVisible();

    // Step 2: Upload the real JD file from disk
    await jobNewPage.fileInput.setInputFiles(JD_FILE);
    await jobNewPage.fileInput.dispatchEvent("change");
    await expect(jobNewPage.dropZone).not.toBeVisible({ timeout: 10_000 });
    await expect(jobNewPage.extractButton).toBeVisible();

    // Step 3: Click Extract — real OpenAI call, allow up to 30s
    await jobNewPage.extractButton.click();
    await expect(jobNewPage.jobTitleHeading).toContainText(/designer/i, {
      timeout: 30_000,
    });

    // Step 4: Criteria are extracted and displayed
    await expect(jobNewPage.saveButton).toBeEnabled({ timeout: 5_000 });

    // Step 5: Save — real Supabase write to test DB
    const jobsPage = new JobsPage(page);
    await jobNewPage.saveButton.click();

    // Step 6: Redirected to /jobs with new job code in URL
    await expect(page).toHaveURL(/\/jobs\?dashboard/, { timeout: 15_000 });
    await expect(jobsPage.newJobButton).toBeVisible();

    // Log the new job code for reference
    const url = page.url();
    const code = new URL(url).searchParams.get("new");
    console.log(`[real-flow] Job saved to test DB with code: ${code}`);
  });
});
