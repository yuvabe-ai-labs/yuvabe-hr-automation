import { type Page, type Locator } from "@playwright/test";

const FILTER_LABEL: Record<string, string> = {
  all:         "All",
  new:         "New",
  reviewing:   "Review",
  shortlisted: "Shortlist",
  interview:   "Interview",
  hired:       "Hired",
  rejected:    "Reject",
};

export class ApplicationsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly searchInput: Locator;
  /** All applicant row links (each row is wrapped in an <a href="/applications/[id]">) */
  readonly applicantRows: Locator;
  /** Button that opens the filter/sort panel */
  readonly filterButton: Locator;
  /** "Clear selection" button shown in the bulk action bar */
  readonly clearSelectionButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByText("Applications", { exact: true });
    this.searchInput = page.getByPlaceholder(/search by applicant/i);
    this.applicantRows = page.locator("a").filter({ has: page.locator("h3") });
    this.filterButton = page.locator('button[aria-label="Open filters"]');
    this.clearSelectionButton = page.locator('button[aria-label="Clear selection"]');
  }

  async goto() {
    await this.page.goto("/applications");
    await this.heading.waitFor({ state: "visible" });
  }

  statusFilter(status: string): Locator {
    const label = FILTER_LABEL[status] ?? status;
    return this.page.getByRole("link", { name: new RegExp(`${label}$`, "i") });
  }

  /** Score chip for a given row (0-indexed) */
  scoreChip(index: number): Locator {
    return this.applicantRows.nth(index).locator('[aria-label*="Match score"]');
  }

  /** Checkbox for a given row (0-indexed). The checkbox is a sibling of the row link inside <li>. */
  rowCheckbox(index: number): Locator {
    return this.page.getByRole("listitem")
      .filter({ has: this.page.locator('[aria-label*="Match score"]') })
      .nth(index)
      .locator('input[type="checkbox"]');
  }

  /** The "X selected" label in the bulk action bar */
  bulkSelectionLabel(): Locator {
    return this.page.getByText(/\d+\s*selected/i).first();
  }
}
