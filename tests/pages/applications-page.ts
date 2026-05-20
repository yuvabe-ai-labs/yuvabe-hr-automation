import { type Page, type Locator } from "@playwright/test";

// Filter tab labels as rendered in the UI (not full status words)
const FILTER_LABEL: Record<string, string> = {
  all: "All",
  new: "New",
  reviewing: "Review",
  shortlisted: "Shortlist",
  rejected: "Reject",
};

export class ApplicationsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByText("Applications", { exact: true });
    this.searchInput = page.getByPlaceholder(/search by applicant/i);
  }

  async goto() {
    await this.page.goto("/applications");
  }

  statusFilter(status: string): Locator {
    const label = FILTER_LABEL[status] ?? status;
    // Match links ending with the label to avoid matching "All jobs" back-links
    return this.page.getByRole("link", { name: new RegExp(`${label}$`, "i") });
  }
}
