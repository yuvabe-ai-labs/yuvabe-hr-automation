import { type Page, type Locator } from "@playwright/test";

export class ApplicantPage {
  readonly page: Page;
  readonly candidateName: Locator;
  readonly matchScore: Locator;
  readonly matchSummary: Locator;
  readonly statusActions: Locator;
  readonly criteriaRows: Locator;
  readonly breadcrumb: Locator;

  constructor(page: Page) {
    this.page = page;
    this.candidateName = page.getByRole("heading", { level: 1 });
    this.matchScore = page.getByText(/\/\s*100/);
    this.matchSummary = page.getByRole("blockquote");
    this.statusActions = page.getByRole("radio", { name: /Shortlist/i });
    this.criteriaRows = page.locator("li").filter({ hasText: "/ 10" });
    this.breadcrumb = page.locator("aside nav");
  }

  async goto(id: string) {
    await this.page.goto(`/applications/${id}`);
  }
}
