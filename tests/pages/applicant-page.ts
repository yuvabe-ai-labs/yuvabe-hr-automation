import { type Page, type Locator } from "@playwright/test";

export class ApplicantPage {
  readonly page: Page;
  readonly candidateName: Locator;
  readonly matchScore: Locator;
  readonly matchSummary: Locator;
  /** The pre-interview status ToggleGroup (Review / Shortlist / Reject buttons) */
  readonly statusActions: Locator;
  readonly criteriaRows: Locator;
  readonly breadcrumb: Locator;

  constructor(page: Page) {
    this.page = page;
    this.candidateName = page.getByRole("heading", { level: 1 });
    this.matchScore = page.getByText(/\/\s*100/);
    this.matchSummary = page.locator("blockquote");
    this.statusActions = page.locator('button[data-state]').filter({ hasText: /^(Review|Shortlist|Reject)$/ }).first();
    this.criteriaRows = page.locator("li").filter({ hasText: "/ 10" });
    this.breadcrumb = page.locator("nav").filter({ hasText: /jobs/i }).first();
  }

  async goto(id: string) {
    await this.page.goto(`/applications/${id}`);
    await this.candidateName.waitFor({ state: "visible" });
  }
}
