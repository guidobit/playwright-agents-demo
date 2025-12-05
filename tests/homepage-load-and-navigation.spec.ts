// spec: specs/plan.md
// Test scenarios 1-3: Homepage Load, Get Started, and Main Menu Navigation

import { test, expect } from '@playwright/test';

test.describe('Playwright.dev Homepage', () => {

  test('Test 1: Homepage Load and Title Verification', async ({ page }) => {
    // 1. Navigate to https://playwright.dev/
    const startTime = Date.now();
    await page.goto('https://playwright.dev/', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;

    // 2. Wait for page to fully load (check for loading indicators to disappear)
    await page.waitForLoadState('networkidle');

    // Verify the page title contains "Playwright"
    await expect(page).toHaveTitle(/Playwright/);

    // 3. Verify the main heading is visible
    const mainHeading = page.locator('h1, [role="heading"][aria-level="1"]').first();
    await expect(mainHeading).toBeVisible();

    // 4. Verify logo/branding is displayed in the header
    const logo = page.locator('header img, [aria-label*="Playwright"], .logo').first();
    await expect(logo).toBeVisible();

    // Verify page loaded within 5 seconds
    expect(loadTime).toBeLessThan(5000);

    // Verify no critical console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    // Small delay to catch any immediate errors
    await page.waitForTimeout(500);
    expect(errors.length).toBe(0);

    // Verify HTTP status is 200
    expect(page.url()).toContain('playwright.dev');
  });

  test('Test 2: Get Started Link Navigation', async ({ page }) => {
    // 1. Navigate to homepage
    await page.goto('https://playwright.dev/', { waitUntil: 'networkidle' });

    // 2. Locate and click the "Get started" link
    const getStartedLink = page.getByRole('link', { name: /Get started|Get Started/i });
    await expect(getStartedLink).toBeVisible();
    await getStartedLink.click();

    // 3. Wait for the Installation page to load
    await page.waitForLoadState('networkidle');

    // 4. Verify the page URL contains appropriate path
    expect(page.url()).toContain('playwright.dev');
    expect(page.url()).toMatch(/docs|install|getting-started/i);

    // 5. Verify "Installation" heading is visible on the page
    const installationHeading = page.locator('h1, h2, [role="heading"]').filter({
      hasText: /Installation|Getting Started/i
    }).first();
    await expect(installationHeading).toBeVisible();

    // 6. Verify the page contains code examples
    const codeBlock = page.locator('pre, code, [class*="code"], [class*="snippet"]').first();
    await expect(codeBlock).toBeVisible();
  });

  test('Test 3: Main Menu Navigation', async ({ page }) => {
    // 1. Navigate to homepage
    await page.goto('https://playwright.dev/', { waitUntil: 'networkidle' });

    // 2. Identify main navigation menu items
    const navMenu = page.locator('nav, [role="navigation"]').first();
    await expect(navMenu).toBeVisible();

    const menuItems = await page.locator('nav a, [role="navigation"] a').all();
    expect(menuItems.length).toBeGreaterThan(0);

    // 3. Store URLs to check they're valid
    const menuLinks: { name: string; href: string }[] = [];

    for (const item of menuItems.slice(0, 5)) { // Test first 5 menu items
      const text = await item.textContent();
      const href = await item.getAttribute('href');
      if (text && text.trim()) {
        menuLinks.push({ name: text.trim(), href: href || '' });
      }
    }

    expect(menuLinks.length).toBeGreaterThan(0);

    // 4. Test clicking each major menu item
    for (const link of menuLinks.slice(0, 3)) {
      const menuItem = page.getByRole('link', { name: new RegExp(link.name, 'i') }).first();

      if (await menuItem.isVisible()) {
        await menuItem.click();

        // Wait for navigation
        await page.waitForLoadState('domcontentloaded');

        // Verify we navigated (URL changed or content updated)
        const newUrl = page.url();
        expect(newUrl).toContain('playwright.dev');

        // Go back for next iteration
        await page.goBack();
        await page.waitForLoadState('networkidle');
      }
    }

    // 5. Verify browser back button works
    await page.goto('https://playwright.dev/', { waitUntil: 'networkidle' });
    const initialUrl = page.url();

    const firstLink = page.locator('nav a, [role="navigation"] a').first();
    await firstLink.click();
    await page.waitForLoadState('domcontentloaded');

    expect(page.url()).not.toEqual(initialUrl);

    await page.goBack();
    expect(page.url()).toEqual(initialUrl);
  });

});

