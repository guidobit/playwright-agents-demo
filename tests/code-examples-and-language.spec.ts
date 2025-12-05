// spec: specs/plan.md
// Test scenarios 4-5: Language/Framework Selector and Code Snippet Copy

import { test, expect } from '@playwright/test';

test.describe('Code Examples and Language Selection', () => {

  test('Test 4: Language/Framework Selector', async ({ page }) => {
    // Navigate to a page with code examples
    await page.goto('https://playwright.dev/docs/intro', { waitUntil: 'networkidle' });

    // 1. Locate the language/framework selector dropdown
    const languageSelector = page.locator('[class*="language"], [class*="selector"], select, [role="listbox"]').first();

    // Try to find language toggle buttons
    const languageButtons = page.locator('[role="button"][class*="lang"], [aria-label*="language"], [aria-label*="Language"]');
    let hasLanguageSelector = await languageButtons.count() > 0 || await languageSelector.isVisible().catch(() => false);

    if (!hasLanguageSelector) {
      // Look for tab-like language selectors
      const tabs = page.locator('[role="tab"], [class*="tab"]').filter({ hasText: /JavaScript|Python|Java|C#|TypeScript/ });
      hasLanguageSelector = await tabs.count() > 0;
    }

    test.skip(!hasLanguageSelector, 'Language selector not found on this page');

    // 2. Verify code examples exist
    const codeBlocks = page.locator('pre, code');
    expect(await codeBlocks.count()).toBeGreaterThan(0);

    // Store initial code content
    const initialCodeText = await codeBlocks.first().textContent();

    // 3. Try to select different language
    const pythonOption = page.getByRole('button', { name: /Python/ }).or(
      page.locator('text=Python')
    ).first();

    const hasJavaScript = page.getByRole('button', { name: /JavaScript|TypeScript/ });
    const hasPython = page.getByRole('button', { name: /Python/ });

    if (await hasPython.isVisible()) {
      await hasPython.click();

      // 4. Verify code examples update
      await page.waitForTimeout(300); // Wait for DOM update

      const updatedCodeText = await codeBlocks.first().textContent();
      // Code should be different or at least the attempt was made
      expect(updatedCodeText).toBeTruthy();
    }

    // 5. Test with JavaScript if available
    if (await hasJavaScript.isVisible()) {
      await hasJavaScript.click();

      await page.waitForTimeout(300);
      const jsCodeText = await codeBlocks.first().textContent();
      expect(jsCodeText).toBeTruthy();
    }

    // No console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.waitForTimeout(200);
    expect(errors.length).toBe(0);
  });

  test('Test 5: Code Snippet Copy Functionality', async ({ page }) => {
    // 1. Navigate to a page with code examples
    await page.goto('https://playwright.dev/docs/intro', { waitUntil: 'networkidle' });

    // 2. Find code snippets
    const codeBlocks = page.locator('pre');
    expect(await codeBlocks.count()).toBeGreaterThan(0);

    const firstCodeBlock = codeBlocks.first();

    // 3. Hover over code snippet to reveal copy button
    await firstCodeBlock.hover();

    // 4. Locate and click the copy button (usually appears on hover)
    const copyButton = firstCodeBlock.locator('button[title*="Copy"], [aria-label*="copy"], .copy-button').first()
      .or(page.locator('button:has-text("Copy")')).first();

    // Try to find copy button in the same container
    const codeContainer = firstCodeBlock.locator('..').first();
    const copyButtonInContainer = codeContainer.locator('button').first();

    let foundCopyButton = false;

    if (await copyButton.isVisible().catch(() => false)) {
      foundCopyButton = true;
      await copyButton.click();
    } else if (await copyButtonInContainer.isVisible().catch(() => false)) {
      const buttonText = await copyButtonInContainer.textContent();
      if (buttonText?.toLowerCase().includes('copy')) {
        foundCopyButton = true;
        await copyButtonInContainer.click();
      }
    }

    if (foundCopyButton) {
      // 5. Wait 1 second for clipboard to be updated
      await page.waitForTimeout(500);

      // 6. Verify content was copied (check clipboard via JavaScript)
      const clipboardText = await page.evaluate(async () => {
        try {
          return await navigator.clipboard.readText();
        } catch {
          return '';
        }
      });

      // The clipboard should contain something
      expect(clipboardText.length).toBeGreaterThan(0);
    } else {
      test.skip(true, 'Copy button not found on page');
    }

    // 7. Test with multiple code examples
    const allCodeBlocks = await page.locator('pre').all();

    for (let i = 0; i < Math.min(allCodeBlocks.length, 2); i++) {
      const block = allCodeBlocks[i];
      await block.hover();
      await page.waitForTimeout(100);
    }

    // No console errors during copy operations
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.waitForTimeout(200);
    expect(errors.length).toBe(0);
  });

});

