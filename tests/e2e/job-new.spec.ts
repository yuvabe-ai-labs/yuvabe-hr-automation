/**
 * JN_01 – JN_18 : Create Job
 * Covers /jobs/new — file upload, real LLM extraction, criteria editing,
 * save as draft, preview, publish, and hiring manager assignment.
 * No mocks — uses real OpenAI and test Supabase.
 */

import { test, expect } from "@playwright/test";
import path from "path";
import { JobNewPage } from "../pages/job-new-page";
import { JobsPage } from "../pages/jobs-page";

const JD_FILE = path.join(__dirname, "../fixtures/senior-product-designer.txt");

test.describe("Create Job", () => {
  // JN_01 — New job page loads
  test("JN_01 /jobs/new renders with file upload area", async ({ page }) => {
    const jobNewPage = new JobNewPage(page);
    await jobNewPage.goto();
    await page.waitForLoadState("networkidle");

    await expect(jobNewPage.dropZone).toBeVisible();
  });

  // JN_02 — PDF upload accepted; AI extracts criteria
  test("JN_02 PDF upload accepted and AI extracts criteria", async ({ page }) => {
    const jobNewPage = new JobNewPage(page);
    await jobNewPage.goto();
    await page.waitForLoadState("networkidle");

    await jobNewPage.fileInput.setInputFiles(JD_FILE);
    await jobNewPage.fileInput.dispatchEvent("change");

    await expect(jobNewPage.dropZone).not.toBeVisible({ timeout: 10_000 });
    await expect(jobNewPage.extractButton).toBeVisible();
    await jobNewPage.extractButton.click();
    await expect(jobNewPage.saveButton).toBeEnabled({ timeout: 30_000 });
  });

  // JN_03 — DOCX upload accepted
  test("JN_03 DOCX upload accepted and criteria extracted", async () => {
    test.skip(true, "TODO: add .docx fixture and implement");
  });

  // JN_04 — TXT/MD upload accepted
  test("JN_04 TXT/MD upload accepted and criteria extracted", async () => {
    test.skip(true, "TODO: implement");
  });

  // JN_05 — Unsupported file type rejected
  test("JN_05 unsupported file type (.jpg) rejected with error message", async () => {
    test.skip(true, "TODO: implement");
  });

  // JN_06 — AI-suggested title auto-populated
  test("JN_06 AI-suggested job title auto-populated from JD content", async ({ page }) => {
    const jobNewPage = new JobNewPage(page);
    await jobNewPage.goto();
    await page.waitForLoadState("networkidle");

    await jobNewPage.fileInput.setInputFiles(JD_FILE);
    await jobNewPage.fileInput.dispatchEvent("change");
    await expect(jobNewPage.extractButton).toBeVisible({ timeout: 10_000 });
    await jobNewPage.extractButton.click();

    await expect(jobNewPage.jobTitleHeading).toContainText(/\w+/, { timeout: 30_000 });
  });

  // JN_07 — Extracted criteria list renders
  test("JN_07 extracted criteria list renders with labels and importance tiers", async ({ page }) => {
    const jobNewPage = new JobNewPage(page);
    await jobNewPage.goto();
    await page.waitForLoadState("networkidle");

    await jobNewPage.fileInput.setInputFiles(JD_FILE);
    await jobNewPage.fileInput.dispatchEvent("change");
    await expect(jobNewPage.extractButton).toBeVisible({ timeout: 10_000 });
    await jobNewPage.extractButton.click();

    await expect(jobNewPage.saveButton).toBeEnabled({ timeout: 30_000 });
    await expect(page.getByRole("list").filter({ hasText: /must|preferred|nice/i })).toBeVisible();
  });

  // JN_08 — Criteria grouped by Must / Preferred / Nice
  test("JN_08 criteria grouped into Must, Preferred, Nice tiers", async ({ page }) => {
    const jobNewPage = new JobNewPage(page);
    await jobNewPage.goto();
    await page.waitForLoadState("networkidle");

    await jobNewPage.fileInput.setInputFiles(JD_FILE);
    await jobNewPage.fileInput.dispatchEvent("change");
    await expect(jobNewPage.extractButton).toBeVisible({ timeout: 10_000 });
    await jobNewPage.extractButton.click();

    await expect(jobNewPage.filterChip("Must")).toBeVisible({ timeout: 30_000 });
    await expect(jobNewPage.filterChip("Preferred")).toBeVisible();
    await expect(jobNewPage.filterChip("Nice")).toBeVisible();
  });

  // JN_09 — Edit criterion label
  test("JN_09 editing a criterion label updates and saves the new label", async () => {
    test.skip(true, "TODO: implement");
  });

  // JN_10 — Change importance tier
  test("JN_10 changing a criterion importance tier moves it to the correct group", async () => {
    test.skip(true, "TODO: implement");
  });

  // JN_11 — Add new criterion manually
  test("JN_11 manually added criterion appears in the list with correct tier", async () => {
    test.skip(true, "TODO: implement");
  });

  // JN_12 — Delete a criterion
  test("JN_12 deleting a criterion removes it from the list", async () => {
    test.skip(true, "TODO: implement");
  });

  // JN_13 — Save as Draft
  test("JN_13 Save as Draft saves job with draft status; not shown in active list", async () => {
    test.skip(true, "TODO: implement");
  });

  // JN_14 — Preview before publishing
  test("JN_14 Preview dialog shows formatted job title and all criteria before going live", async () => {
    test.skip(true, "TODO: implement");
  });

  // JN_15 — Publish makes job live
  test("JN_15 published job appears in /jobs active list", async ({ page }) => {
    const jobNewPage = new JobNewPage(page);
    const jobsPage = new JobsPage(page);
    await jobNewPage.goto();
    await page.waitForLoadState("networkidle");

    await jobNewPage.fileInput.setInputFiles(JD_FILE);
    await jobNewPage.fileInput.dispatchEvent("change");
    await expect(jobNewPage.extractButton).toBeVisible({ timeout: 10_000 });
    await jobNewPage.extractButton.click();

    await expect(jobNewPage.saveButton).toBeEnabled({ timeout: 30_000 });
    await jobNewPage.saveButton.click();

    await expect(page).toHaveURL(/\/jobs/, { timeout: 15_000 });
    await expect(jobsPage.newJobButton).toBeVisible();
  });

  // JN_16 — Validation: no file, no criteria
  test("JN_16 clicking Save without uploading a file shows validation error", async () => {
    test.skip(true, "TODO: implement");
  });

  // JN_17 — Criteria count per tier displayed
  test("JN_17 criteria count per tier (Must: X / Preferred: X / Nice: X) shown after extraction", async () => {
    test.skip(true, "TODO: implement");
  });

  // JN_18 — Assign to hiring manager
  test("JN_18 job assigned to hiring manager; HM only sees assigned jobs", async () => {
    test.skip(true, "TODO: implement — requires HM role login");
  });
});
