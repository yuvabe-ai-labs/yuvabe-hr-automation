/**
 * DRAFT_01 – DRAFT_09 : Draft Jobs — Full Workflow Tests
 *
 * Covers the Draft tab in /jobs:
 *   save as draft → verify in Draft tab → actions menu → preview dialog →
 *   cancel (stays draft) → confirm publish → verify in Active tab.
 *
 * SETUP: beforeAll creates one draft job via AI extraction.
 * We track the JOB CODE (unique per job) so repeated runs never
 * accidentally match jobs published by previous runs.
 *
 * 🐢 beforeAll makes a real OpenAI call — allow 60s for extraction.
 */

import { test, expect, type Page } from "@playwright/test";
import path from "path";
import { JobNewPage } from "../pages/job-new-page";

const TXT_FILE = path.join(__dirname, "../fixtures/senior-product-designer.txt");
const SESSION  = path.join(__dirname, "../.auth/session.json");

// Unique identifiers captured in beforeAll and used across all tests
let draftJobTitle = "";
let draftJobCode  = ""; // e.g. "JB-TAYJM6" — unique per job, won't clash with old runs

// ─── shared helpers ────────────────────────────────────────────────────────────

async function openDraftTab(page: Page) {
  await page.goto("/jobs?tab=draft");
  await page.waitForLoadState("networkidle");
}

/** Find the specific job row by its unique code badge */
function jobRow(page: Page) {
  return page.getByRole("listitem").filter({ hasText: draftJobCode });
}

async function openActionsMenu(page: Page) {
  await jobRow(page)
    .getByRole("button", { name: /more actions/i })
    .click();
}

// ─── suite ────────────────────────────────────────────────────────────────────

test.describe("Draft Jobs Workflow", () => {
  test.describe.configure({ mode: "serial" });

  // Create one draft job before all tests run
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: SESSION });
    const page = await context.newPage();
    const jobNewPage = new JobNewPage(page);

    await jobNewPage.goto();
    await page.waitForLoadState("networkidle");
    await jobNewPage.fileInput.setInputFiles(TXT_FILE);
    await expect(jobNewPage.extractButton).toBeVisible({ timeout: 5_000 });
    await jobNewPage.extractButton.click();
    await expect(jobNewPage.publishButton).toBeEnabled({ timeout: 60_000 });

    draftJobTitle = (await jobNewPage.jobTitleHeading.textContent())?.trim() ?? "";

    await jobNewPage.saveDraftButton.click();

    // URL becomes /jobs?tab=draft&new=<code> — extract the unique code
    await page.waitForURL(/\/jobs.*tab=draft/, { timeout: 15_000 });
    draftJobCode = new URL(page.url()).searchParams.get("new") ?? "";

    await context.close();
  });

  // ── DRAFT_01 ──────────────────────────────────────────────────────────────
  test("DRAFT_01 job saved as draft appears in the Draft tab — not Active", async ({ page }) => {
    await openDraftTab(page);

    // Identify by unique job code — immune to title collisions from prior runs
    await expect(jobRow(page)).toBeVisible();

    // Switch to Active tab — this specific job must not be there
    await page.getByRole("link", { name: /^Active$/ }).click();
    await page.waitForLoadState("networkidle");
    await expect(jobRow(page)).not.toBeVisible();
  });

  // ── DRAFT_02 ──────────────────────────────────────────────────────────────
  test("DRAFT_02 draft job row shows a draft badge/indicator", async ({ page }) => {
    await openDraftTab(page);

    await expect(jobRow(page)).toBeVisible();
    await expect(jobRow(page).getByText(/^draft$/i)).toBeVisible();
  });

  // ── DRAFT_03 ──────────────────────────────────────────────────────────────
  test("DRAFT_03 draft job does not appear in the Active tab", async ({ page }) => {
    await page.goto("/jobs");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("link", { name: /^Active$/ })).toBeVisible();
    await expect(jobRow(page)).not.toBeVisible();
  });

  // ── DRAFT_04 ──────────────────────────────────────────────────────────────
  test("DRAFT_04 actions menu on a draft job shows Publish — not Archive", async ({ page }) => {
    await openDraftTab(page);

    await openActionsMenu(page);

    await expect(page.getByRole("menuitem", { name: /^publish$/i })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /^archive$/i })).not.toBeVisible();
  });

  // ── DRAFT_05 ──────────────────────────────────────────────────────────────
  test("DRAFT_05 clicking Publish in actions menu opens the JD preview dialog", async ({ page }) => {
    await openDraftTab(page);

    await openActionsMenu(page);
    await page.getByRole("menuitem", { name: /^publish$/i }).click();

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole("button", { name: /^confirm$/i })).toBeVisible();

    // Close without publishing
    await page.getByRole("button", { name: /cancel/i }).click();
  });

  // ── DRAFT_06 ──────────────────────────────────────────────────────────────
  test("DRAFT_06 preview dialog shows the job title and criteria tiers", async ({ page }) => {
    await openDraftTab(page);

    await openActionsMenu(page);
    await page.getByRole("menuitem", { name: /^publish$/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Title appears in the dialog
    await expect(dialog.getByText(new RegExp(draftJobTitle, "i")).first()).toBeVisible();

    // At least one importance tier label is present
    const tierCount =
      (await dialog.getByText(/must/i).count()) +
      (await dialog.getByText(/preferred/i).count()) +
      (await dialog.getByText(/nice/i).count());
    expect(tierCount).toBeGreaterThan(0);

    await page.getByRole("button", { name: /cancel/i }).click();
  });

  // ── DRAFT_08 (before DRAFT_07 — must test cancel before we publish) ────────
  test("DRAFT_08 cancelling the preview dialog leaves the job in Draft", async ({ page }) => {
    await openDraftTab(page);

    await openActionsMenu(page);
    await page.getByRole("menuitem", { name: /^publish$/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });
    await page.getByRole("button", { name: /cancel/i }).click();

    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Job must still be in Draft tab
    await openDraftTab(page);
    await expect(jobRow(page)).toBeVisible();
  });

  // ── DRAFT_07 ──────────────────────────────────────────────────────────────
  test("DRAFT_07 confirming Publish moves job from Draft to Active tab", async ({ page }) => {
    await openDraftTab(page);

    await openActionsMenu(page);
    await page.getByRole("menuitem", { name: /^publish$/i }).click();

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });
    await page.getByRole("button", { name: /^confirm$/i }).click();

    // Job disappears from Draft tab
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10_000 });
    await expect(jobRow(page)).not.toBeVisible({ timeout: 10_000 });

    // Job appears in Active tab (identified by its unique code)
    await page.goto("/jobs");
    await page.waitForLoadState("networkidle");
    await expect(jobRow(page)).toBeVisible({ timeout: 10_000 });
  });

  // ── DRAFT_09 ──────────────────────────────────────────────────────────────
  test("DRAFT_09 published job shows Archive — not Publish — in actions menu", async ({ page }) => {
    await page.goto("/jobs");
    await page.waitForLoadState("networkidle");

    await expect(jobRow(page)).toBeVisible({ timeout: 10_000 });

    await openActionsMenu(page);

    await expect(page.getByRole("menuitem", { name: /^archive$/i })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /^publish$/i })).not.toBeVisible();
  });
});
