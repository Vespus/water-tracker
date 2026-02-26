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

async function addDrink(page: Page) {
  // Click the first quick-add button (usually Water with a preset ml value)
  const quickBtns = page.locator('button').filter({ hasText: /ml/i });
  const count = await quickBtns.count();
  if (count > 0) {
    await quickBtns.first().click();
    await page.waitForTimeout(800);
    return true;
  }
  return false;
}

async function openEditDialog(page: Page) {
  // Find the last entry in DrinkLog (div with pencil icon button)
  // Each entry row is a div.rounded-2xl containing two buttons (edit + delete)
  // We look for buttons inside entry rows - edit is the one with Pencil SVG
  const pencilBtns = page.locator('button[class*="text-gray"]').filter({
    has: page.locator('svg')
  });
  const btnCount = await pencilBtns.count();
  if (btnCount >= 2) {
    // Second-to-last button group: first is edit, second is delete
    await pencilBtns.nth(btnCount - 2).click();
  } else if (btnCount === 1) {
    await pencilBtns.first().click();
  } else {
    // Fallback: any button with an SVG that's not in the nav
    const entryBtns = page.locator('div.space-y-3 button');
    const ec = await entryBtns.count();
    if (ec >= 2) await entryBtns.nth(ec - 2).click();
  }
  await page.waitForTimeout(500);
}

test.describe('US-010: Zeit-Anpassung über Edit-Button', () => {

  test('S1: Edit-Dialog zeigt input[type=time] vorausgefüllt', async ({ page }) => {
    await page.goto(BASE, { timeout: 15000 });
    await skipOnboarding(page);

    const added = await addDrink(page);
    expect(added).toBe(true);

    await openEditDialog(page);

    // Zeit-Input muss sichtbar sein
    const timeInput = page.locator('input[type="time"]');
    await expect(timeInput).toBeVisible({ timeout: 5000 });

    // Wert darf nicht leer sein
    const val = await timeInput.inputValue();
    expect(val.length).toBeGreaterThan(0);
    expect(val).toMatch(/^\d{2}:\d{2}$/);

    console.log('✅ S1 PASS – Zeit-Input sichtbar, Wert:', val);
  });

  test('S2: Edit-Dialog hat alle 3 Felder (Getränk, Menge, Zeit)', async ({ page }) => {
    await page.goto(BASE, { timeout: 15000 });
    await skipOnboarding(page);

    await addDrink(page);
    await openEditDialog(page);

    await expect(page.locator('select')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="number"]')).toBeVisible();
    await expect(page.locator('input[type="time"]')).toBeVisible();

    console.log('✅ S2 PASS – Select, number, time inputs alle vorhanden');
  });

  test('S3: Uhrzeit ändern und speichern aktualisiert den Eintrag', async ({ page }) => {
    await page.goto(BASE, { timeout: 15000 });
    await skipOnboarding(page);

    await addDrink(page);
    await openEditDialog(page);

    const timeInput = page.locator('input[type="time"]');
    await expect(timeInput).toBeVisible({ timeout: 5000 });

    // Zeit auf 07:45 setzen
    await timeInput.fill('07:45');
    await page.waitForTimeout(200);

    // Speichern – grüner Check-Button
    // Im Edit-Bereich (div.space-y-3) sind die letzten zwei Buttons: Save (grün) und Cancel (grau)
    const editArea = page.locator('div.space-y-3');
    const saveBtns = editArea.locator('button');
    const sc = await saveBtns.count();
    // Save ist vorletzter, Cancel ist letzter
    await saveBtns.nth(sc - 2).click();
    await page.waitForTimeout(1000);

    // Kein Edit-Dialog mehr sichtbar
    await expect(page.locator('input[type="time"]')).not.toBeVisible();

    // Eintrag sollte 07:45 anzeigen
    const pageText = await page.locator('body').innerText();
    const shows745 = pageText.includes('07:45') || pageText.includes('7:45');
    expect(shows745).toBe(true);

    console.log('✅ S3 PASS – 07:45 wird nach dem Speichern angezeigt');
  });

  test('S4: Abbrechen schließt Dialog ohne Speichern', async ({ page }) => {
    await page.goto(BASE, { timeout: 15000 });
    await skipOnboarding(page);

    await addDrink(page);
    await openEditDialog(page);

    const timeInput = page.locator('input[type="time"]');
    await expect(timeInput).toBeVisible({ timeout: 5000 });

    // Cancel-Button (letzter im Edit-Bereich)
    const editArea = page.locator('div.space-y-3');
    const btns = editArea.locator('button');
    const count = await btns.count();
    await btns.nth(count - 1).click();
    await page.waitForTimeout(500);

    // Edit-Dialog weg
    await expect(page.locator('input[type="time"]')).not.toBeVisible();

    console.log('✅ S4 PASS – Abbrechen schließt Dialog');
  });

});
