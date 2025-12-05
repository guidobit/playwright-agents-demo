# Playwright.dev - Test Execution Guide

## Overview

This guide explains how to run all the test files created based on the comprehensive test plan for playwright.dev.

## Test Files Structure

```
tests/
├── test-plan.md                                    # Original test plan (15 scenarios)
├── homepage-load-and-navigation.spec.ts            # Tests 1-3: Homepage, Get Started, Menu
├── code-examples-and-language.spec.ts              # Tests 4-5: Language Selector, Copy Snippet
├── documentation-and-search.spec.ts                # Tests 6-7: Search, Content, Features
├── installation-responsive-and-browser-compat.spec.ts  # Tests 9-10, 13: Install, Mobile, Browser
├── performance-accessibility-and-links.spec.ts     # Tests 11-12, 14: Performance, A11y, Links
├── sidebar-and-toc-navigation.spec.ts              # Test 15: Sidebar Navigation
└── example.spec.ts                                 # Original example tests
```

## Quick Start

### Run all tests
```bash
npm test
```

### Run tests in headed mode (see browser)
```bash
npm test -- --headed
```

### Run tests in UI mode (interactive)
```bash
npm test -- --ui
```

### Run tests in debug mode
```bash
npm test -- --debug
```

## Running Specific Test Files

### Homepage and Navigation Tests (P0 Priority)
```bash
npx playwright test homepage-load-and-navigation.spec.ts
```

**Includes:**
- Test 1: Homepage Load and Title Verification
- Test 2: Get Started Link Navigation
- Test 3: Main Menu Navigation

### Code Examples and Language Tests (P1 Priority)
```bash
npx playwright test code-examples-and-language.spec.ts
```

**Includes:**
- Test 4: Language/Framework Selector
- Test 5: Code Snippet Copy Functionality

### Documentation and Search Tests (P1 Priority)
```bash
npx playwright test documentation-and-search.spec.ts
```

**Includes:**
- Test 6: Search Functionality
- Test 7: Documentation Content Visibility
- Test 7.1: Feature Highlights Section

### Installation and Responsive Design Tests (P2 Priority)
```bash
npx playwright test installation-responsive-and-browser-compat.spec.ts
```

**Includes:**
- Test 9: Installation Instructions - Package Manager Selection
- Test 10: Mobile View (iPhone SE - 375x667)
- Test 10.1: Tablet View (iPad - 768x1024)
- Test 13: Cross-Browser Compatibility

### Performance, Accessibility, and Links Tests (P2-P3 Priority)
```bash
npx playwright test performance-accessibility-and-links.spec.ts
```

**Includes:**
- Test 11: Page Performance Check
- Test 11.1: Subpage Performance
- Test 12: Accessibility Compliance
- Test 14: External Links Verification
- Test 14.1: GitHub and Community Links

### Navigation Tests (P3 Priority)
```bash
npx playwright test sidebar-and-toc-navigation.spec.ts
```

**Includes:**
- Test 15: Sidebar Navigation
- Test 15.1: Table of Contents Navigation
- Documentation Completeness Verification

## Running Tests by Priority Level

### P0 (Critical) - Smoke Tests
```bash
npx playwright test homepage-load-and-navigation.spec.ts
```

Expected time: ~2 minutes

### P1 (High) - Core Features
```bash
npx playwright test code-examples-and-language.spec.ts documentation-and-search.spec.ts
```

Expected time: ~5 minutes

### P2 (Medium) - Performance & Compliance
```bash
npx playwright test installation-responsive-and-browser-compat.spec.ts performance-accessibility-and-links.spec.ts
```

Expected time: ~8 minutes

### Full Test Suite
```bash
npm test
```

Expected time: ~15-20 minutes

## Running Tests on Specific Browsers

### Chromium only
```bash
npx playwright test --project=chromium
```

### Firefox only
```bash
npx playwright test --project=firefox
```

### WebKit (Safari) only
```bash
npx playwright test --project=webkit
```

### All browsers (default)
```bash
npm test
```

## Running Individual Tests

### Run a specific test by name
```bash
npx playwright test -g "Homepage Load and Title Verification"
```

### Run tests matching a pattern
```bash
npx playwright test -g "Navigation"
```

## Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

This opens the test report in your default browser showing:
- ✅ Passed tests (green)
- ❌ Failed tests (red)
- ⏭️ Skipped tests (blue)
- Screenshots and traces for debugging

## Debugging Failed Tests

### Run in debug mode
```bash
npx playwright test --debug
```

This opens Playwright Inspector where you can:
- Step through test execution
- Inspect elements
- View page state
- Execute commands in console

### View trace files
```bash
npx playwright show-trace test-results/[test-name]/trace.zip
```

### Take screenshots
Tests automatically take screenshots on failure, visible in the report.

## Configuration

The test configuration is in `playwright.config.ts`:

### Key Settings
- **Test directory:** `./tests`
- **Timeout:** 30 seconds per test
- **Retries:** 0 (2 on CI)
- **Workers:** Parallel execution (1 on CI)
- **Reporter:** HTML report
- **Trace:** Recorded on first retry

### Modify browser devices
Edit `playwright.config.ts` to add/remove device emulations:

```typescript
projects: [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  },
  // Add mobile devices
  {
    name: 'Mobile Chrome',
    use: { ...devices['Pixel 5'] },
  },
]
```

## Test Scenarios Overview

| Test | Priority | Type | Time |
|------|----------|------|------|
| 1. Homepage Load & Title | P0 | Smoke | 1m |
| 2. Get Started Navigation | P0 | Functional | 1m |
| 3. Main Menu Navigation | P0 | Navigation | 1m |
| 4. Language Selector | P1 | Functional | 1m |
| 5. Copy Code Snippets | P1 | UX Feature | 1m |
| 6. Search Functionality | P1 | Functional | 1m |
| 7. Content Visibility | P1 | Verification | 2m |
| 7.1. Feature Highlights | P1 | Verification | 1m |
| 9. Installation Options | P2 | Functional | 1m |
| 10. Mobile Responsive | P2 | Responsive | 2m |
| 10.1. Tablet Responsive | P2 | Responsive | 1m |
| 11. Performance | P2 | Performance | 2m |
| 12. Accessibility | P2 | A11y | 2m |
| 13. Cross-Browser | P2 | Compatibility | 3m |
| 14. External Links | P3 | Link Check | 2m |
| 15. Sidebar Navigation | P3 | Navigation | 2m |

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Playwright Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## Troubleshooting

### Tests Timeout
- Increase timeout: `npx playwright test --timeout=60000`
- Check internet connection to playwright.dev
- Try running on single browser: `npx playwright test --project=chromium`

### Elements Not Found
- Check if page layout changed
- Run in headed mode to see actual page: `--headed`
- Use debug mode to inspect: `--debug`

### Flaky Tests
- Most tests have built-in waits and retries
- Mobile tests may need extra waits due to rendering
- Performance tests may fail on slow networks

### Skip Specific Tests
Add `.skip()` to test or use:
```bash
npx playwright test --grep-invert "Performance"
```

## Best Practices

1. **Run P0 tests first** before merging code
2. **Run full suite before releases** to catch regressions
3. **Check reports** for visual regressions
4. **Keep tests updated** when playwright.dev changes
5. **Run on CI** to catch environment-specific issues

## Extended Test Capabilities

These tests demonstrate Playwright features:

✅ **Page Navigation** - `page.goto()`, `page.click()`
✅ **Locators** - By role, text, CSS, XPath
✅ **Actions** - Click, type, hover, scroll
✅ **Assertions** - `expect()` statements
✅ **Waits** - Network idle, DOM content
✅ **Multi-Browser** - Chromium, Firefox, WebKit
✅ **Device Emulation** - Mobile, tablet viewports
✅ **Performance Metrics** - Page load timing
✅ **Accessibility** - ARIA attributes, keyboard nav
✅ **Screenshots & Traces** - Debugging failed tests

## Next Steps

1. Run tests: `npm test`
2. View report: `npx playwright show-report`
3. Debug failures: `npx playwright test --debug`
4. Integrate into CI/CD pipeline
5. Customize for your specific needs

---

For more information, see:
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Test Configuration](https://playwright.dev/docs/test-configuration)
- [Best Practices](https://playwright.dev/docs/best-practices)

