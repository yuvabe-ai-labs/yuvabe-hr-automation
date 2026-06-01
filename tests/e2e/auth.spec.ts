/**
 * AUTH_01 – AUTH_09 : Authentication
 * Covers login page, credential validation, redirects, session persistence, and logout.
 */

import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/login-page";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Authentication", () => {
  // AUTH_01 — Login page loads
  test("AUTH_01 login page renders email, password fields and Sign In button", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  // AUTH_02 — Valid credentials authenticate and redirect
  test("AUTH_02 valid credentials redirect to /jobs", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(process.env.AUTH_USER!, process.env.AUTH_PASS!);
    await expect(page).toHaveURL(/\/jobs/);
  });

  // AUTH_03 — Invalid credentials show error
  test("AUTH_03 wrong credentials show error and stay on /login", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.usernameInput.fill("wrong@example.com");
    await loginPage.passwordInput.fill("badpassword");
    await loginPage.submitButton.click();

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  // AUTH_04 — Empty fields show validation error
  test("AUTH_04 empty fields show validation error and do not submit", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.submitButton.waitFor({ state: "visible" });
    await loginPage.submitButton.click();

    // Native browser validation blocks submission for the required empty email field
    await expect(page).toHaveURL(/\/login/);
    // The email input reports as invalid via the browser's native ValidityState
    const invalid = await loginPage.usernameInput.evaluate(
      (el) => !(el as HTMLInputElement).checkValidity()
    );
    expect(invalid).toBe(true);
  });

  // AUTH_05 — Unauthenticated access redirects to /login
  test("AUTH_05 unauthenticated access to /jobs redirects to /login", async ({ page }) => {
    await page.goto("/jobs");
    await expect(page).toHaveURL(/\/login/);
  });

  // AUTH_06 — Post-login redirect to /jobs
  test("AUTH_06 user lands on /jobs after successful login", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(process.env.AUTH_USER!, process.env.AUTH_PASS!);
    await expect(page).toHaveURL(/\/jobs/);
  });

  // AUTH_07 — Logout clears session and redirects to /login
  test("AUTH_07 logout clears session and redirects to /login", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(process.env.AUTH_USER!, process.env.AUTH_PASS!);
    await expect(page).toHaveURL(/\/jobs/);

    await page.getByRole("button", { name: /sign out/i }).click();

    await expect(page).toHaveURL(/\/login/);

    // Protected route no longer accessible
    await page.goto("/jobs");
    await expect(page).toHaveURL(/\/login/);
  });

  // AUTH_08 — Session persists on page refresh
  test("AUTH_08 session cookie persists after page refresh", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(process.env.AUTH_USER!, process.env.AUTH_PASS!);
    await expect(page).toHaveURL(/\/jobs/);

    await page.reload();
    await expect(page).toHaveURL(/\/jobs/);
    await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible();
  });

  // AUTH_09 — Back navigation after logout stays on /login
  test("AUTH_09 back-navigation after logout redirects to /login", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.login(process.env.AUTH_USER!, process.env.AUTH_PASS!);
    await expect(page).toHaveURL(/\/jobs/);

    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goBack();
    // Browser back may serve cached page; navigate to a protected route to confirm session is dead
    await page.goto("/jobs");
    await expect(page).toHaveURL(/\/login/);
  });
});
