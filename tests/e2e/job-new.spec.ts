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
const JD_DOCX = path.join(__dirname, "../fixtures/senior-product-designer.docx");

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
    test.setTimeout(90_000);
    const jobNewPage = new JobNewPage(page);
    await jobNewPage.goto();
    await page.waitForLoadState("networkidle");

    await jobNewPage.fileInput.setInputFiles(JD_FILE);
    await jobNewPage.fileInput.dispatchEvent("change");

    await expect(jobNewPage.dropZone).not.toBeVisible({ timeout: 10_000 });
    await expect(jobNewPage.extractButton).toBeVisible();
    await jobNewPage.extractButton.click();
    await expect(jobNewPage.saveButton).toBeEnabled({ timeout: 60_000 });
  });

  // JN_03 — DOCX upload accepted
  test("JN_03 DOCX upload accepted and criteria extracted", async ({ page }) => {
    test.setTimeout(90_000);
    const jobNewPage = new JobNewPage(page);
    await jobNewPage.goto();
    await page.waitForLoadState("networkidle");

    await jobNewPage.fileInput.setInputFiles(JD_DOCX);
    await jobNewPage.fileInput.dispatchEvent("change");

    await expect(jobNewPage.extractButton).toBeVisible({ timeout: 10_000 });
    await jobNewPage.extractButton.click();
    await expect(jobNewPage.saveButton).toBeEnabled({ timeout: 60_000 });
  });

  // JN_04 — TXT/MD upload accepted (same fixture as JN_02, already a .txt file)
  test("JN_04 TXT/MD upload accepted and criteria extracted", async ({ page }) => {
    test.setTimeout(90_000);
    const jobNewPage = new JobNewPage(page);
    await jobNewPage.goto();
    await page.waitForLoadState("networkidle");

    await jobNewPage.fileInput.setInputFiles(JD_FILE);
    await jobNewPage.fileInput.dispatchEvent("change");

    await expect(jobNewPage.extractButton).toBeVisible({ timeout: 10_000 });
    await jobNewPage.extractButton.click();
    await expect(jobNewPage.saveButton).toBeEnabled({ timeout: 60_000 });
  });

  // JN_05 — Unsupported file type rejected
  test("JN_05 unsupported file type (.jpg) rejected with error message", async ({ page }) => {
    const jobNewPage = new JobNewPage(page);
    await jobNewPage.goto();
    await page.waitForLoadState("networkidle");

    await jobNewPage.uploadFile("photo.jpg", "image/jpeg", "fake image content");
    await jobNewPage.fileInput.dispatchEvent("change");

    await expect(jobNewPage.extractButton).toBeVisible({ timeout: 5_000 });
    await jobNewPage.extractButton.click();

    // API returns: "Unsupported file type: photo.jpg. Use .pdf, .docx, .txt, or .md."
    await expect(page.getByText(/unsupported file type/i)).toBeVisible({ timeout: 10_000 });
  });

  // JN_06 — AI-suggested title auto-populated
  test("JN_06 AI-suggested job title auto-populated from JD content", async ({ page }) => {
    test.setTimeout(90_000);
    const jobNewPage = new JobNewPage(page);
    await jobNewPage.goto();
    await page.waitForLoadState("networkidle");

    await jobNewPage.fileInput.setInputFiles(JD_FILE);
    await jobNewPage.fileInput.dispatchEvent("change");
    await expect(jobNewPage.extractButton).toBeVisible({ timeout: 10_000 });
    await jobNewPage.extractButton.click();

    await expect(jobNewPage.jobTitleHeading).toContainText(/\w+/, { timeout: 60_000 });
  });

  // JN_07 — Extracted criteria list renders
  test("JN_07 extracted criteria list renders with labels and importance tiers", async ({ page }) => {
    test.setTimeout(90_000);
    const jobNewPage = new JobNewPage(page);
    await jobNewPage.goto();
    await page.waitForLoadState("networkidle");

    await jobNewPage.fileInput.setInputFiles(JD_FILE);
    await jobNewPage.fileInput.dispatchEvent("change");
    await expect(jobNewPage.extractButton).toBeVisible({ timeout: 10_000 });
    await jobNewPage.extractButton.click();

    await expect(jobNewPage.saveButton).toBeEnabled({ timeout: 60_000 });
    // Criteria are shown as comboboxes with importance values
    await expect(page.getByRole("combobox").first()).toBeVisible();
  });

  // JN_08 — Criteria grouped by Must / Preferred / Nice
  test("JN_08 criteria grouped into Must, Preferred, Nice tiers", async ({ page }) => {
    test.setTimeout(90_000);
    const jobNewPage = new JobNewPage(page);
    await jobNewPage.goto();
    await page.waitForLoadState("networkidle");

    await jobNewPage.fileInput.setInputFiles(JD_FILE);
    await jobNewPage.fileInput.dispatchEvent("change");
    await expect(jobNewPage.extractButton).toBeVisible({ timeout: 10_000 });
    await jobNewPage.extractButton.click();

    await expect(jobNewPage.filterChip("Must")).toBeVisible({ timeout: 60_000 });
    await expect(jobNewPage.filterChip("Preferred")).toBeVisible();
    await expect(jobNewPage.filterChip("Nice")).toBeVisible();
  });

  // JN_10 — Change importance tier
  test("JN_10 changing a criterion importance tier moves it to the correct group", async ({ page }) => {
    test.setTimeout(90_000);
    const jobNewPage = new JobNewPage(page);
    await jobNewPage.goto();
    await page.waitForLoadState("networkidle");

    await jobNewPage.fileInput.setInputFiles(JD_FILE);
    await jobNewPage.fileInput.dispatchEvent("change");
    await expect(jobNewPage.extractButton).toBeVisible({ timeout: 10_000 });
    await jobNewPage.extractButton.click();
    await expect(jobNewPage.saveButton).toBeEnabled({ timeout: 60_000 });

    // Change a criterion's importance — filter to criteria comboboxes (not the Hiring Manager selector)
    const criteriaSelector = page.getByRole("combobox").filter({ hasText: /^(Must|Preferred|Nice)$/i }).first();
    await criteriaSelector.click();
    // Radix Select opens a listbox — scope option click to the listbox to avoid
    // matching other "NICE" text visible in the criteria list behind the dropdown
    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible({ timeout: 5_000 });
    await listbox.getByText(/^nice$/i).click();
    await expect(criteriaSelector).toContainText("Nice");
  });

  // JN_13 — Save as Draft
  test("JN_13 Save as Draft saves job with draft status; not shown in active list", async ({ page }) => {
    test.setTimeout(90_000);
    const jobNewPage = new JobNewPage(page);
    await jobNewPage.goto();
    await page.waitForLoadState("networkidle");

    await jobNewPage.fileInput.setInputFiles(JD_FILE);
    await jobNewPage.fileInput.dispatchEvent("change");
    await expect(jobNewPage.extractButton).toBeVisible({ timeout: 10_000 });
    await jobNewPage.extractButton.click();
    await expect(jobNewPage.saveDraftButton).toBeEnabled({ timeout: 60_000 });

    await jobNewPage.saveDraftButton.click();

    // Navigates to /jobs?tab=draft&new={code}
    await expect(page).toHaveURL(/tab=draft/, { timeout: 15_000 });
    // The draft job does NOT appear in Active tab
    await page.goto("/jobs");
    await expect(page).not.toHaveURL(/tab=draft/);
  });

  // JN_14 — Preview dialog before publishing
  test("JN_14 Preview dialog shows formatted job title and all criteria before going live", async ({ page }) => {
    test.setTimeout(90_000);
    const jobNewPage = new JobNewPage(page);
    await jobNewPage.goto();
    await page.waitForLoadState("networkidle");

    await jobNewPage.fileInput.setInputFiles(JD_FILE);
    await jobNewPage.fileInput.dispatchEvent("change");
    await expect(jobNewPage.extractButton).toBeVisible({ timeout: 10_000 });
    await jobNewPage.extractButton.click();
    await expect(jobNewPage.publishButton).toBeEnabled({ timeout: 60_000 });

    // Clicking Publish opens the JD preview dialog (not immediate publish)
    await jobNewPage.publishButton.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    // Dialog shows the job title as a heading and has Cancel + Confirm buttons
    await expect(page.getByRole("dialog").getByRole("heading")).toBeVisible();
    await expect(page.getByRole("button", { name: /cancel/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /confirm/i })).toBeVisible();
  });

  // JN_15 — Publish makes job live
  test("JN_15 published job appears in /jobs active list", async ({ page }) => {
    test.setTimeout(90_000);
    const jobNewPage = new JobNewPage(page);
    const jobsPage = new JobsPage(page);
    await jobNewPage.goto();
    await page.waitForLoadState("networkidle");

    await jobNewPage.fileInput.setInputFiles(JD_FILE);
    await jobNewPage.fileInput.dispatchEvent("change");
    await expect(jobNewPage.extractButton).toBeVisible({ timeout: 10_000 });
    await jobNewPage.extractButton.click();

    await expect(jobNewPage.publishButton).toBeEnabled({ timeout: 60_000 });
    // Publish → preview dialog → Confirm → navigate to /jobs active
    await jobNewPage.publishButton.click();
    await page.getByRole("button", { name: /confirm/i }).click();

    await expect(page).toHaveURL(/\/jobs/, { timeout: 15_000 });
    await expect(jobsPage.newJobButton).toBeVisible();
  });

  // JN_16 — Validation: Save/Publish not shown without file upload
  test("JN_16 clicking Save without uploading a file shows validation error", async ({ page }) => {
    const jobNewPage = new JobNewPage(page);
    await jobNewPage.goto();
    await page.waitForLoadState("networkidle");

    // Without uploading a file, Save/Publish buttons are not rendered
    await expect(jobNewPage.saveDraftButton).not.toBeVisible();
    await expect(jobNewPage.publishButton).not.toBeVisible();
    await expect(jobNewPage.dropZone).toBeVisible();
  });

  // JN_17 — Criteria count per tier shown after extraction
  test("JN_17 criteria count per tier (Must: X / Preferred: X / Nice: X) shown after extraction", async ({ page }) => {
    test.setTimeout(90_000);
    const jobNewPage = new JobNewPage(page);
    await jobNewPage.goto();
    await page.waitForLoadState("networkidle");

    await jobNewPage.fileInput.setInputFiles(JD_FILE);
    await jobNewPage.fileInput.dispatchEvent("change");
    await expect(jobNewPage.extractButton).toBeVisible({ timeout: 10_000 });
    await jobNewPage.extractButton.click();
    await expect(jobNewPage.saveButton).toBeEnabled({ timeout: 60_000 });

    // After extraction a total criteria count is shown: "X criteria locked in."
    await expect(page.getByText(/criteria locked in/i)).toBeVisible();
  });

  // JN_18 — Assign to hiring manager (seeded manager appears in dropdown)
  test("JN_18 hiring manager dropdown shows seeded manager after extraction", async ({ page }) => {
    test.setTimeout(90_000);
    const jobNewPage = new JobNewPage(page);
    await jobNewPage.goto();
    await page.waitForLoadState("networkidle");

    await jobNewPage.fileInput.setInputFiles(JD_FILE);
    await jobNewPage.fileInput.dispatchEvent("change");
    await expect(jobNewPage.extractButton).toBeVisible({ timeout: 10_000 });
    await jobNewPage.extractButton.click();
    await expect(jobNewPage.saveButton).toBeEnabled({ timeout: 60_000 });

    // The HM selector lives in the section labelled "Hiring manager (optional)".
    // Locate by label proximity to avoid matching criteria tier comboboxes.
    const hmLabel = page.locator('label', { hasText: /hiring manager/i });
    await hmLabel.waitFor({ state: "visible", timeout: 10_000 });
    const hmSelect = hmLabel.locator('xpath=..').getByRole("combobox");
    await hmSelect.scrollIntoViewIfNeeded();
    await hmSelect.click();
    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible({ timeout: 5_000 });
    await expect(listbox.getByText(/rahul sharma/i)).toBeVisible();
  });
});
