import { type Page, type Locator } from "@playwright/test";

export class JobNewPage {
  readonly page: Page;
  readonly dropZone: Locator;
  readonly fileInput: Locator;
  readonly extractButton: Locator;
  readonly saveDraftButton: Locator;
  readonly publishButton: Locator;
  readonly saveButton: Locator; // alias used by real-flow.spec.ts
  readonly loadingMessage: Locator;
  readonly jobTitleHeading: Locator;
  readonly fileError: Locator;
  readonly previewDialog: Locator;
  readonly confirmPublishButton: Locator;
  readonly hiringManagerTrigger: Locator;

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
    this.fileError = page.getByText(/couldn't process this file/i);
    this.previewDialog = page.getByRole("dialog");
    this.confirmPublishButton = page.getByRole("button", { name: /^confirm$/i });
    this.hiringManagerTrigger = page.getByRole("combobox").filter({ hasText: /unassigned/i });
  }

  async goto() {
    await this.page.goto("/jobs/new");
  }

  async uploadFile(name: string, mimeType: string, content: string) {
    await this.fileInput.setInputFiles({ name, mimeType, buffer: Buffer.from(content) });
  }

  filterChip(value: string): Locator {
    return this.page.getByRole("combobox").filter({ hasText: value }).first();
  }

  criterionRow(label: string): Locator {
    return this.page.getByText(label);
  }

  firstImportanceSelector(): Locator {
    return this.page.getByRole("combobox").first();
  }

  /** Returns the importance Select trigger for a specific criterion by its label text */
  importanceSelectorFor(criterionLabel: string): Locator {
    return this.page
      .locator("li")
      .filter({ hasText: criterionLabel })
      .getByRole("combobox");
  }
}
