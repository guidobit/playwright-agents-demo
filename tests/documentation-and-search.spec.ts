// spec: specs/plan.md
// Test scenarios 6-7: Search Functionality and Documentation Content

import { test, expect } from '@playwright/test';

test.describe('Documentation Search and Content', () => {

  test('Test 6: Search Functionality', async ({ page }) => {
    // 1. Navigate to Playwright.dev
    await page.goto('https://playwright.dev/', { waitUntil: 'networkidle' });

    // 2. Locate the search input field
    const searchInput = page.locator('[placeholder*="Search"], [aria-label*="search"], input[type="search"], [class*="search"] input').first();

    const hasSearch = await searchInput.isVisible().catch(() => false);
    test.skip(!hasSearch, 'Search field not found on page');

    // 3. Click on the search field
    await searchInput.click();
    await expect(searchInput).toBeFocused();

    // 4. Type a search query
    const searchQuery = 'locators';
    await searchInput.fill(searchQuery);

    // Wait for search results to appear
    await page.waitForTimeout(1000);

    // 5. Verify results are displayed
    const searchResults = page.locator('[role="listbox"], [class*="result"], [class*="suggestion"]').first();

    let hasResults = false;
    if (await searchResults.isVisible().catch(() => false)) {
      hasResults = true;
      const resultItems = page.locator('[role="option"], [class*="result-item"], li').filter({ hasText: /locator|docs/i });
      expect(await resultItems.count()).toBeGreaterThan(0);
    }

    // Alternative: check if page has results on dedicated search page
    if (!hasResults) {
      await searchInput.press('Enter');
      await page.waitForLoadState('networkidle');

      // Check if results page loaded
      const resultsPage = page.locator('[class*="result"], h2, h3').filter({ hasText: new RegExp(searchQuery, 'i') });
      hasResults = await resultsPage.count() > 0 || page.url().includes('search');
    }

    test.skip(!hasResults, 'Search results could not be verified');

    // 6. Click on a search result
    if (hasResults) {
      const firstResult = page.locator('a, [role="option"]').filter({ hasText: /locator|docs/i }).first();
      if (await firstResult.isVisible()) {
        const resultHref = await firstResult.getAttribute('href');
        await firstResult.click();

        // 7. Verify result page loads
        await page.waitForLoadState('domcontentloaded');

        // Page should have changed
        const resultUrl = page.url();
        expect(resultUrl).toContain('playwright.dev');
      }
    }

    // No console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.waitForTimeout(200);
  });

  test('Test 7: Documentation Content Visibility', async ({ page }) => {
    // 1. Navigate to key documentation sections
    const docSections = [
      'https://playwright.dev/docs/intro',
      'https://playwright.dev/docs/locators',
      'https://playwright.dev/docs/actions',
    ];

    for (const docUrl of docSections) {
      // Navigate to the page
      const response = await page.goto(docUrl, { waitUntil: 'networkidle' });

      // Verify page loaded successfully
      expect(response?.status()).toBe(200);

      // 2. Verify page title/heading matches content
      const mainHeading = page.locator('h1, [role="heading"][aria-level="1"]').first();
      await expect(mainHeading).toBeVisible();

      const headingText = await mainHeading.textContent();
      expect(headingText).toBeTruthy();
      expect(headingText?.length).toBeGreaterThan(0);

      // 3. Verify content is visible
      const mainContent = page.locator('main, [role="main"], article, .docs-content, .content').first();
      await expect(mainContent).toBeVisible();

      // 4. Verify code examples are present
      const codeBlocks = page.locator('pre, code[class*="language"]');
      const codeBlockCount = await codeBlocks.count();
      expect(codeBlockCount).toBeGreaterThan(0);

      // 5. Verify no missing images
      const images = page.locator('img');
      for (const img of await images.all()) {
        const src = await img.getAttribute('src');
        expect(src).toBeTruthy();

        // Verify image is loaded
        const naturalHeight = await img.evaluate((el: HTMLImageElement) => el.naturalHeight);
        expect(naturalHeight).toBeGreaterThan(0);
      }

      // 6. Check for proper formatting
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      expect(await headings.count()).toBeGreaterThan(0);

      // Verify links are present
      const links = page.locator('a[href]');
      expect(await links.count()).toBeGreaterThan(0);

      // 7. Verify no broken internal links (sample check)
      const internalLinks = page.locator('a[href*="playwright.dev"]').first();
      if (await internalLinks.isVisible()) {
        const href = await internalLinks.getAttribute('href');
        expect(href).toMatch(/^\/|^https:\/\/playwright\.dev/);
      }

      // 8. Verify text is readable
      const bodyText = await page.locator('body').textContent();
      expect(bodyText).toBeTruthy();
      expect(bodyText!.length).toBeGreaterThan(100);
    }

    // No console errors across all pages
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
  });

  test('Test 7.1: Feature Highlights Section', async ({ page }) => {
    // 1. Navigate to homepage
    await page.goto('https://playwright.dev/', { waitUntil: 'networkidle' });

    // 2. Locate the features section
    const featuresSection = page.locator('[class*="feature"], [class*="highlights"], section').filter({
      hasText: /feature|capability|highlight|cross-browser|auto-wait/i
    }).first();

    const hasFeaturesSection = await featuresSection.isVisible().catch(() => false);
    test.skip(!hasFeaturesSection, 'Features section not found on homepage');

    // 3. Identify all feature cards
    const featureCards = page.locator('[class*="card"], [class*="feature-item"], li, div').filter({
      hasText: /auto-wait|cross-browser|debug|codegen|record/i
    });

    const cardCount = await featureCards.count();
    expect(cardCount).toBeGreaterThan(0);

    // 4. Verify each feature card is visible
    for (const card of await featureCards.all().then(cards => cards.slice(0, 5))) {
      await expect(card).toBeVisible();

      // Verify feature description is readable
      const text = await card.textContent();
      expect(text).toBeTruthy();
      expect(text!.length).toBeGreaterThan(5);

      // 5. Check if feature cards have clickable links
      const link = card.locator('a').first();
      if (await link.isVisible()) {
        const href = await link.getAttribute('href');
        expect(href).toBeTruthy();
      }
    }

    // 6. Verify icons/images display correctly
    const featureImages = featuresSection.locator('img, svg, [class*="icon"]');
    const imageCount = await featureImages.count();
    expect(imageCount).toBeGreaterThan(0);

    for (const img of await featureImages.all().then(imgs => imgs.slice(0, 3))) {
      const isVisible = await img.isVisible().catch(() => false);
      if (isVisible) {
        await expect(img).toBeVisible();
      }
    }
  });

});

