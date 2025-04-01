import { type Page, type Locator } from '@playwright/test';

export class CollectionsSidebarPage {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly toggleButton: Locator;
  readonly collectionsList: Locator;
  readonly createCollectionButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator('[data-test-id="collections-sidebar"]');
    this.toggleButton = page.locator('[data-test-id="collections-sidebar-toggle"]');
    this.collectionsList = page.locator('[data-test-id="collections-list"]');
    this.createCollectionButton = page.locator('[data-test-id="create-collection-button"]');
  }

  /**
   * Opens the collections sidebar if it's closed
   */
  async open() {
    const isOpen = await this.sidebar.evaluate((el) => {
      const width = getComputedStyle(el).width;
      return width !== '48px';
    });

    if (!isOpen) {
      await this.toggleButton.click();
      // Wait for the sidebar animation to complete
      await this.page.waitForTimeout(300); // Based on the transition duration
    }
  }

  /**
   * Closes the collections sidebar if it's open
   */
  async close() {
    const isOpen = await this.sidebar.evaluate((el) => {
      const width = getComputedStyle(el).width;
      return width !== '48px';
    });

    if (isOpen) {
      await this.toggleButton.click();
      // Wait for the sidebar animation to complete
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Initiates the creation of a new collection
   */
  async clickCreateCollection() {
    await this.createCollectionButton.click();
  }

  /**
   * Gets a locator for a specific collection by its name
   */
  getCollectionByName(name: string): Locator {
    return this.collectionsList
      .locator(`[data-test-id="collection-entry"]`)
      .filter({ has: this.page.locator(`[data-test-id="collection-entry-name"]:text("${name}")`) });
  }

  /**
   * Gets edit button for a specific collection
   */
  getCollectionEditButton(name: string): Locator {
    return this.getCollectionByName(name).locator('[data-test-id="collection-edit-button"]');
  }

  /**
   * Gets delete button for a specific collection
   */
  getCollectionDeleteButton(name: string): Locator {
    return this.getCollectionByName(name).locator('[data-test-id="collection-delete-button"]');
  }

  /**
   * Gets save changes button for a specific collection (if visible)
   */
  getCollectionSaveChangesButton(name: string): Locator {
    return this.getCollectionByName(name).locator(
      '[data-test-id="collection-save-changes-button"]',
    );
  }

  /**
   * Checks if a collection with the given name exists in the list
   */
  async hasCollection(name: string, options?: { timeout?: number }) {
    try {
      await this.getCollectionByName(name).waitFor({
        state: 'visible',
        timeout: options?.timeout ?? 5000,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Waits for the collections list to be loaded
   */
  async waitForLoad() {
    await this.collectionsList.waitFor({ state: 'visible' });
  }

  /**
   * Clicks on a collection with the given name
   */
  async selectCollection(name: string) {
    await this.getCollectionByName(name).click();
  }
}
