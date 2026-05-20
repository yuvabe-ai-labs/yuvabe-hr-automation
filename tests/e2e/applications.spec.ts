/**
 * Applications list page tests — /applications
 * Cross-job view of all applications. Uses seeded data (21 applications across 3 jobs).
 */

import { test, expect } from "@playwright/test";
import { ApplicationsPage } from "../pages/applications-page";

test.describe("Applications list page", () => {
  test("shows page heading", async ({ page }) => {
    const applicationsPage = new ApplicationsPage(page);
    await applicationsPage.goto();

    await expect(applicationsPage.heading).toBeVisible();
  });

  test("search input is visible", async ({ page }) => {
    const applicationsPage = new ApplicationsPage(page);
    await applicationsPage.goto();

    await expect(applicationsPage.searchInput).toBeVisible();
  });

  test("status filter updates URL", async ({ page }) => {
    const applicationsPage = new ApplicationsPage(page);
    await applicationsPage.goto();

    await applicationsPage.statusFilter("shortlisted").click();
    await expect(page).toHaveURL(/status=shortlisted/);
  });

  test("clear filter removes status from URL", async ({ page }) => {
    await page.goto("/applications?status=shortlisted");
    const applicationsPage = new ApplicationsPage(page);

    await applicationsPage.statusFilter("all").click();
    await expect(page).not.toHaveURL(/status=/);
  });
});
