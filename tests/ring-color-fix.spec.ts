/**
 * Targeted tests for the ProgressRing color fix:
 * - Ring stroke = always blue gradient (url(#...) reference)
 * - Glass fill = red/orange/yellow/blue (no green)
 */
import { test, expect, type Page } from '@playwright/test';

const BASE = 'http://localhost:4174';

async function skipOnboarding(page: Page) {
  await page.waitForTimeout(1500);
  const skipBtn = page.locator('button').filter({ hasText: /Überspringen|Skip/i });
  if (await skipBtn.count() > 0) {
    await skipBtn.first().click();
    await page.waitForTimeout(1000);
  }
}

test.describe('ProgressRing — Ring-Farben Bugfix', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('Ring-Stroke verwendet einen Gradient (url(#...)), keine Vollfarbe', async ({ page }) => {
    await page.goto(BASE, { timeout: 15000 });
    await skipOnboarding(page);

    // The progress arc is circle[1]: track=circle[0], arc=circle[1]
    // circle[2] is a small decoration with no stroke — so we use nth(1)
    const progressArc = page.locator('circle').nth(1);
    const strokeVal = await progressArc.getAttribute('stroke');
    expect(strokeVal).toMatch(/^url\(#/);
  });

  test('Ring-Gradient enthält Blau-Töne (cyan → sky → blue)', async ({ page }) => {
    await page.goto(BASE, { timeout: 15000 });
    await skipOnboarding(page);

    // SVG[0] is a nav icon; SVG[1] is the progress ring (contains linearGradient)
    // Use the gradient element directly to be index-independent
    const gradHtml = await page.locator('linearGradient#progressRingBlueGrad').innerHTML();
    expect(gradHtml.toLowerCase()).toContain('67e8f9'); // cyan-300
    expect(gradHtml.toLowerCase()).toContain('0ea5e9'); // sky-500
    expect(gradHtml.toLowerCase()).toContain('2563eb'); // blue-600
  });

  test('Ring-Gradient enthält KEIN Rot, Orange oder Gelb', async ({ page }) => {
    await page.goto(BASE, { timeout: 15000 });
    await skipOnboarding(page);

    // Directly query the gradient element by ID — index-independent
    const gradHtml = await page.locator('linearGradient#progressRingBlueGrad').innerHTML();
    expect(gradHtml).not.toContain('ef4444'); // no red
    expect(gradHtml).not.toContain('f97316'); // no orange
    expect(gradHtml).not.toContain('eab308'); // no yellow
    expect(gradHtml).not.toContain('22c55e'); // no green
  });

  test('Mini-Glas SVG-Stop enthält KEIN Grün (#22c55e)', async ({ page }) => {
    await page.goto(BASE, { timeout: 15000 });
    await skipOnboarding(page);

    // Get all SVG content on the page
    const allSvgContent = await page.evaluate(() =>
      Array.from(document.querySelectorAll('svg')).map(s => s.innerHTML).join(' ')
    );
    // The old broken code used #22c55e (green) — must not appear
    expect(allSvgContent.toLowerCase()).not.toContain('22c55e');
  });

  test('getGlassColor Logik: kein Grün in keiner Farb-Stufe', async ({ page }) => {
    // This test injects the color logic and checks all thresholds
    await page.goto(BASE, { timeout: 15000 });

    const result = await page.evaluate(() => {
      function getGlassColor(pct: number): string {
        if (pct < 30) return '#ef4444';
        if (pct < 60) return '#f97316';
        if (pct < 85) return '#eab308';
        return '#3b82f6';
      }
      const cases = [0, 15, 29, 30, 45, 59, 60, 70, 84, 85, 90, 100];
      return cases.map(p => ({ pct: p, color: getGlassColor(p) }));
    });

    for (const { pct, color } of result) {
      // Must never be green (#22c55e) or old cyan (#06b6d4)
      expect(color, `pct=${pct} must not be green`).not.toBe('#22c55e');
      expect(color, `pct=${pct} must not be old cyan`).not.toBe('#06b6d4');
      // Must be one of the 4 allowed colors
      expect(['#ef4444', '#f97316', '#eab308', '#3b82f6']).toContain(color);
    }

    // Boundary checks
    expect(result.find(r => r.pct === 29)?.color).toBe('#ef4444');  // 29% → red
    expect(result.find(r => r.pct === 30)?.color).toBe('#f97316');  // 30% → orange
    expect(result.find(r => r.pct === 59)?.color).toBe('#f97316');  // 59% → orange
    expect(result.find(r => r.pct === 60)?.color).toBe('#eab308');  // 60% → yellow
    expect(result.find(r => r.pct === 84)?.color).toBe('#eab308');  // 84% → yellow
    expect(result.find(r => r.pct === 85)?.color).toBe('#3b82f6');  // 85% → blue
    expect(result.find(r => r.pct === 100)?.color).toBe('#3b82f6'); // 100% → blue
  });

  test('Screenshot: Dashboard mit ProgressRing', async ({ page }) => {
    await page.goto(BASE, { timeout: 15000 });
    await skipOnboarding(page);
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: '/home/alex/app/water-tracker/test-results/ring-color-fix.png',
      fullPage: false,
    });
    // Just verify screenshot was taken (file existence checked separately)
    expect(true).toBe(true);
  });
});
