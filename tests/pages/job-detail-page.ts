import { type Page, type Locator } from "@playwright/test";

// Filter tab labels as rendered in the UI (matches lib/constants.ts FILTER_LABEL)
const FILTER_LABEL: Record<string, string> = {
  all:         "All",
  new:         "New",
  reviewing:   "Review",
  shortlisted: "Shortlist",
  interview:   "Interview",
  hired:       "Hired",
  rejected:    "Reject",
};

export class JobDetailPage {
  readonly page: Page;
  readonly backLink: Locator;
  readonly jobTitle: Locator;
  readonly applicantCount: Locator;
  readonly searchInput: Locator;
  readonly viewCriteriaLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.backLink = page.getByRole("link", { name: /all jobs/i });
    this.jobTitle = page.getByRole("heading", { level: 1 });
    this.applicantCount = page.getByText(/applicant/i);
    this.searchInput = page.getByPlaceholder(/search by applicant/i);
    this.viewCriteriaLink = page.getByRole("link", { name: /view criteria/i });
  }

  async goto(code: string) {
    await this.page.goto(`/jobs/${code}`);
  }

  statusFilter(status: string): Locator {
    const label = FILTER_LABEL[status] ?? status;
    return this.page.getByRole("link", { name: new RegExp(`${label}$`, "i") });
  }

  applicantRow(name: string): Locator {
    return this.page.getByRole("link", { name: new RegExp(name, "i") });
  }

  /** All applicant list rows */
  applicantRows(): Locator {
    return this.page.getByRole("listitem").filter({ has: this.page.locator("[aria-label*='Match score']") });
  }

  /** Score chip for the nth row (0-indexed) */
  scoreChip(index: number): Locator {
    return this.applicantRows().nth(index).locator("[aria-label*='Match score']");
  }

  /** Count badge on a status filter chip */
  chipCount(status: string): Locator {
    const label = FILTER_LABEL[status] ?? status;
    return this.page.getByRole("link", { name: new RegExp(`${label}`, "i") });
  }
}
