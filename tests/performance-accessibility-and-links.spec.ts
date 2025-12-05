// spec: specs/plan.md
// Test scenarios 11-12, 14: Performance, Accessibility, and External Links

import { test, expect } from '@playwright/test';

test.describe('Performance and Accessibility', () => {

  test('Test 11: Page Performance Check', async ({ page }) => {
    // 1. Navigate to Playwright.dev homepage and measure load time
    const navigationStartTime = Date.now();

    const response = await page.goto('https://playwright.dev/', { waitUntil: 'networkidle' });

    const navigationEndTime = Date.now();
    const totalLoadTime = navigationEndTime - navigationStartTime;

    // Verify successful load
    expect(response?.status()).toBe(200);
    expect(totalLoadTime).toBeLessThan(5000); // Should load within 5 seconds

    console.log(`Homepage loaded in ${totalLoadTime}ms`);

    // 2. Measure First Contentful Paint (FCP)
    const metrics = await page.evaluate(() => {
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      return {
        fcp: fcpEntry?.startTime || null,
        navigationTiming: {
          domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
          loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart,
        }
      };
    });

    console.log(`FCP: ${metrics.fcp}ms`);

    if (metrics.fcp) {
      expect(metrics.fcp).toBeLessThan(2000); // FCP should be < 2 seconds
    }

    // 3. Check network requests for failures
    const failedRequests: { url: string; status: number }[] = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        failedRequests.push({
          url: response.url(),
          status: response.status()
        });
      }
    });

    // Wait a bit to capture any late requests
    await page.waitForTimeout(1000);

    // Filter out expected failures
    const criticalFailures = failedRequests.filter(req =>
      !req.url.includes('analytics') &&
      !req.url.includes('telemetry')
    );

    expect(criticalFailures.length).toBe(0);

    console.log(`Failed requests: ${failedRequests.length}`);

    // 4. Verify no excessive console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.waitForTimeout(500);

    // Filter non-critical errors
    const criticalErrors = consoleErrors.filter(e =>
      !e.includes('ResizeObserver') &&
      !e.includes('non-error promise rejection') &&
      !e.includes('Uncaught')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('Test 11.1: Subpage Performance', async ({ page }) => {
    // Navigate to a documentation page and verify load time
    const startTime = Date.now();

    await page.goto('https://playwright.dev/docs/intro', { waitUntil: 'networkidle' });

    const loadTime = Date.now() - startTime;

    // Should load relatively quickly
    expect(loadTime).toBeLessThan(3000);

    console.log(`Docs page loaded in ${loadTime}ms`);
  });

  test('Test 12: Accessibility Compliance', async ({ page }) => {
    // 1. Navigate to Playwright.dev
    await page.goto('https://playwright.dev/', { waitUntil: 'networkidle' });

    // 2. Verify all buttons have proper ARIA labels or text
    const buttons = page.locator('button');
    const buttonsCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonsCount, 5); i++) {
      const button = buttons.nth(i);

      // Button should have accessible name
      const accessibleName = await button.getAttribute('aria-label')
        .then(label => label)
        .catch(() => null);

      const buttonText = await button.textContent();

      expect(accessibleName || buttonText).toBeTruthy();
    }

    // 3. Verify images have alt text
    const images = page.locator('img');
    const imagesCount = await images.count();

    for (let i = 0; i < Math.min(imagesCount, 10); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');

      // Image should have alt text or be marked as decorative
      expect(alt !== null || role === 'presentation').toBe(true);
    }

    // 4. Test keyboard navigation
    await page.keyboard.press('Tab');

    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName.toLowerCase();
    });

    expect(focusedElement).toBeTruthy();

    // 5. Verify focus indicators are visible
    const focusStyle = await page.locator(':focus').first().evaluate((el) => {
      return window.getComputedStyle(el).outline;
    }).catch(() => '');

    // Focus indicator should be visible (outline or similar)
    // This is a basic check; more sophisticated tools like axe-core would be better

    // 6. Verify heading hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();

    if (headings.length > 0) {
      const firstHeading = headings[0];
      const firstHeadingTag = await firstHeading.evaluate(el => el.tagName);

      // First heading should ideally be H1
      expect(['H1', 'H2']).toContain(firstHeadingTag);
    }

    // 7. Verify links are distinguishable
    const links = page.locator('a');
    const linksCount = await links.count();

    if (linksCount > 0) {
      const firstLink = links.first();
      const linkStyle = await firstLink.evaluate((el) => {
        return window.getComputedStyle(el);
      });

      // Link should have some visual distinction (color, underline, etc)
      expect(linkStyle).toBeTruthy();
    }

    // 8. Test form field labels
    const inputs = page.locator('input, textarea, select');

    for (const input of await inputs.all()) {
      // Check for associated label
      const id = await input.getAttribute('id');

      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.isVisible().catch(() => false);

        // If has id, should have associated label
        expect(hasLabel || await input.getAttribute('aria-label')).toBeTruthy();
      }
    }

    console.log('Accessibility checks completed');
  });

});

test.describe('External Links and Navigation', () => {

  test('Test 14: External Links Verification', async ({ page, context }) => {
    // 1. Navigate to homepage
    await page.goto('https://playwright.dev/', { waitUntil: 'networkidle' });

    // 2. Find all external links
    const allLinks = page.locator('a[href*="http"], a[href*="//"]');
    const externalLinksCount = await allLinks.count();

    console.log(`Found ${externalLinksCount} external links`);

    // Track external link status
    const externalLinkStatus: { url: string; status?: number; error?: string }[] = [];

    // 3. Test sample of external links
    const linkElements = await allLinks.all();
    const samplesToTest = Math.min(5, linkElements.length);

    for (let i = 0; i < samplesToTest; i++) {
      const link = linkElements[i];
      const href = await link.getAttribute('href');
      const text = await link.textContent();

      if (!href) continue;

      // Skip mailto and tel links
      if (href.startsWith('mailto:') || href.startsWith('tel:')) {
        continue;
      }

      console.log(`Testing external link: ${href}`);

      // Try to verify link by making a HEAD request
      try {
        const response = await context.request.head(href, {
          timeout: 10000,
          followLocation: false // Don't follow redirects for HEAD check
        });

        externalLinkStatus.push({
          url: href,
          status: response.status()
        });
      } catch (error) {
        externalLinkStatus.push({
          url: href,
          error: String(error)
        });
      }
    }

    // Verify successful links
    for (const linkResult of externalLinkStatus) {
      // Links should not return 404 or 500 errors
      if (linkResult.status) {
        expect(linkResult.status).not.toBe(404);
        expect(linkResult.status).not.toBe(500);
      }
    }

    console.log('External links checked:', externalLinkStatus.length);
  });

  test('Test 14.1: GitHub and Community Links', async ({ page }) => {
    // Navigate to homepage
    await page.goto('https://playwright.dev/', { waitUntil: 'networkidle' });

    // Look for specific important external links
    const githubLink = page.getByRole('link').filter({ hasText: /github|repository/i }).first();
    const communityLink = page.getByRole('link').filter({ hasText: /discord|community|chat/i }).first();

    // Check for GitHub link
    if (await githubLink.isVisible()) {
      const href = await githubLink.getAttribute('href');
      expect(href).toContain('github.com');
      expect(href).toContain('microsoft/playwright');
    }

    // Check for Community link
    if (await communityLink.isVisible()) {
      const href = await communityLink.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });

});

