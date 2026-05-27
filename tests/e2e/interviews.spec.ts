/**
 * INT_01 – INT_15 : Interview Scheduling
 * Covers /interviews list page and the Schedule Interview modal on /applications/[id].
 * Uses seeded data: app_AIEN9X_aisha (Aisha Khan, shortlisted).
 */

import { test, expect } from "@playwright/test";

const APP_ID = "app_AIEN9X_aisha";

test.describe("Interview Scheduling", () => {
  // INT_01 — Interviews list page loads
  test("INT_01 /interviews loads showing all upcoming interviews", async ({ page }) => {
    await page.goto("/interviews");
    await expect(page.getByRole("main")).toBeVisible();
  });

  // INT_02 — Interview row shows key fields
  test("INT_02 interview row shows candidate name, job title, title, date/time, and interviewers", async () => {
    test.skip(true, "TODO: implement — requires a scheduled interview in seeded data");
  });

  // INT_03 — Empty state when no interviews scheduled
  test("INT_03 empty state shown when no interviews are scheduled", async () => {
    test.skip(true, "TODO: implement");
  });

  // INT_04 — Schedule Interview button visible on applicant detail
  test("INT_04 Schedule Interview button visible when applicant is Shortlisted or Reviewing", async ({ page }) => {
    await page.goto(`/applications/${APP_ID}`);
    await expect(page.getByRole("button", { name: /schedule interview/i })).toBeVisible();
  });

  // INT_05 — Schedule Interview modal opens
  test("INT_05 clicking Schedule Interview opens modal with title, duration, location, interviewers fields", async () => {
    test.skip(true, "TODO: implement");
  });

  // INT_06 — Interview title is required
  test("INT_06 leaving title blank and clicking Send shows validation error; interview not created", async () => {
    test.skip(true, "TODO: implement");
  });

  // INT_07 — Date and time selection
  test("INT_07 selected date and time appears correctly in the modal form", async () => {
    test.skip(true, "TODO: implement");
  });

  // INT_08 — Duration dropdown options
  test("INT_08 duration dropdown shows options: 30 min, 45 min, 60 min, 90 min", async () => {
    test.skip(true, "TODO: implement");
  });

  // INT_09 — Interviewers can be selected
  test("INT_09 selecting interviewers from the list shows them in the form", async () => {
    test.skip(true, "TODO: implement");
  });

  // INT_10 — Location or meeting link input
  test("INT_10 office location or video meeting URL input accepted without errors", async () => {
    test.skip(true, "TODO: implement");
  });

  // INT_11 — Email preview in modal
  test("INT_11 email preview shows correctly formatted invitation with candidate name and details", async () => {
    test.skip(true, "TODO: implement");
  });

  // INT_12 — Successful interview scheduling
  test("INT_12 filling all fields and clicking Send creates interview; modal closes; status updates to Interview Scheduled", async () => {
    test.skip(true, "TODO: implement");
  });

  // INT_13 — Interview card appears on applicant detail
  test("INT_13 interview card shown in Interviews section after scheduling", async () => {
    test.skip(true, "TODO: implement");
  });

  // INT_14 — Status auto-updates to Interview Scheduled
  test("INT_14 applicant status badge changes to Interview Scheduled after scheduling", async () => {
    test.skip(true, "TODO: implement");
  });

  // INT_15 — Cancelling modal does not create interview
  test("INT_15 cancelling the modal does not create an interview; status unchanged", async () => {
    test.skip(true, "TODO: implement");
  });
});
