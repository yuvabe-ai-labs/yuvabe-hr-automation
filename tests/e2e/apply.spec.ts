/**
 * APPL_01 – APPL_10 : Apply Flow
 * Covers /apply — public application form, file uploads, submission, validation.
 */

import { test, expect } from "@playwright/test";

test.describe("Apply Flow", () => {
  // APPL_01 — Apply page loads
  test("APPL_01 /apply renders with file upload and cover letter fields", async ({ page }) => {
    await page.goto("/apply");
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByText(/upload|resume|cv/i).first()).toBeVisible();
  });

  // APPL_02 — PDF resume upload accepted
  test("APPL_02 PDF resume upload accepted; filename displayed with no errors", async () => {
    test.skip(true, "TODO: implement");
  });

  // APPL_03 — DOCX resume upload accepted
  test("APPL_03 DOCX resume upload accepted and processed correctly", async () => {
    test.skip(true, "TODO: implement");
  });

  // APPL_05 — Unsupported file type rejected
  test("APPL_05 unsupported file type (.jpg) as resume shows error and is rejected", async () => {
    test.skip(true, "TODO: implement");
  });

  // APPL_08 — Successful submission confirmation
  test("APPL_08 completing and submitting the form shows success confirmation", async () => {
    test.skip(true, "TODO: implement — use real resume fixture");
  });

  // APPL_09 — Application appears in recruiter's jobs list
  test("APPL_09 submitted application appears in the ranked list for the correct job", async () => {
    test.skip(true, "TODO: implement — submit via /apply, verify in /jobs/[code]");
  });

  // APPL_10 — Validation when no resume provided
  test("APPL_10 submitting without uploading a resume shows validation error", async () => {
    test.skip(true, "TODO: implement");
  });
});
