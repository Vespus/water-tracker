"""Playwright E2E test for Water Tracker — Milestone 4"""
import sys
from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:4174"
errors = []

def check(name, condition):
    if condition:
        print(f"  ✅ {name}")
    else:
        print(f"  ❌ {name}")
        errors.append(name)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    print("\n🧪 TEST: App loads + Onboarding")
    page.goto(BASE, timeout=10000)
    page.wait_for_timeout(2000)
    body = page.text_content("body") or ""
    check("Page loaded", len(body) > 10)
    check("Onboarding welcome visible", "Willkommen" in body)
    check("Skip button visible", "Überspringen" in body)

    print("\n🧪 TEST: Onboarding flow - Step 1→2")
    page.click("text=Weiter", timeout=3000)
    page.wait_for_timeout(500)
    body = page.text_content("body") or ""
    check("Goal step visible", "Tagesziel" in body)
    check("Goal slider visible", page.locator("input[type='range']").count() > 0)

    print("\n🧪 TEST: Onboarding flow - Step 2→3")
    page.click("text=Weiter", timeout=3000)
    page.wait_for_timeout(500)
    body = page.text_content("body") or ""
    check("Language step visible", "Sprache" in body)
    check("Language options visible", "Deutsch" in body and "English" in body)

    print("\n🧪 TEST: Complete onboarding")
    page.click("text=Los geht's", timeout=3000)
    page.wait_for_timeout(1000)
    body = page.text_content("body") or ""
    check("Dashboard visible after onboarding", "Heute" in body)

    print("\n🧪 TEST: No onboarding on reload")
    page.reload()
    page.wait_for_timeout(2000)
    body = page.text_content("body") or ""
    check("Dashboard on reload", "Heute" in body)
    check("No onboarding on reload", "Willkommen" not in body)

    print("\n🧪 TEST: Settings page")
    page.click("text=Einstellungen", timeout=3000)
    page.wait_for_timeout(500)
    body = page.text_content("body") or ""
    check("Settings loaded", "Einstellungen" in body)
    check("Goal slider in settings", page.locator("input[type='range']").count() > 0)
    check("Goal hint visible", "Empfohlen" in body)
    check("Language selector", "Deutsch" in body and "English" in body)

    print("\n🧪 TEST: Add drink + Edit/Delete")
    page.click("text=Dashboard", timeout=3000)
    page.wait_for_timeout(500)
    page.click("text=Getränk hinzufügen", timeout=3000)
    page.wait_for_timeout(500)
    
    # Pick water (💧 button inside modal)
    modal = page.locator(".fixed.inset-0")
    water_btn = modal.locator("button", has_text="💧").first
    water_btn.click(timeout=5000)
    page.wait_for_timeout(500)
    # Pick glass preset
    glass = modal.locator("button", has_text="Glas").first
    glass.click(timeout=5000)
    page.wait_for_timeout(1500)

    body = page.text_content("body") or ""
    has_entries = "Heutige Einträge" in body
    check("Drink entry visible", has_entries)

    if has_entries:
        # Edit button
        edit_btns = page.locator("button:has(svg)").all()
        pencil_found = any("blue" in (b.get_attribute("class") or "") for b in edit_btns)
        check("Edit/Delete buttons exist", len(edit_btns) >= 2)
        
        # Click delete (last button in entry row)
        trash_btns = page.locator("[class*='hover:text-red']").all()
        if trash_btns:
            trash_btns[0].click()
            page.wait_for_timeout(500)
            body = page.text_content("body") or ""
            check("Undo bar after delete", "Rückgängig" in body)

    print("\n🧪 TEST: Dark Mode")
    html = page.content()
    check("dark: classes in rendered HTML", "dark:" in html)
    check("dark:bg-gray-900", "dark:bg-gray-900" in html)
    check("dark:bg-gray-800", "dark:bg-gray-800" in html)

    browser.close()

    print("\n" + "="*50)
    if errors:
        print(f"❌ FAILED: {len(errors)} test(s)")
        for e in errors:
            print(f"   - {e}")
        sys.exit(1)
    else:
        print("✅ ALL TESTS PASSED — Release-ready!")
        sys.exit(0)
