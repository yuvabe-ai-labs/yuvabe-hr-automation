/**
 * DRAFT_01 – DRAFT_09 : Draft Jobs
 * Covers job draft/publish flow — saving as draft, JD preview dialog, publishing.
 * Uses seeded data — expects at least one draft job.
 */

import { test, expect } from "@playwright/test";
import { JobsPage } from "../pages/jobs-page";

test.describe("Draft Jobs", () => {
  // DRAFT_01 — Save as Draft saves job without publishing
  test("DRAFT_01 Save as Draft saves job with draft status; not shown in Active tab", async () => {
    test.skip(true, "TODO: implement — create job, click Save as Draft, check not in Active tab");
  });

  // DRAFT_02 — Draft jobs visible in jobs list
  test("DRAFT_02 draft jobs are displayed with a Draft badge in the jobs list", async ({ page }) => {
    const jobsPage = new JobsPage(page);
    await jobsPage.goto();

    await expect(page.getByText(/draft/i).first()).toBeVisible();
  });

  // DRAFT_03 — Draft job does not appear in Active tab
  test("DRAFT_03 draft job does not appear in the Active tab", async () => {
    test.skip(true, "TODO: implement");
  });

  // DRAFT_04 — Actions menu on draft job shows Publish option
  test("DRAFT_04 actions menu on draft job row shows Publish option (not Archive)", async () => {
    test.skip(true, "TODO: implement");
  });

  // DRAFT_05 — JD preview dialog opens before publishing
  test("DRAFT_05 clicking Publish on a draft job opens JD preview dialog", async () => {
    test.skip(true, "TODO: implement");
  });

  // DRAFT_06 — Preview dialog shows all criteria
  test("DRAFT_06 JD preview dialog shows all criteria grouped by Must/Preferred/Nice", async () => {
    test.skip(true, "TODO: implement");
  });

  // DRAFT_07 — Publish from preview makes job live
  test("DRAFT_07 clicking Publish in the preview dialog makes job appear in Active tab", async () => {
    test.skip(true, "TODO: implement");
  });

  // DRAFT_08 — Cancelling preview does not publish
  test("DRAFT_08 cancelling the preview dialog keeps job in draft status", async () => {
    test.skip(true, "TODO: implement");
  });

  // DRAFT_09 — Published job no longer shows Publish action
  test("DRAFT_09 after publishing, actions menu shows Archive instead of Publish", async () => {
    test.skip(true, "TODO: implement");
  });
});
