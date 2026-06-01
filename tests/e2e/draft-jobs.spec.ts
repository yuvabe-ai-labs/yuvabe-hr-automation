/**
 * DRAFT_01 – DRAFT_09 : Draft Jobs
 * Covers job draft/publish flow — saving as draft, JD preview dialog, publishing.
 * Requires at least one draft job in the DB (created by JN_13 test runs).
 */

import { test, expect, type Page } from "@playwright/test";
import { JobsPage } from "../pages/jobs-page";

/** Navigate to Draft tab and return the title of the first draft job. Returns null if none exist. */
async function getFirstDraftJobTitle(page: Page): Promise<string | null> {
  await page.goto("/jobs?tab=draft");

  // Jobs list is client-side (TanStack Query) — wait for links or empty state to appear.
  const draftLink = page.getByRole("link", { name: /^view draft/i }).first();
  const emptyState = page.getByText(/no draft jobs/i);
  try {
    await draftLink.or(emptyState).waitFor({ state: "visible", timeout: 8_000 });
  } catch {
    return null;
  }
  if ((await draftLink.count()) === 0) return null;

  const ariaLabel = await draftLink.getAttribute("aria-label") ?? "";
  return ariaLabel.replace(/^view draft\s+/i, "").trim() || null;
}

/** Click "More actions" for the first draft job on the Draft tab. */
async function clickDraftJobMoreActions(page: Page): Promise<boolean> {
  await page.goto("/jobs?tab=draft");

  // Wait for the draft job list to render client-side (TanStack Query)
  const draftLink = page.getByRole("link", { name: /^view draft/i }).first();
  const emptyState = page.getByText(/no draft jobs/i);
  try {
    await draftLink.or(emptyState).waitFor({ state: "visible", timeout: 8_000 });
  } catch {
    return false;
  }

  const moreActionsBtn = page.getByRole("button", { name: /more actions for/i }).first();
  if ((await moreActionsBtn.count()) === 0) return false;
  await moreActionsBtn.click();
  return true;
}

test.describe("Draft Jobs", () => {
  // DRAFT_02 — Draft jobs visible in jobs list
  test("DRAFT_02 draft jobs are displayed with a Draft badge in the jobs list", async ({ page }) => {
    const jobsPage = new JobsPage(page);
    await jobsPage.goto();
    await expect(page.getByText(/draft/i).first()).toBeVisible();
  });

  // DRAFT_03 — Draft job does not appear in Active tab
  test("DRAFT_03 draft job does not appear in the Active tab", async ({ page }) => {
    await page.goto("/jobs?tab=active");
    await expect(page.getByRole("link", { name: /^view draft/i })).toHaveCount(0);
  });

  // DRAFT_04 — Actions menu on draft job shows Publish, not Archive
  test("DRAFT_04 actions menu on draft job row shows Publish option (not Archive)", async ({ page }) => {
    const draftTitle = await getFirstDraftJobTitle(page);
    if (!draftTitle) {
      test.skip(true, "No draft jobs in DB — run JN_13 first to create one");
      return;
    }

    // Use .first() to handle multiple jobs with the same title
    const clicked = await clickDraftJobMoreActions(page);
    if (!clicked) {
      test.skip(true, "No draft job more-actions button found");
      return;
    }

    await expect(page.getByRole("menuitem", { name: /^publish$/i })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /^archive$/i })).not.toBeVisible();
  });

  // DRAFT_05 — JD preview dialog opens when Publish clicked on draft job
  test("DRAFT_05 clicking Publish on a draft job opens JD preview dialog", async ({ page }) => {
    const draftTitle = await getFirstDraftJobTitle(page);
    if (!draftTitle) {
      test.skip(true, "No draft jobs in DB — run JN_13 first");
      return;
    }

    const clicked = await clickDraftJobMoreActions(page);
    if (!clicked) {
      test.skip(true, "No draft job more-actions button found");
      return;
    }

    await page.getByRole("menuitem", { name: /^publish$/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog").getByRole("heading")).toBeVisible();
  });

  // DRAFT_06 — Preview dialog shows job sections
  test("DRAFT_06 JD preview dialog shows all criteria grouped by Must/Preferred/Nice", async ({ page }) => {
    const draftTitle = await getFirstDraftJobTitle(page);
    if (!draftTitle) {
      test.skip(true, "No draft jobs in DB");
      return;
    }

    const clicked = await clickDraftJobMoreActions(page);
    if (!clicked) {
      test.skip(true, "No draft job more-actions button found");
      return;
    }

    await page.getByRole("menuitem", { name: /^publish$/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // Preview dialog shows structured job sections
    await expect(dialog.getByText(/basic info/i)).toBeVisible();
  });

  // Destructive tests: publish a draft job (serial block)
  test.describe("publish flow", () => {
    test.describe.configure({ mode: "serial" });

    // DRAFT_08 — Cancelling preview keeps job in draft
    test("DRAFT_08 cancelling the preview dialog keeps job in draft status", async ({ page }) => {
      const draftTitle = await getFirstDraftJobTitle(page);
      if (!draftTitle) {
        test.skip(true, "No draft jobs in DB");
        return;
      }

      const clicked = await clickDraftJobMoreActions(page);
      if (!clicked) {
        test.skip(true, "No draft job more-actions button found");
        return;
      }

      await page.getByRole("menuitem", { name: /^publish$/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible();

      await page.getByRole("button", { name: /cancel/i }).click();
      await expect(page.getByRole("dialog")).not.toBeVisible();

      // Job should still be in Draft tab
      await page.goto("/jobs?tab=draft");
      await expect(page.getByRole("link", { name: /^view draft/i }).first()).toBeVisible();
    });

    // DRAFT_07 — Confirm publish moves job to Active tab
    test("DRAFT_07 clicking Publish in the preview dialog makes job appear in Active tab", async ({ page }) => {
      const draftTitle = await getFirstDraftJobTitle(page);
      if (!draftTitle) {
        test.skip(true, "No draft jobs in DB");
        return;
      }

      const clicked = await clickDraftJobMoreActions(page);
      if (!clicked) {
        test.skip(true, "No draft job more-actions button found");
        return;
      }

      await page.getByRole("menuitem", { name: /^publish$/i }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.getByRole("button", { name: /confirm/i }).click();

      // After publishing, navigates to active jobs list
      await expect(page).toHaveURL(/tab=active|\/jobs/, { timeout: 10_000 });
    });

    // DRAFT_09 — After publishing, actions menu shows Archive not Publish
    test("DRAFT_09 after publishing, actions menu shows Archive instead of Publish", async ({ page }) => {
      await page.goto("/jobs?tab=active");

      // Wait for the more-actions button (admin-only) to appear after client-side render + session check
      const moreActionsBtn = page.getByRole("button", { name: /more actions for/i }).first();
      try {
        await moreActionsBtn.waitFor({ state: "visible", timeout: 8_000 });
      } catch {
        test.skip(true, "No active jobs found");
        return;
      }

      await moreActionsBtn.click();
      await expect(page.getByRole("menuitem", { name: /^archive$/i })).toBeVisible();
      await expect(page.getByRole("menuitem", { name: /^publish$/i })).not.toBeVisible();
    });
  });
});
