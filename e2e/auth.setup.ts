import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.join(__dirname, '../playwright/.auth/user.json');

const E2E_USERNAME = process.env.E2E_USERNAME;
const E2E_PASSWORD = process.env.E2E_PASSWORD;

if (!E2E_USERNAME || !E2E_PASSWORD) {
  throw new Error('E2E_USERNAME and E2E_PASSWORD must be set');
}

setup('authenticate', async ({ page, baseURL }) => {
  // Perform authentication steps. Replace these actions with your own.
  await page.goto(`${baseURL}/auth/login`);
  await page.locator('input[data-testid="auth-input-email"]').fill(E2E_USERNAME);
  await page.locator('input[data-testid="auth-input-password"]').fill(E2E_PASSWORD);
  await page.locator('button[type="submit"]').click();
  // Wait until the page receives the cookies.
  await expect(page.getByRole('heading', { name: 'Rule Builder', level: 2 })).toBeVisible();

  // End of authentication steps.
  await page.context().storageState({ path: authFile });
});
