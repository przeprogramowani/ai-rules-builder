import { test, expect } from '@playwright/test';
import { CollectionsSidebarPage } from '../page-objects/CollectionsSidebarPage';
import { SaveCollectionDialog } from '../page-objects/SaveCollectionDialog';

test.describe('Collections Management', () => {
  /**
   * Generates a unique collection name for testing
   */
  const generateUniqueName = () => {
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '');
    return `Test Collection ${timestamp}`;
  };

  test('should create a new collection', async ({ page }) => {
    // Arrange
    const sidebarPage = new CollectionsSidebarPage(page);
    const saveDialog = new SaveCollectionDialog(page);
    const testData = {
      name: generateUniqueName(),
      description: 'This is a test collection created by E2E test',
    };

    // Navigate to the main page
    await page.goto('/');

    // Act
    await sidebarPage.open();
    await sidebarPage.waitForLoad();
    await sidebarPage.clickCreateCollection();

    const saveResult = await saveDialog.createCollection(testData);
    expect(saveResult).toBe(true);

    // Assert
    // Wait for the collection to appear in the list and verify its content
    const collection = sidebarPage.getCollectionByName(testData.name);
    await expect(collection).toBeVisible({ timeout: 5000 });

    // Verify collection details
    await expect(collection.locator('[data-test-id="collection-entry-name"]')).toHaveText(
      testData.name,
    );
    await expect(collection.locator('[data-test-id="collection-entry-description"]')).toHaveText(
      testData.description,
    );
  });

  test('should show error when creating collection without name', async ({ page }) => {
    // Arrange
    const sidebarPage = new CollectionsSidebarPage(page);
    const saveDialog = new SaveCollectionDialog(page);

    // Navigate to the main page
    await page.goto('/');

    // Act
    await sidebarPage.open();
    await sidebarPage.waitForLoad();
    await sidebarPage.clickCreateCollection();

    await saveDialog.waitForOpen();
    const saveResult = await saveDialog.save();

    // Assert
    expect(saveResult).toBe(false);
    await expect(saveDialog.form).toBeVisible();
    await expect(saveDialog.errorMessage).toBeVisible();
    expect(await saveDialog.getErrorMessage()).toBe('Name is required');

    // Verify that the dialog is still open and can be cancelled
    await saveDialog.cancel();
    await expect(saveDialog.form).toBeHidden();
  });
});
