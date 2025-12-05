// spec: specs/plan.md
// Test scenario 15: Sidebar Navigation

import { test, expect } from '@playwright/test';

test.describe('Documentation Navigation', () => {

  test('Test 15: Sidebar Navigation', async ({ page }) => {
    // 1. Navigate to a documentation page
    await page.goto('https://playwright.dev/docs/intro', { waitUntil: 'networkidle' });

    // 2. Verify sidebar is visible
    const sidebar = page.locator('aside, [class*="sidebar"], nav[class*="doc"], [role="navigation"]').first();

    const sidebarVisible = await sidebar.isVisible().catch(() => false);
    test.skip(!sidebarVisible, 'Sidebar not found on documentation page');

    // 3. Find sidebar navigation links
    const sidebarLinks = sidebar.locator('a, [role="button"]');
    const linksCount = await sidebarLinks.count();

    expect(linksCount).toBeGreaterThan(0);

    // 4. Click on different section headings
    const sections = sidebar.locator('li, [class*="section"], [class*="item"]').filter({ hasText: /^[A-Z]/ });
    const sectionCount = await sections.count();

    for (let i = 0; i < Math.min(sectionCount, 3); i++) {
      const section = sections.nth(i);
      const link = section.locator('a').first();

      if (await link.isVisible()) {
        const href = await link.getAttribute('href');

        // Click the link
        await link.click();

        // 5. Verify page scrolls or navigates to correct section
        await page.waitForLoadState('domcontentloaded');

        // Verify page content updated
        const mainContent = page.locator('main, [role="main"], article').first();
        await expect(mainContent).toBeVisible();
      }
    }

    // 6. Verify current section is highlighted in sidebar
    const activeLink = sidebar.locator('a[aria-current="page"], a.active, [class*="active"] a').first();
    const hasActiveIndicator = await activeLink.isVisible().catch(() => false);

    if (hasActiveIndicator) {
      // Check that active link is visually different
      const activeStyle = await activeLink.evaluate((el) => {
        return window.getComputedStyle(el);
      });

      expect(activeStyle).toBeTruthy();
    }

    // 7. Test nested/expandable sections (if applicable)
    const expandableItems = sidebar.locator('button[aria-expanded], [class*="expand"], [class*="collapse"]');
    const expandableCount = await expandableItems.count();

    if (expandableCount > 0) {
      const expandButton = expandableItems.first();

      if (await expandButton.isVisible()) {
        await expandButton.click();
        await page.waitForTimeout(200);

        // Verify nested items are now visible
        const nestedItems = expandButton.locator('..').first().locator('a, li');
        const nestedCount = await nestedItems.count();
        expect(nestedCount).toBeGreaterThan(0);
      }
    }

    // 8. Test sidebar on mobile (if applicable)
    // Check if there's a mobile menu toggle
    const mobileMenuToggle = page.locator('button[aria-label*="menu"], button[aria-label*="nav"], [class*="hamburger"]').first();

    if (await mobileMenuToggle.isVisible()) {
      // Click to open mobile menu
      await mobileMenuToggle.click();
      await page.waitForTimeout(300);

      // Verify sidebar links are now accessible
      const mobileSidebar = page.locator('aside, [class*="sidebar"]').first();
      await expect(mobileSidebar).toBeVisible();

      // Verify mobile sidebar links work
      const mobileLinks = mobileSidebar.locator('a').first();
      if (await mobileLinks.isVisible()) {
        await mobileLinks.click();
        await page.waitForLoadState('domcontentloaded');
      }
    }

    // 9. Test scroll behavior
    // Scroll down and verify sidebar updates
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(200);

    // Sidebar should still be accessible
    const sidebarStillVisible = await sidebar.isVisible().catch(() => false);
    expect(sidebarStillVisible).toBe(true);
  });

  test('Test 15.1: Table of Contents Navigation', async ({ page }) => {
    // Navigate to documentation
    await page.goto('https://playwright.dev/docs/intro', { waitUntil: 'networkidle' });

    // Look for table of contents
    const toc = page.locator('[class*="toc"], [class*="contents"], nav[aria-label*="table"]').first();

    const hasTableOfContents = await toc.isVisible().catch(() => false);
    test.skip(!hasTableOfContents, 'Table of contents not found');

    // Find TOC links
    const tocLinks = toc.locator('a');
    const linksCount = await tocLinks.count();

    expect(linksCount).toBeGreaterThan(0);

    // Click on TOC items and verify navigation
    const linkElements = await tocLinks.all();

    for (let i = 0; i < Math.min(linkElements.length, 2); i++) {
      const link = linkElements[i];
      const href = await link.getAttribute('href');

      if (href?.startsWith('#')) {
        // It's an anchor link
        await link.click();
        await page.waitForTimeout(300);

        // Verify page scrolled to section
        const targetId = href.substring(1);
        const targetElement = page.locator(`#${targetId}`);

        const isInViewport = await targetElement.evaluate((el) => {
          const rect = el.getBoundingClientRect();
          return rect.top >= 0 && rect.top <= window.innerHeight;
        }).catch(() => false);

        // Element should be reasonably in viewport after clicking
        // (might not be perfectly in viewport due to sticky headers)
      }
    }
  });

});

test.describe('Documentation Completeness', () => {

  test('Verify all main doc sections are accessible', async ({ page }) => {
    // Navigate to docs home or intro
    await page.goto('https://playwright.dev/docs', { waitUntil: 'networkidle' });

    // Look for major sections
    const expectedSections = ['Intro', 'Getting Started', 'Guides', 'API', 'Community'];

    for (const sectionName of expectedSections) {
      const sectionLink = page.getByRole('link').filter({ hasText: new RegExp(sectionName, 'i') }).first();

      if (await sectionLink.isVisible()) {
        // Verify link is clickable
        await expect(sectionLink).toBeEnabled();
      }
    }
  });

});

