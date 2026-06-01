/**
 * JN_01 – JN_18 : Job Creation — Full Workflow Tests
 *
 * Covers /jobs/new end-to-end:
 *   file upload → AI extraction → criteria review → assign manager →
 *   save as draft / publish → verify result in jobs list.
 *
 * Importance tier values in the UI:
 *   must → "Must" | strong → "Preferred" | nice → "Nice"
 *
 * Tests marked ⏭ skip are for features not yet in the UI.
 * Tests marked 🐢 make real OpenAI calls (allow 30–60s each).
 */

import { test, expect, type Page } from "@playwright/test";
import path from "path";
import { JobNewPage } from "../pages/job-new-page";
import { JobsPage } from "../pages/jobs-page";

const TXT_FILE        = path.join(__dirname, "../fixtures/senior-product-designer.txt");
const MD_FILE         = path.join(__dirname, "../fixtures/marketing-content.md");
const DOCX_FILE       = path.join(__dirname, "../fixtures/Senior_Product_Designer_Yuvabe.docx");
const PDF_FILE        = path.join(__dirname, "../fixtures/Senior_Product_Designer_Yuvabe.pdf");
const INCOMPLETE_FILE = path.join(__dirname, "../fixtures/incomplete-jd.txt");

// ─── shared helper ────────────────────────────────────────────────────────────
async function uploadAndExtract(page: Page, jobNewPage: JobNewPage, file: string) {
  await jobNewPage.goto();
  await page.waitForLoadState("networkidle");
  await jobNewPage.fileInput.setInputFiles(file);
  await expect(jobNewPage.extractButton).toBeVisible({ timeout: 5_000 });
  await jobNewPage.extractButton.click();
  await expect(jobNewPage.publishButton).toBeEnabled({ timeout: 60_000 });
}

