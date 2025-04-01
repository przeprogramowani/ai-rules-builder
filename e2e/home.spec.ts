import { test, expect } from '@playwright/test';
import { HomePage } from './page-objects/HomePage';

test.describe('Home Page', () => {
  test('should have the correct title', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    const title = await homePage.getTitle();
    expect(title).toContain('10xRules.ai');
  });

  test('should have a heading', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await expect(homePage.heading).toBeVisible();
  });
});
