/**
 * JC_01 – JC_02 : Job Creation Workflow
 * Full happy path: /jobs → New Job → /jobs/new → upload file →
 * Extract Criteria → assign manager → Publish → Confirm → /jobs
 */

import { test, expect } from "@playwright/test";
import path from "path";
import { JobsPage } from "../pages/jobs-page";
import { JobNewPage } from "../pages/job-new-page";

const JD_FILE = path.join(__dirname, "../fixtures/marketing-content.md");

test.describe("Job Creation Workflow", () => {
  test.describe.configure({ mode: "serial" });

  // JC_01 — Navigate from /jobs to /jobs/new via New Job button
  test("JC_01 clicking New Job button navigates to /jobs/new", async ({ page }) => {
    const jobsPage = new JobsPage(page);
    await jobsPage.goto();

    await jobsPage.newJobButton.click();
    await expect(page).toHaveURL(/\/jobs\/new/);
  });

  // JC_02 — Full end-to-end: upload → extract → assign manager → publish → confirm
  test("JC_02 upload JD → extract criteria → assign manager → publish → confirm", async ({ page }) => {
    const jobNewPage = new JobNewPage(page);
    const jobsPage = new JobsPage(page);

    await jobNewPage.goto();
    await page.waitForLoadState("networkidle");

    // 1. Upload file — the file card shows the fixture filename
    await jobNewPage.fileInput.setInputFiles(JD_FILE);
    await expect(jobNewPage.extractButton).toBeVisible({ timeout: 5_000 });

    // 2. Click Extract Criteria and wait for AI to finish
    await jobNewPage.extractButton.click();
    await expect(jobNewPage.publishButton).toBeEnabled({ timeout: 60_000 });

    // 3. Assign a hiring manager (skip gracefully if none exist in DB)
    const hiringManagerTrigger = page.getByRole("combobox").filter({ hasText: /unassigned/i });
    if (await hiringManagerTrigger.isVisible()) {
      await hiringManagerTrigger.click();
      const options = page.getByRole("option");
      const count = await options.count();
      if (count > 1) {
        await options.nth(1).click();
      } else {
        await page.keyboard.press("Escape");
      }
    }

    // 4. Click Publish — opens the preview/confirm dialog
    await jobNewPage.publishButton.click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });

    // 5. Click Confirm inside the dialog
    await page.getByRole("button", { name: /confirm/i }).click();

    // 6. Redirects to /jobs after successful publish
    await expect(page).toHaveURL(/\/jobs/, { timeout: 20_000 });
    await expect(jobsPage.newJobButton).toBeVisible();
  });
});
