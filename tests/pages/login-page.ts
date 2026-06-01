import { type Page, type Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator("#email");
    this.passwordInput = page.locator("#pass");
    this.submitButton = page.getByRole("button", { name: /sign in/i });
    this.errorMessage = page.getByText(/email and password are required|invalid email or password/i).first();
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(user: string, pass: string) {
    await this.goto();
    // Wait for Suspense to resolve and the form to be interactive
    await this.submitButton.waitFor({ state: "visible" });
    await this.usernameInput.pressSequentially(user);
    await this.passwordInput.pressSequentially(pass);
    await Promise.all([
      this.page.waitForURL(/\/jobs/),
      this.submitButton.click(),
    ]);
  }
}
