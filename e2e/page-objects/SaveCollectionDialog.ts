import { type Page, type Locator } from '@playwright/test';

export class SaveCollectionDialog {
  readonly page: Page;
  readonly form: Locator;
  readonly nameInput: Locator;
  readonly descriptionInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.form = page.locator('[data-test-id="collection-form"]');
    this.nameInput = page.locator('[data-test-id="collection-name-input"]');
    this.descriptionInput = page.locator('[data-test-id="collection-description-input"]');
    this.saveButton = page.locator('[data-test-id="collection-save-button"]');
    this.cancelButton = page.locator('[data-test-id="collection-cancel-button"]');
    this.errorMessage = page.locator('[data-test-id="collection-form-error"]');
  }

  /**
   * Waits for the dialog to be visible
   */
  async waitForOpen() {
    await this.form.waitFor({ state: 'visible' });
  }

  /**
   * Fills in the collection form with the provided data
   */
  async fillForm(data: { name: string; description?: string }) {
    await this.nameInput.fill(data.name);
    if (data.description) {
      await this.descriptionInput.fill(data.description);
    }
  }

  /**
   * Attempts to save the collection form
   * @returns true if save was successful (dialog closed), false if validation error occurred
   */
  async save(): Promise<boolean> {
    await this.saveButton.click();

    try {
      // First, check if there's an immediate error message
      const hasError = await this.hasError({ timeout: 1000 });
      if (hasError) {
        return false;
      }

      // If no error, wait for the form to close
      await this.form.waitFor({ state: 'hidden', timeout: 5000 });
      return true;
    } catch (e) {
      // If timeout waiting for form to close, check for error again
      const hasError = await this.hasError();
      if (hasError) {
        return false;
      }
      throw e; // Re-throw if it's not a validation error case
    }
  }

  /**
   * Checks if there's currently a validation error displayed
   */
  async hasError(options?: { timeout?: number }): Promise<boolean> {
    try {
      await this.errorMessage.waitFor({
        state: 'visible',
        timeout: options?.timeout ?? 1000,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Cancels the collection form
   */
  async cancel() {
    await this.cancelButton.click();
    await this.form.waitFor({ state: 'hidden' });
  }

  /**
   * Creates a new collection with the provided data
   * @returns true if creation was successful, false if validation error occurred
   */
  async createCollection(data: { name: string; description?: string }): Promise<boolean> {
    await this.waitForOpen();
    await this.fillForm(data);
    return await this.save();
  }

  /**
   * Gets the current error message if present
   */
  async getErrorMessage() {
    if (await this.hasError()) {
      return await this.errorMessage.textContent();
    }
    return null;
  }

  /**
   * Checks if the save button is enabled
   */
  async isSaveEnabled() {
    return !(await this.saveButton.isDisabled());
  }
}
