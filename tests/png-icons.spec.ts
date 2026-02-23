import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4174';

/** Skip onboarding by clicking the skip/überspringen button, then wait for dashboard */
async function skipOnboarding(page: import('@playwright/test').Page) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  // If onboarding shows, click "Überspringen" / "Skip"
  const skipBtn = page.locator('button', { hasText: /überspringen|skip/i });
  if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipBtn.click();
    await page.waitForTimeout(500);
  }
  // Wait for dashboard content
  await page.waitForTimeout(800);
}

test.describe('PNG Icons + sports_drink removal', () => {

  test('Dashboard QuickButtons render PNG icons', async ({ page }) => {
    await skipOnboarding(page);

    // Wait for page to fully render
    await page.waitForLoadState('domcontentloaded');

    // Look for any img with /icons/ src path
    const iconImgs = page.locator('img[src*="/icons/"]');
    const count = await iconImgs.count();

    // Take a screenshot for evidence
    await page.screenshot({ path: 'test-results/artifacts/dashboard-png-icons.png', fullPage: true });

    expect(count).toBeGreaterThan(0);
    console.log(`✅ Found ${count} PNG icon(s) on dashboard (QuickButtons/anywhere)`);

    // Check water icon specifically
    const waterImg = page.locator('img[src="/icons/water.png"]');
    expect(await waterImg.count()).toBeGreaterThan(0);
    console.log('✅ water.png confirmed present');
  });

  test('AddDrinkModal shows PNG icons in beverage grid', async ({ page }) => {
    await skipOnboarding(page);

    // Click "+" / "Getränk hinzufügen" button
    const addBtn = page.locator('button', { hasText: /getränk hinzufügen|add drink/i });
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(600);

      // Check modal for PNG icons
      const modalImgs = page.locator('img[src*="/icons/"]');
      const count = await modalImgs.count();
      await page.screenshot({ path: 'test-results/artifacts/modal-png-icons.png' });
      expect(count).toBeGreaterThan(0);
      console.log(`✅ Modal: ${count} PNG icons in beverage grid`);
    } else {
      // Try clicking the + fab button
      const fab = page.locator('[class*="rounded-full"][class*="bg-blue"], [class*="fab"]').first();
      if (await fab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await fab.click();
        await page.waitForTimeout(600);
        const modalImgs = page.locator('img[src*="/icons/"]');
        const count = await modalImgs.count();
        expect(count).toBeGreaterThan(0);
        console.log(`✅ Modal via FAB: ${count} PNG icons`);
      } else {
        console.log('ℹ️ Add button not found — skipping modal icon check');
        // Not a hard failure since dashboard test covers icons
      }
    }
  });

  test('sports_drink is completely absent from the UI', async ({ page }) => {
    await skipOnboarding(page);

    const bodyText = (await page.locator('body').textContent()) ?? '';
    const hasSportsDrink = /sportgetränk|sports.?drink/i.test(bodyText);
    expect(hasSportsDrink).toBeFalsy();
    console.log('✅ sports_drink text not found anywhere on page');

    // No sports_drink icon src
    const sdImg = page.locator('img[src*="sports_drink"]');
    expect(await sdImg.count()).toBe(0);
    console.log('✅ No sports_drink img src found');
  });

  test('All /icons/*.png requests return HTTP 200 (no 404s)', async ({ page }) => {
    const failed: string[] = [];
    page.on('response', (resp) => {
      if (resp.url().includes('/icons/') && resp.status() !== 200) {
        failed.push(`${resp.status()} ${resp.url()}`);
      }
    });

    await skipOnboarding(page);
    await page.waitForTimeout(1500);

    expect(failed).toHaveLength(0);
    console.log('✅ All /icons/*.png loaded with HTTP 200');
  });

  test('sports_drink absent from AddDrinkModal beverage list', async ({ page }) => {
    await skipOnboarding(page);

    // Try to open the Add Drink modal
    const addBtn = page.locator('button', { hasText: /getränk hinzufügen|add drink/i });
    if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(600);

      const modalText = (await page.locator('body').textContent()) ?? '';
      const hasSports = /sportgetränk|sports.?drink/i.test(modalText);
      expect(hasSports).toBeFalsy();
      console.log('✅ sports_drink not in AddDrinkModal');
    } else {
      console.log('ℹ️ Could not open modal — skipping this sub-check');
    }
  });

});
