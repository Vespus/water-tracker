"""
Test: Statistics Date Shift Bug Fix
Today: Tuesday 2026-02-24
Expected: drink added today appears under Tuesday's bar, not Wednesday's
"""
from playwright.sync_api import sync_playwright
import datetime, os

RESULTS_DIR = "/home/alex/app/water-tracker/test-results"
os.makedirs(RESULTS_DIR, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 390, "height": 844}, color_scheme="light")

    errors = []
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
    page.on("pageerror", lambda err: errors.append(f"PAGE_ERROR: {err.message}"))

    page.goto("http://localhost:4174/")
    page.wait_for_timeout(3000)

    # ── Screenshot: Dashboard
    page.screenshot(path=f"{RESULTS_DIR}/date-shift-01-dashboard.png")
    print("=== Dashboard loaded ===")
    print("Title:", page.title())

    # ── Get today's weekday from the browser's JS
    today_js = page.evaluate("""
        () => {
            const now = new Date();
            const days = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
            return {
                dayName: days[now.getDay()],
                dayIndex: now.getDay(),
                dateStr: now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0'),
                utcDateStr: now.toISOString().slice(0,10)
            };
        }
    """)
    print(f"\n=== Browser Date Info ===")
    print(f"Local date: {today_js['dateStr']} ({today_js['dayName']})")
    print(f"UTC date:   {today_js['utcDateStr']}")

    # ── Add a drink on the Dashboard
    # Look for a quick-add button or drink input
    page.screenshot(path=f"{RESULTS_DIR}/date-shift-02-before-add.png")
    
    # Try to find and click "+" button or drink add area
    # The app likely has preset drink buttons
    try:
        # Look for a water/drink button (common patterns)
        drink_btn = page.locator("button").filter(has_text="300").first
        if drink_btn.is_visible():
            drink_btn.click()
            print("Clicked 300ml button")
        else:
            # Try any quick-add button
            btns = page.locator("button").all()
            print(f"Found {len(btns)} buttons")
            for btn in btns[:10]:
                txt = btn.inner_text()
                print(f"  Button: '{txt}'")
    except Exception as e:
        print(f"Button search: {e}")
    
    # Look for what's actually on the page
    page_text = page.locator("body").inner_text()
    print(f"\n=== Page Text (first 1000 chars) ===\n{page_text[:1000]}")
    
    page.wait_for_timeout(1000)
    page.screenshot(path=f"{RESULTS_DIR}/date-shift-03-dashboard-explored.png")

    # ── Try to add a drink via the UI
    # Check if there are preset drink chips/cards
    try:
        # Common water tracker patterns: click a preset amount
        presets = page.locator("[data-testid*='drink'], [class*='drink'], [class*='preset'], [class*='quick']")
        count = presets.count()
        print(f"\nFound {count} preset elements")
        if count > 0:
            presets.first.click()
            page.wait_for_timeout(1000)
            print("Clicked first preset")
    except Exception as e:
        print(f"Preset click: {e}")

    # Try clicking first visible "add" type button
    try:
        add_btn = page.locator("button:has-text('+')").first
        if add_btn.count() > 0 and add_btn.is_visible():
            add_btn.click()
            page.wait_for_timeout(500)
            print("Clicked '+' button")
    except Exception as e:
        print(f"Add button: {e}")

    page.screenshot(path=f"{RESULTS_DIR}/date-shift-04-after-add-attempt.png")

    # ── Navigate to Statistik
    print("\n=== Navigating to Statistik ===")
    try:
        stat_link = page.locator("a, button").filter(has_text="Statistik").first
        if stat_link.count() > 0:
            stat_link.click()
        else:
            # Try nav items
            page.goto("http://localhost:4174/#/statistik")
    except:
        page.goto("http://localhost:4174/#/statistik")
    
    page.wait_for_timeout(2000)
    page.screenshot(path=f"{RESULTS_DIR}/date-shift-05-statistik.png")

    stat_text = page.locator("body").inner_text()
    print(f"Statistik page text (first 1500 chars):\n{stat_text[:1500]}")

    # ── Extract bar chart info from DOM
    # Look for SVG bars or chart elements
    bar_info = page.evaluate("""
        () => {
            // Try to find bar chart elements (SVG rects, canvas, or labeled divs)
            const result = {
                svgBars: [],
                labeledBars: [],
                allText: []
            };
            
            // SVG approach
            const rects = document.querySelectorAll('svg rect, svg .bar');
            rects.forEach((r, i) => {
                result.svgBars.push({
                    index: i,
                    height: r.getAttribute('height'),
                    y: r.getAttribute('y'),
                    fill: r.getAttribute('fill'),
                    class: r.getAttribute('class')
                });
            });
            
            // Look for weekday labels + bar pairs
            const texts = document.querySelectorAll('svg text, [class*="label"], [class*="day"], [class*="bar"]');
            texts.forEach(el => {
                result.allText.push({
                    tag: el.tagName,
                    class: el.getAttribute('class'),
                    text: el.textContent.trim().slice(0,50)
                });
            });
            
            return result;
        }
    """)
    print(f"\n=== Bar Chart DOM Info ===")
    print(f"SVG bars found: {len(bar_info['svgBars'])}")
    for bar in bar_info['svgBars'][:15]:
        print(f"  rect: h={bar['height']}, y={bar['y']}, fill={bar['fill']}, class={bar['class']}")
    print(f"\nText elements: {len(bar_info['allText'])}")
    for el in bar_info['allText'][:20]:
        print(f"  {el['tag']} class='{el['class']}' text='{el['text']}'")

    # ── Navigate to Verlauf  
    print("\n=== Navigating to Verlauf ===")
    try:
        verlauf_link = page.locator("a, button").filter(has_text="Verlauf").first
        if verlauf_link.count() > 0:
            verlauf_link.click()
        else:
            page.goto("http://localhost:4174/#/verlauf")
    except:
        page.goto("http://localhost:4174/#/verlauf")
    
    page.wait_for_timeout(2000)
    page.screenshot(path=f"{RESULTS_DIR}/date-shift-06-verlauf.png")
    
    verlauf_text = page.locator("body").inner_text()
    print(f"Verlauf page text (first 1000 chars):\n{verlauf_text[:1000]}")

    print(f"\n=== Console Errors ===")
    print(errors if errors else "None")
    
    browser.close()

print("\n=== DONE ===")
print(f"Today (browser local): {today_js['dateStr']} = {today_js['dayName']}")
print(f"Today (UTC):           {today_js['utcDateStr']}")
