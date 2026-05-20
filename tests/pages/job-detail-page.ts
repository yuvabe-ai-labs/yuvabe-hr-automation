import { type Page, type Locator } from "@playwright/test";

// Filter tab labels as rendered in the UI
const FILTER_LABEL: Record<string, string> = {
  all: "All",
  new: "New",
  reviewing: "Review",
  shortlisted: "Shortlist",
  rejected: "Reject",
};

export class JobDetailPage {
  readonly page: Page;
  readonly backLink: Locator;
  readonly jobTitle: Locator;
  readonly applicantCount: Locator;
  readonly searchInput: Locator;
  readonly sortToggle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.backLink = page.getByRole("link", { name: /all jobs/i });
    this.jobTitle = page.getByRole("heading", { level: 1 });
    this.applicantCount = page.getByText(/applicant/i);
    this.searchInput = page.getByPlaceholder(/search by applicant/i);
    this.sortToggle = page.getByRole("button", { name: /sort/i });
  }

  async goto(code: string) {
    await this.page.goto(`/jobs/${code}`);
  }

  statusFilter(status: string): Locator {
    const label = FILTER_LABEL[status] ?? status;
    // Match links ending with the label — avoids matching "All jobs" back-link
    return this.page.getByRole("link", { name: new RegExp(`${label}$`, "i") });
  }

  applicantRow(name: string): Locator {
    return this.page.getByRole("link", { name: new RegExp(name, "i") });
  }
}