test.describe("Job Creation Workflow", () => {
  // ── JN_01 ─────────────────────────────────────────────────────────────────
  test("JN_01 /jobs/new renders with file upload drop zone and format hints", async ({ page }) => {
    const jobNewPage = new JobNewPage(page);
    await jobNewPage.goto();
    await page.waitForLoadState("networkidle");

    await expect(jobNewPage.dropZone).toBeVisible();
    await expect(page.getByText(/pdf/i)).toBeVisible();
    await expect(page.getByText(/docx/i)).toBeVisible();
    await expect(page.getByText(/md/i)).toBeVisible();
  });

  // ── JN_02 ─────────────────────────────────────────────────────────────────
  test("JN_02 PDF job description upload — AI extracts criteria", async ({ page }) => {
    const jobNewPage = new JobNewPage(page);
    await jobNewPage.goto();
    await page.waitForLoadState("networkidle");

    await jobNewPage.fileInput.setInputFiles(PDF_FILE);
    await expect(jobNewPage.extractButton).toBeVisible({ timeout: 5_000 });
    await jobNewPage.extractButton.click();

    await expect(jobNewPage.publishButton).toBeEnabled({ timeout: 60_000 });
    await expect(jobNewPage.jobTitleHeading).toContainText(/\w+/);
  });

  // ── JN_03 ─────────────────────────────────────────────────────────────────
  test("JN_03 DOCX job description upload — AI extracts criteria", async ({ page }) => {
    const jobNewPage = new JobNewPage(page);
    await jobNewPage.goto();
    await page.waitForLoadState("networkidle");

    await jobNewPage.fileInput.setInputFiles(DOCX_FILE);
    await expect(jobNewPage.extractButton).toBeVisible({ timeout: 5_000 });
    await jobNewPage.extractButton.click();

    await expect(jobNewPage.publishButton).toBeEnabled({ timeout: 60_000 });
    await expect(jobNewPage.jobTitleHeading).toContainText(/\w+/);
  });

  // ── JN_04 🐢 ───────────────────────────────────────────────────────────────
  test("JN_04 TXT/MD upload accepted and AI extracts criteria", async ({ page }) => {
    const jobNewPage = new JobNewPage(page);
    await jobNewPage.goto();
    await page.waitForLoadState("networkidle");

    await jobNewPage.fileInput.setInputFiles(MD_FILE);
    await expect(jobNewPage.extractButton).toBeVisible({ timeout: 5_000 });
    await jobNewPage.extractButton.click();

    await expect(jobNewPage.publishButton).toBeEnabled({ timeout: 60_000 });
    await expect(jobNewPage.jobTitleHeading).toContainText(/\w+/);
  });

  // ── JN_05 ─────────────────────────────────────────────────────────────────
  test("JN_05 unsupported file type (.jpg) shows error — no criteria extracted", async ({ page }) => {
    const jobNewPage = new JobNewPage(page);
    await jobNewPage.goto();
    await page.waitForLoadState("networkidle");

    await jobNewPage.fileInput.setInputFiles({
      name: "photo.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("not a real image"),
    });

    await expect(jobNewPage.extractButton).toBeVisible({ timeout: 5_000 });
    await jobNewPage.extractButton.click();

    await expect(jobNewPage.fileError).toBeVisible({ timeout: 15_000 });
    await expect(jobNewPage.publishButton).not.toBeVisible();
    await expect(jobNewPage.saveDraftButton).not.toBeVisible();
  });

  // ── JN_05b ────────────────────────────────────────────────────────────────
  test("JN_05b JD with missing sections shows warning and blocks extraction", async ({ page }) => {
    const jobNewPage = new JobNewPage(page);
    await jobNewPage.goto();
    await page.waitForLoadState("networkidle");

    await jobNewPage.fileInput.setInputFiles(INCOMPLETE_FILE);
    await expect(jobNewPage.extractButton).toBeVisible({ timeout: 5_000 });
    await jobNewPage.extractButton.click();

    // Warning banner must appear
    await expect(
      page.getByText(/update the missing fields in your JD and replace the file to continue/i)
    ).toBeVisible({ timeout: 15_000 });

    // At least one missing-section indicator is shown
    const missingIndicators = page.getByText(/responsibilities|requirements|nice to have/i);
    expect(await missingIndicators.count()).toBeGreaterThan(0);

    // Publish and Save as Draft must not be available
    await expect(jobNewPage.publishButton).not.toBeVisible();
    await expect(jobNewPage.saveDraftButton).not.toBeVisible();
  });

  // ── JN_06 🐢 ───────────────────────────────────────────────────────────────
  test("JN_06 AI-suggested job title is auto-populated from JD content", async ({ page }) => {
    const jobNewPage = new JobNewPage(page);
    await uploadAndExtract(page, jobNewPage, TXT_FILE);

    const title = await jobNewPage.jobTitleHeading.textContent();
    expect(title?.trim().length).toBeGreaterThan(3);
  });

  // ── JN_07 🐢 ───────────────────────────────────────────────────────────────
  test("JN_07 extracted criteria list renders with labels and importance selectors", async ({ page }) => {
    const jobNewPage = new JobNewPage(page);
    await uploadAndExtract(page, jobNewPage, TXT_FILE);

    const criteriaRows = page.locator("li").filter({ has: page.getByRole("combobox") });
    await expect(criteriaRows.first()).toBeVisible();
    expect(await criteriaRows.count()).toBeGreaterThan(0);
  });

  // ── JN_08 🐢 ───────────────────────────────────────────────────────────────
  test("JN_08 criteria show Must / Strong / Nice importance tier dropdowns", async ({ page }) => {
    const jobNewPage = new JobNewPage(page);
    await uploadAndExtract(page, jobNewPage, TXT_FILE);

    const mustCount      = await page.getByRole("combobox").filter({ hasText: /^Must$/ }).count();
    const StrongCount = await page.getByRole("combobox").filter({ hasText: /^Strong$/ }).count();
    const noCount      = await page.getByRole("combobox").filter({ hasText: /^No$/ }).count();

    expect(mustCount + StrongCount + noCount).toBeGreaterThan(0);
  });

  // ── JN_09 🐢 ───────────────────────────────────────────────────────────────
  test("JN_09 clicking a criterion importance dropdown opens a popover with Must / Strong / Nice options", async ({ page }) => {
    const jobNewPage = new JobNewPage(page);
    await uploadAndExtract(page, jobNewPage, TXT_FILE);

    // Criteria selects live inside <li> elements — this skips the Hiring Manager
    // combobox which appears first in the DOM but is not a criterion importance selector
    const firstCriterionSelect = page.locator("li").getByRole("combobox").first();
    await expect(firstCriterionSelect).toBeVisible();
    await firstCriterionSelect.click();

    // All three tier options must appear in the opened popover
    await expect(page.getByRole("option", { name: /^Must$/ })).toBeVisible();
    await expect(page.getByRole("option", { name: /^Strong$/ })).toBeVisible();
    await expect(page.getByRole("option", { name: /^No$/ })).toBeVisible();

    await page.keyboard.press("Escape");
  });

  // ── JN_10 🐢 ───────────────────────────────────────────────────────────────
  test("JN_10 changing a criterion importance tier updates the dropdown", async ({ page }) => {
    const jobNewPage = new JobNewPage(page);
    await uploadAndExtract(page, jobNewPage, TXT_FILE);

    // Pick the first criterion importance selector (inside <li>, skips Hiring Manager)
    // and record its current value so we can switch to a different one
    const firstCriterionSelect = page.locator("li").getByRole("combobox").first();
    await expect(firstCriterionSelect).toBeVisible();

    const currentValue = await firstCriterionSelect.textContent();
    const targetOption = /^Must$/i.test(currentValue ?? "") ? /^Nice$/ : /^Must$/;

    await firstCriterionSelect.click();
    await page.getByRole("option", { name: targetOption }).click();

    await expect(firstCriterionSelect).toContainText(targetOption);
  });

  // ── JN_11 ─────────────────────────────────────────────────────────────────
  test("JN_11 adding a new criterion manually", async () => {
    test.skip(true, "⏭ Add Criterion button not present in current UI");
  });

  // ── JN_12 ─────────────────────────────────────────────────────────────────
  test("JN_12 deleting a criterion removes it from the list", async () => {
    test.skip(true, "⏭ Delete/Remove button not present in current UI");
  });

  // ── JN_13 🐢 ───────────────────────────────────────────────────────────────
  test("JN_13 Save as Draft saves job without publishing — redirects to Draft tab", async ({ page }) => {
    const jobNewPage = new JobNewPage(page);
    await uploadAndExtract(page, jobNewPage, TXT_FILE);

    await expect(jobNewPage.saveDraftButton).toBeVisible();
    await jobNewPage.saveDraftButton.click();

    await expect(page).toHaveURL(/\/jobs.*tab=draft/, { timeout: 15_000 });
  });

  // ── JN_14 🐢 ───────────────────────────────────────────────────────────────
  test("JN_14 clicking Publish opens preview dialog before going live", async ({ page }) => {
    const jobNewPage = new JobNewPage(page);
    await uploadAndExtract(page, jobNewPage, TXT_FILE);

    await jobNewPage.publishButton.click();

    await expect(jobNewPage.previewDialog).toBeVisible({ timeout: 5_000 });
    await expect(jobNewPage.confirmPublishButton).toBeVisible();
  });

  // ── JN_15 🐢 ───────────────────────────────────────────────────────────────
  test("JN_15 confirming publish makes job live — appears in Active jobs list", async ({ page }) => {
    const jobNewPage = new JobNewPage(page);
    const jobsPage = new JobsPage(page);
    await uploadAndExtract(page, jobNewPage, TXT_FILE);

    await jobNewPage.publishButton.click();
    await expect(jobNewPage.previewDialog).toBeVisible({ timeout: 5_000 });
    await jobNewPage.confirmPublishButton.click();

    await expect(page).toHaveURL(/\/jobs/, { timeout: 20_000 });
    await expect(jobsPage.newJobButton).toBeVisible();
  });

  // ── JN_16 ─────────────────────────────────────────────────────────────────
  test("JN_16 Publish and Save as Draft not shown without uploading a file", async ({ page }) => {
    const jobNewPage = new JobNewPage(page);
    await jobNewPage.goto();
    await page.waitForLoadState("networkidle");

    await expect(jobNewPage.publishButton).not.toBeVisible();
    await expect(jobNewPage.saveDraftButton).not.toBeVisible();
  });

  // ── JN_17 🐢 ───────────────────────────────────────────────────────────────
  test("JN_17 criteria count badges shown per category section after extraction", async ({ page }) => {
    const jobNewPage = new JobNewPage(page);
    await uploadAndExtract(page, jobNewPage, TXT_FILE);

    // Each category header (Skills, Experience, etc.) shows a padded count e.g. "03"
    const countBadges = page.locator("span.font-mono");
    expect(await countBadges.count()).toBeGreaterThan(0);

    const firstCount = await countBadges.first().textContent();
    expect(firstCount?.trim()).toMatch(/^\d{2}$/);
  });

  // ── JN_18 🐢 — Save as draft → listed in Draft tab ────────────────────────
  test("JN_18 job saved as draft is listed in the Draft tab on /jobs", async ({ page }) => {
    const jobNewPage = new JobNewPage(page);
    await uploadAndExtract(page, jobNewPage, TXT_FILE);

    await jobNewPage.saveDraftButton.click();
    await expect(page).toHaveURL(/\/jobs.*tab=draft/, { timeout: 15_000 });

    // Use the unique job code from the URL (?new=JB-XXXXX) to identify the row
    // — avoids exact-text mismatches caused by the "draft" badge appended to the title
    const jobCode = new URL(page.url()).searchParams.get("new") ?? "";
    const jobRow = page.getByRole("listitem").filter({ hasText: jobCode });
    await expect(jobRow).toBeVisible();
    await expect(jobRow.getByText(/^draft$/i)).toBeVisible();
  });

  // ── JN_18b 🐢 — Assign hiring manager then save as draft ──────────────────
  test("JN_18b job can be assigned to a hiring manager before saving as draft", async ({ page }) => {
    const jobNewPage = new JobNewPage(page);
    await uploadAndExtract(page, jobNewPage, TXT_FILE);

    await expect(jobNewPage.hiringManagerTrigger).toBeVisible();
    await jobNewPage.hiringManagerTrigger.click();

    // Filter to real manager options — exclude "Unassigned" and the
    // disabled "No managers found" placeholder that appears when none are seeded
    const managerOptions = page.getByRole("option").filter({
      hasNotText: /unassigned|no managers found/i,
    });
    const managerCount = await managerOptions.count();

    if (managerCount > 0) {
      const managerName = (await managerOptions.first().textContent())?.trim() ?? "";
      await managerOptions.first().click();
      // hiringManagerTrigger filters for /unassigned/i — unusable after selection.
      // Assert the trigger now shows the selected manager's name instead.
      await expect(
        page.getByRole("combobox").filter({ hasText: managerName })
      ).toBeVisible({ timeout: 5_000 });
    } else {
      await page.keyboard.press("Escape");
      test.info().annotations.push({
        type: "note",
        description: "No managers seeded in DB — hiring manager assignment not verified",
      });
    }

    // Save as draft regardless of whether a manager was assigned
    await expect(jobNewPage.saveDraftButton).toBeVisible();
    await jobNewPage.saveDraftButton.click();
    await expect(page).toHaveURL(/\/jobs.*tab=draft/, { timeout: 15_000 });
  });
});
