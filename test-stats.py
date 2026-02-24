from playwright.sync_api import sync_playwright
import os

# Get current day of week
from datetime import datetime
today = datetime.now()
weekday_names = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]
today_name = weekday_names[today.weekday()]

print(f"Today is: {today.strftime('%Y-%m-%d')} ({today_name})")

with sync_playwright() as p:
    browser = p.chromium.launch()
    
    # Test Light Mode
    page = browser.new_page(viewport={"width": 390, "height": 844}, color_scheme="light")
    errors = []
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
    page.on("pageerror", lambda err: errors.append(f"PAGE_ERROR: {err.message}"))
    
    page.goto("http://localhost:4174/")
    page.wait_for_timeout(3000)
    
    # Look for Statistics tab
    stats_tab = page.locator("text=Statistik").first()
    if stats_tab.is_visible():
        stats_tab.click()
        page.wait_for_timeout(2000)
    
    # Take screenshot of statistics
    page.screenshot(path="~/app/water-tracker/test-results/stats-light.png")
    
    # Get the week chart days
    # Look for day labels in the chart
    day_labels = page.locator("text=Montag").all() + page.locator("text=Dienstag").all() + \
                 page.locator("text=Mittwoch").all() + page.locator("text=Donnerstag").all() + \
                 page.locator("text=Freitag").all() + page.locator("text=Samstag").all() + \
                 page.locator("text=Sonntag").all()
    
    print(f"\n=== Statistics Page Analysis ===")
    print(f"Found {len(day_labels)} day labels on stats page")
    
    # Now check History tab
    history_tab = page.locator("text=Verlauf").first()
    if history_tab.is_visible():
        history_tab.click()
        page.wait_for_timeout(2000)
    
    page.screenshot(path="~/app/water-tracker/test-results/history-light.png")
    
    print(f"Console Errors: {errors}")
    
    browser.close()

print("\n=== Done ===")
print(f"Screenshots saved to ~/app/water-tracker/test-results/")
