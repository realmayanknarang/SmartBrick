import { expect, test } from '@playwright/test';

const email = process.env.E2E_CLERK_EMAIL;
const password = process.env.E2E_CLERK_PASSWORD;

test.describe('core user flow', () => {
  test.skip(!email || !password, 'Set E2E_CLERK_EMAIL and E2E_CLERK_PASSWORD for a dedicated Clerk test account.');

  test('login, view dashboard data, inspect vendors and analytics, then sign out', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();

    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: /continue/i }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
    await expect(page.getByText('Active Vendors')).toBeVisible();

    await page.getByRole('link', { name: /^vendors$/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/vendors$/);
    await expect(page.getByRole('heading', { name: 'Vendors' })).toBeVisible();
    await expect(page.getByRole('table', { name: /vendor list/i })).toBeVisible();
    await expect(page.getByRole('row', { name: /demo/i }).first()).toBeVisible();

    await page.getByRole('link', { name: /^analytics$/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/analytics$/);
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
    await expect(page.locator('.recharts-responsive-container').first()).toBeVisible();
    await expect(page.getByText(/purchase orders/i).first()).toBeVisible();

    await page.getByRole('button', { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
  });
});
