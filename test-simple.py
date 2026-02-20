"""Simple Playwright test"""
from playwright.sync_api import sync_playwright
import sys

print("Starting browser...")
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    print("Navigating...")
    page.goto("http://127.0.0.1:4174/", timeout=10000)
    print(f"Title: {page.title()}")
    page.wait_for_timeout(2000)
    
    # Check onboarding
    text = page.text_content("body")
    print(f"Body text (first 200): {text[:200] if text else 'EMPTY'}")
    
    has_welcome = "Willkommen" in (text or "")
    print(f"Onboarding visible: {has_welcome}")
    
    if has_welcome:
        print("✅ Onboarding works")
    else:
        print("❌ Onboarding NOT showing")
    
    browser.close()
    print("Done")
