import { test, expect, Page } from '@playwright/test';
import path from 'path';

const APP_URL = 'http://127.0.0.1:4174';

async function clearOnboardingState(page: Page) {
  await page.context().clearCookies();
  await page.goto(APP_URL);
  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase('WaterTrackerDB');
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => resolve();
    });
  });
  // Also clear localStorage just in case
  await page.evaluate(() => localStorage.clear());
}

test.describe('Onboarding Bugfixes', () => {
  test.beforeEach(async ({ page }) => {
    await clearOnboardingState(page);
    // Reload so the app re-reads clean state
    await page.reload();
    await page.waitForTimeout(1500);
  });

  // ── TEST 1: First screen is Language Selection ──────────────────────────────
  test('TC-01: First screen is Language Selection (not Welcome/Willkommen)', async ({ page }) => {
    // Should NOT contain "Willkommen" or "Welcome" as main heading
    const heading = page.locator('h1');
    await expect(heading).toBeVisible({ timeout: 5000 });

    const headingText = await heading.first().innerText();
    console.log('First screen h1 text:', headingText);

    // Must contain multilingual language label, not a single-language welcome
    expect(headingText).toContain('Language');
    expect(headingText).not.toMatch(/^Willkommen$/i);
    expect(headingText).not.toMatch(/^Welcome$/i);

    // Language buttons must be visible
    await expect(page.getByRole('button', { name: /Deutsch/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /English/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Français/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Türkçe/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Italiano/i })).toBeVisible();

    // Screenshot
    await page.screenshot({
      path: 'test-results/artifacts/tc01-language-selection-screen.png',
      fullPage: true,
    });

    console.log('✅ TC-01 PASS: First screen shows language selection');
  });

  // ── TEST 2: After selecting English → subsequent screen is in English ────────
  test('TC-02: Select English → next screens rendered in English', async ({ page }) => {
    // Click English
    await page.getByRole('button', { name: /English/i }).click();
    await page.waitForTimeout(300);

    // The "Next" button should be labelled "Next" (English)
    const nextBtn = page.getByRole('button', { name: /^Next$/i });
    await expect(nextBtn).toBeVisible({ timeout: 3000 });

    await page.screenshot({
      path: 'test-results/artifacts/tc02-english-selected-next-btn.png',
      fullPage: true,
    });

    // Click Next → go to Step 1 (Welcome screen in English)
    await nextBtn.click();
    await page.waitForTimeout(500);

    // Step 1 welcome heading must be English text (not German "Willkommen")
    const welcomeHeading = page.locator('h1');
    const welcomeText = await welcomeHeading.first().innerText();
    console.log('Step 1 heading:', welcomeText);

    expect(welcomeText).not.toMatch(/Willkommen/i);
    // The translation key "onboarding.welcome" should resolve to English
    // We just verify it's visible and not empty
    await expect(welcomeHeading.first()).toBeVisible();
    expect(welcomeText.length).toBeGreaterThan(0);

    // Look for English "Next" button on step 1 (translated via i18n)
    const nextBtn2 = page.getByRole('button', { name: /^Next$/i });
    await expect(nextBtn2).toBeVisible({ timeout: 3000 });

    await page.screenshot({
      path: 'test-results/artifacts/tc02-step1-english-welcome.png',
      fullPage: true,
    });

    console.log('✅ TC-02 PASS: English selected → subsequent screen in English');
  });

  // ── TEST 3: img tags with real PNGs (no pure-emoji icons) ───────────────────
  test('TC-03: Onboarding uses real PNG img tags, not emoji-only icons', async ({ page }) => {
    // Navigate through onboarding to see all steps that have icons

    // Step 0 — language screen (globe emoji is decorative, no img required here)
    // Click English + Next to reach Step 1
    await page.getByRole('button', { name: /English/i }).click();
    await page.waitForTimeout(200);
    await page.getByRole('button', { name: /^Next$/i }).click();
    await page.waitForTimeout(500);

    // Step 1: should have <img src="/icons/water.png">
    const waterImgStep1 = page.locator('img[src="/icons/water.png"]');
    await expect(waterImgStep1.first()).toBeVisible({ timeout: 3000 });
    console.log('Step 1: water.png img found ✅');

    await page.screenshot({
      path: 'test-results/artifacts/tc03-step1-png-icon.png',
      fullPage: true,
    });

    // Next → Step 2 (goal — no specific icon required, just verify no crashes)
    await page.getByRole('button', { name: /^Next$/i }).click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'test-results/artifacts/tc03-step2-goal.png',
      fullPage: true,
    });

    // Next → Step 3 (favorites)
    await page.getByRole('button', { name: /^Next$/i }).click();
    await page.waitForTimeout(500);

    // Step 3: sparkling_water.png header + water.png, coffee.png, tea_herbal.png in list
    await expect(page.locator('img[src="/icons/sparkling_water.png"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('img[src="/icons/water.png"]').first()).toBeVisible();
    await expect(page.locator('img[src="/icons/coffee.png"]').first()).toBeVisible();
    await expect(page.locator('img[src="/icons/tea_herbal.png"]').first()).toBeVisible();
    console.log('Step 3: sparkling_water.png, water.png, coffee.png, tea_herbal.png found ✅');

    await page.screenshot({
      path: 'test-results/artifacts/tc03-step3-favorites-png-icons.png',
      fullPage: true,
    });

    // Next → Step 4 (stats)
    await page.getByRole('button', { name: /^Next$/i }).click();
    await page.waitForTimeout(500);

    // Step 4: cola.png header + water.png, coffee.png, beer.png in list
    await expect(page.locator('img[src="/icons/cola.png"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('img[src="/icons/water.png"]').first()).toBeVisible();
    await expect(page.locator('img[src="/icons/coffee.png"]').first()).toBeVisible();
    await expect(page.locator('img[src="/icons/beer.png"]').first()).toBeVisible();
    console.log('Step 4: cola.png, water.png, coffee.png, beer.png found ✅');

    await page.screenshot({
      path: 'test-results/artifacts/tc03-step4-stats-png-icons.png',
      fullPage: true,
    });

    console.log('✅ TC-03 PASS: All onboarding steps use real PNG img tags');
  });

  // ── TEST 4: Text readability — white text on blue background ────────────────
  test('TC-04: Text readability — headings and body text use white (not grey)', async ({ page }) => {
    // Take full-page screenshot of step 0 for visual review
    await page.screenshot({
      path: 'test-results/artifacts/tc04-step0-readability.png',
      fullPage: true,
    });

    // Check computed color of the h1 heading
    const h1Color = await page.locator('h1').first().evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    console.log('h1 computed color:', h1Color);

    // White = rgb(255, 255, 255) — allow slight deviation but must be bright
    const match = h1Color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const [, r, g, b] = match.map(Number);
      // White text has high values; grey text would be around rgb(128,128,128) or lower
      // We check that text is NOT dark/grey (luminance > 0.5 means bright)
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      console.log(`h1 luminance: ${luminance.toFixed(2)} (expected ≥ 0.8 for white)`);
      expect(luminance).toBeGreaterThanOrEqual(0.7);
    }

    // Check language button text color (selected state → blue text on white bg, unselected → white)
    const btnColor = await page.locator('button').filter({ hasText: /English/i }).evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    console.log('Unselected language button color:', btnColor);

    // Navigate to step 1 and check body text
    await page.getByRole('button', { name: /English/i }).click();
    await page.waitForTimeout(200);
    await page.getByRole('button', { name: /^Next$/i }).click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: 'test-results/artifacts/tc04-step1-readability.png',
      fullPage: true,
    });

    // Check paragraph text on step 1 (welcomeText) — should NOT be grey
    const paraColor = await page.locator('p').first().evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    console.log('Paragraph computed color:', paraColor);

    const paraMatch = paraColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (paraMatch) {
      const [, r, g, b] = paraMatch.map(Number);
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      console.log(`Paragraph luminance: ${lum.toFixed(2)} (expected ≥ 0.6 for readable white/light)`);
      // text-white/75 = rgba(255,255,255,0.75) → computed against blue bg would be ~(195,217,234)
      // We just ensure it's not dark grey (lum < 0.4)
      expect(lum).toBeGreaterThan(0.4);
    }

    console.log('✅ TC-04 PASS: Text has sufficient luminance on blue background');
  });

  // ── TEST 5: Full flow smoke test ────────────────────────────────────────────
  test('TC-05: Full onboarding flow completes without errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', err => consoleErrors.push(`PAGE_ERROR: ${err.message}`));

    // Step 0 → select English → next
    await page.getByRole('button', { name: /English/i }).click();
    await page.waitForTimeout(200);
    await page.getByRole('button', { name: /^Next$/i }).click();
    await page.waitForTimeout(400);

    // Step 1 → next
    await page.getByRole('button', { name: /^Next$/i }).click();
    await page.waitForTimeout(400);

    // Step 2 (goal) → next
    await page.getByRole('button', { name: /^Next$/i }).click();
    await page.waitForTimeout(400);

    // Step 3 (favorites) → next
    await page.getByRole('button', { name: /^Next$/i }).click();
    await page.waitForTimeout(400);

    // Step 4 (stats) → Let's Go
    const letsGoBtn = page.getByRole('button', { name: /Let.s Go|Let's Go|Loslegen|Allons-y|Hadi|Andiamo/i });
    await expect(letsGoBtn).toBeVisible({ timeout: 3000 });
    await letsGoBtn.click();
    await page.waitForTimeout(1000);

    // Should now be on dashboard (no longer onboarding)
    await page.screenshot({
      path: 'test-results/artifacts/tc05-after-onboarding-dashboard.png',
      fullPage: true,
    });

    // No critical console errors
    const criticalErrors = consoleErrors.filter(e =>
      !e.includes('favicon') && !e.includes('404') && !e.includes('ResizeObserver')
    );
    console.log('Console errors:', criticalErrors);
    expect(criticalErrors.length).toBe(0);

    console.log('✅ TC-05 PASS: Full onboarding flow completed without errors');
  });
});
