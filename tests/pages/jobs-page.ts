import { type Page, type Locator } from "@playwright/test";

export class JobsPage {
  readonly page: Page;
  readonly newJobButton: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newJobButton = page.getByRole("link", { name: /new job/i });
    this.emptyState = page.getByText(/no jobs yet/i);
  }

  async goto() {
    await this.page.goto("/jobs");
    // Jobs list is client-side (TanStack Query) — wait for at least one row or empty state.
    const firstRow = this.page.getByRole("listitem").first();
    const empty = this.page.getByText(/no jobs yet/i);
    await firstRow.or(empty).waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
  }

  jobRow(title: string): Locator {
    return this.page.getByRole("listitem").filter({ hasText: title });
  }

  jobLink(title: string): Locator {
    return this.page.getByRole("link", { name: title });
  }

  justSavedLabel(): Locator {
    return this.page.getByText("← just saved");
  }
}
