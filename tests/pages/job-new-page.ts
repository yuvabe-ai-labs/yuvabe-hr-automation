import { type Page, type Locator } from "@playwright/test";

export class JobNewPage {
  readonly page: Page;
  readonly dropZone: Locator;
  readonly fileInput: Locator;
  readonly extractButton: Locator;
  readonly saveDraftButton: Locator;
  readonly publishButton: Locator;
  // backwards-compat alias used by real-flow.spec.ts
  readonly saveButton: Locator;
  readonly loadingMessage: Locator;
  readonly jobTitleHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dropZone = page.getByText(/Drop the job/i);
    this.fileInput = page.locator('input[type="file"]');
    this.extractButton = page.getByRole("button", { name: /extract criteria/i });
    this.saveDraftButton = page.getByRole("button", { name: /save as draft/i });
    this.publishButton = page.getByRole("button", { name: /^publish$/i });
    this.saveButton = page.getByRole("button", { name: /^publish$/i });
    this.loadingMessage = page.getByText(/reading the description/i);
    this.jobTitleHeading = page.getByRole("heading", { level: 2 });
  }

  async goto() {
    await this.page.goto("/jobs/new");
  }

  async uploadFile(name: string, mimeType: string, content: string) {
    await this.fileInput.setInputFiles({ name, mimeType, buffer: Buffer.from(content) });
  }

  /** Importance tier combobox — matches any Select currently showing that tier label */
  filterChip(value: string): Locator {
    return this.page.getByRole("combobox").filter({ hasText: value }).first();
  }

  criterionRow(label: string): Locator {
    return this.page.getByText(label);
  }

  /** First importance selector in the criteria list */
  firstImportanceSelector(): Locator {
    return this.page.getByRole("combobox").first();
  }
}
