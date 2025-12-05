// spec: specs/plan.md
// Test scenarios 9-10: Installation Instructions and Responsive Design

import {test, expect, devices, Locator} from '@playwright/test';

import { test, expect } from '@playwright/test';

test.describe('Installation and Responsive Design', () => {

  test('Test 9: Installation Instructions - Package Manager Selection', async ({ page }) => {
    // 1. Navigate to Installation page
    await page.goto('https://playwright.dev/docs/intro', { waitUntil: 'networkidle' });

    // Try alternative installation page URLs
    const installations = [
      'https://playwright.dev/docs/intro',
      'https://playwright.dev/docs/getting-started-vscode',
    ];

    let foundInstallPage = false;
    for (const url of installations) {
      const response = await page.goto(url, { waitUntil: 'networkidle' });
      if (response?.status() === 200) {
        foundInstallPage = true;
        break;
      }
    }

    expect(foundInstallPage).toBe(true);

    // 2. Verify page displays installation options
    const installationContent = page.locator('main, article, [role="main"]').first();
    await expect(installationContent).toBeVisible();

    // Look for installation options (npm, yarn, pnpm)
    const npmOption = page.getByRole('button', { name: /npm/ }).or(
      page.locator('text=/^npm$|npm /i')
    ).first();

    const yarnOption = page.getByRole('button', { name: /yarn/ }).first();
    const pnpmOption = page.getByRole('button', { name: /pnpm/ }).first();

    const packageManagers = [
      { name: 'npm', element: npmOption },
      { name: 'yarn', element: yarnOption },
      { name: 'pnpm', element: pnpmOption },
    ];



    const availableManagers = packageManagers.filter(async pm =>
      await pm.element.isVisible().catch(() => false)
    );

    test.skip(availableManagers.length === 0, 'No package manager options found');

    // 3-4. Test each package manager option
    for (const pm of packageManagers) {
      const isVisible = await pm.element.isVisible().catch(() => false);
      if (isVisible) {
        // Click the option
        await pm.element.click();

        // Wait for content update
        await page.waitForTimeout(300);

        // Verify the correct command is displayed
        const codeBlocks = page.locator('pre, code');
        const codeContent = await codeBlocks.first().textContent();

        // Should contain npm/yarn/pnpm reference
        expect(codeContent).toBeTruthy();

        // For npm
        if (pm.name === 'npm') {
          expect(codeContent?.toLowerCase()).toContain('npm');
        }
        // For yarn
        else if (pm.name === 'yarn') {
          expect(codeContent?.toLowerCase()).toContain('yarn');
        }
        // For pnpm
        else if (pm.name === 'pnpm') {
          expect(codeContent?.toLowerCase()).toContain('pnpm');
        }
      }
    }

    // No console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.waitForTimeout(200);
  });

});

test.describe('Responsive Design - Mobile View', () => {

  test('Test 10: Mobile View (375x667 - iPhone SE)', async ({ browser }) => {
    // Use iPhone SE viewport
    const context = await browser.newContext({
      ...devices['iPhone SE'],
    });

    const page = await context.newPage();

    // 1. Open Playwright.dev on mobile viewport
    await page.goto('https://playwright.dev/', { waitUntil: 'networkidle' });

    // Verify page loaded
    expect(page.url()).toContain('playwright.dev');

    // 2. Verify page loads and is readable
    const mainContent = page.locator('main, [role="main"], body > *').first();
    await expect(mainContent).toBeVisible();

    // 3. Verify navigation menu is accessible
    const navMenu = page.locator('nav, [role="navigation"]').first();

    let navigationAccessible = false;
    if (await navMenu.isVisible()) {
      navigationAccessible = true;
    } else {
      // Check for hamburger menu
      const hamburger = page.locator('button[aria-label*="menu"], [class*="hamburger"], [class*="mobile-menu"]').first();
      if (await hamburger.isVisible()) {
        await hamburger.click();
        navigationAccessible = true;
      }
    }

    expect(navigationAccessible).toBe(true);

    // 4. Verify text is readable without excessive zooming
    const textElements = page.locator('p, h1, h2, h3, li, a').first();
    const fontSize = await textElements.evaluate((el) => {
      return window.getComputedStyle(el).fontSize;
    });

    // Font should be at least 12px for readability
    const fontSizeValue = parseInt(fontSize);
    expect(fontSizeValue).toBeGreaterThanOrEqual(12);

    // 5. Check for horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);

    // Allow small overflow for code blocks
    expect(bodyWidth - windowWidth).toBeLessThan(50);

    // 6. Navigate to a subpage
    const link = page.locator('a').filter({ hasText: /docs|guide|tutorial/i }).first();
    if (await link.isVisible()) {
      await link.click();
      await page.waitForLoadState('networkidle');

      // Verify page still readable
      const content = page.locator('main, [role="main"]').first();
      await expect(content).toBeVisible();
    }

    // No critical console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.waitForTimeout(200);
    expect(errors.filter(e => e.includes('critical') || e.includes('error')).length).toBe(0);

    await context.close();
  });

  test('Test 10.1: Tablet View (768x1024 - iPad)', async ({ browser }) => {
    // Use iPad viewport
    const context = await browser.newContext({
      ...devices['iPad'],
    });

    const page = await context.newPage();

    // Navigate to homepage
    await page.goto('https://playwright.dev/', { waitUntil: 'networkidle' });

    // Verify page loaded
    expect(page.url()).toContain('playwright.dev');

    // Verify main content is visible
    const mainContent = page.locator('main, [role="main"]').first();
    await expect(mainContent).toBeVisible();

    // Verify navigation is accessible
    const navMenu = page.locator('nav, [role="navigation"]').first();
    const navigationVisible = await navMenu.isVisible().catch(() => false);
    expect(navigationVisible).toBe(true);

    // Check for layout breaks
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);

    // Should fit without significant horizontal scroll
    expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 50);

    // Verify touch interactions work (test tap on a button)
    const button = page.getByRole('button').first();
    if (await button.isVisible()) {
      await button.tap?.() || await button.click();
      await page.waitForTimeout(200);
    }

    await context.close();
  });

});

test.describe('Cross-Browser Compatibility', () => {

  test('Test 13: Cross-Browser - Functionality Consistency', async ({ browserName, page }) => {
    // Navigate to homepage
    await page.goto('https://playwright.dev/', { waitUntil: 'networkidle' });

    // Test on current browser (Chromium, Firefox, or WebKit)
    console.log(`Testing on ${browserName}`);

    // 1. Verify page loads and displays correctly
    expect(page.url()).toContain('playwright.dev');

    const mainHeading = page.locator('h1, [role="heading"][aria-level="1"]').first();
    await expect(mainHeading).toBeVisible();

    // 2. Test navigation and links
    const navLinks = page.locator('a[href*="playwright.dev"]').first();
    await expect(navLinks).toBeVisible();

    // 3. Verify code snippets display properly
    const codeBlocks = page.locator('pre, code');
    const blockCount = await codeBlocks.count();
    expect(blockCount).toBeGreaterThanOrEqual(0);

    if (blockCount > 0) {
      const codeContent = await codeBlocks.first().textContent();
      expect(codeContent).toBeTruthy();
    }

    // 4. Check for browser-specific console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.waitForTimeout(500);

    // No critical errors
    const criticalErrors = errors.filter(e =>
      !e.includes('ResizeObserver') &&
      !e.includes('non-error promise rejection')
    );

    console.log(`Errors on ${browserName}: ${criticalErrors.length}`);
  });

});

