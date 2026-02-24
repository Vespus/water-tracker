"""
Test: Statistics Date Shift Bug Fix
Today: Tuesday 2026-02-24
"""
from playwright.sync_api import sync_playwright
import os

RESULTS_DIR = "/home/alex/app/water-tracker/test-results"
os.makedirs(RESULTS_DIR, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 390, "height": 844}, color_scheme="light")

    errors = []
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
    page.on("pageerror", lambda err: errors.append(f"PAGE_ERROR: {err.message}"))

    page.goto("http://localhost:4174/")
    page.wait_for_timeout(2000)

    # ── Get today's weekday from browser JS (local timezone)
    today_js = page.evaluate("""
        () => {
            const now = new Date();
            const days = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
            return {
                dayName: days[now.getDay()],
                dayIndex: now.getDay(),   // 0=Sun,1=Mon,2=Tue,...
                dateStr: now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0'),
                utcDateStr: now.toISOString().slice(0,10)
            };
        }
    """)
    print(f"Browser Local: {today_js['dateStr']} = {today_js['dayName']} (dayIndex={today_js['dayIndex']})")
    print(f"Browser UTC:   {today_js['utcDateStr']}")

    # ── Handle onboarding: skip all steps
    for _ in range(5):
        skip = page.locator("button:has-text('Überspringen'), button:has-text('Skip')")
        if skip.count() > 0 and skip.first.is_visible():
            skip.first.click()
            page.wait_for_timeout(800)
        else:
            weiter = page.locator("button:has-text('Weiter'), button:has-text('Next')")
            if weiter.count() > 0 and weiter.first.is_visible():
                weiter.first.click()
                page.wait_for_timeout(800)
            else:
                break

    page.wait_for_timeout(1500)
    page.screenshot(path=f"{RESULTS_DIR}/date-shift-01-after-onboarding.png")
    
    body_text = page.locator("body").inner_text()
    print(f"\n=== After onboarding (first 800 chars) ===\n{body_text[:800]}")
    
    # Get all buttons
    btns = page.locator("button").all()
    print(f"\nButtons ({len(btns)}):")
    for btn in btns:
        try:
            txt = btn.inner_text().strip()
            if txt:
                print(f"  '{txt}'")
        except:
            pass

    # ── Add a drink: look for ml/drink buttons or + button
    added = False
    
    # Try clicking a specific ml button like "200 ml", "300 ml", etc.
    for amount_text in ["300", "200", "250", "500", "ml", "Wasser"]:
        btn = page.locator(f"button:has-text('{amount_text}')").first
        if btn.count() > 0 and btn.is_visible():
            btn.click()
            page.wait_for_timeout(800)
            print(f"Clicked button with '{amount_text}'")
            added = True
            break
    
    if not added:
        # Try any button that looks like an add/drink button (not nav)
        for btn in page.locator("button").all():
            try:
                txt = btn.inner_text().strip()
                if txt and txt not in ['Überspringen', 'Weiter', 'Skip', 'Next']:
                    print(f"Trying button: '{txt}'")
                    btn.click()
                    page.wait_for_timeout(800)
                    added = True
                    break
            except:
                pass
    
    page.wait_for_timeout(1000)
    page.screenshot(path=f"{RESULTS_DIR}/date-shift-02-drink-added.png")
    body_text2 = page.locator("body").inner_text()
    print(f"\n=== After drink add attempt ===\n{body_text2[:1000]}")

    # ── Find nav links (Statistik, Verlauf)
    print("\n=== Looking for navigation links ===")
    nav_links = page.locator("nav a, [role='navigation'] a, a").all()
    for link in nav_links[:20]:
        try:
            txt = link.inner_text().strip()
            href = link.get_attribute("href") or ""
            if txt:
                print(f"  Link: '{txt}' href='{href}'")
        except:
            pass

    # ── Navigate to Statistik
    print("\n=== Navigating to Statistik ===")
    stat_clicked = False
    for selector in [
        "a:has-text('Statistik')",
        "button:has-text('Statistik')",
        "a[href*='stat']",
        "[href*='stat']"
    ]:
        el = page.locator(selector).first
        if el.count() > 0 and el.is_visible():
            el.click()
            stat_clicked = True
            print(f"  Clicked: {selector}")
            break
    
    if not stat_clicked:
        # Try bottom nav or any navigation
        page.goto("http://localhost:4174/#/statistik")
    
    page.wait_for_timeout(2000)
    page.screenshot(path=f"{RESULTS_DIR}/date-shift-03-statistik.png")
    
    stat_body = page.locator("body").inner_text()
    print(f"\nStatistik page (first 1500 chars):\n{stat_body[:1500]}")

    # ── Inspect chart DOM for weekday bars
    chart_data = page.evaluate("""
        () => {
            const result = { bars: [], labels: [], svgTexts: [] };
            
            // SVG bars (recharts, chart.js render as svg rects)
            document.querySelectorAll('svg rect').forEach((r, i) => {
                const h = parseFloat(r.getAttribute('height') || '0');
                if (h > 2) {  // only visible bars
                    result.bars.push({
                        index: i,
                        height: r.getAttribute('height'),
                        width: r.getAttribute('width'),
                        x: r.getAttribute('x'),
                        y: r.getAttribute('y'),
                        fill: r.getAttribute('fill'),
                        class: r.getAttribute('class') || ''
                    });
                }
            });
            
            // SVG text labels (x-axis weekday labels)
            document.querySelectorAll('svg text, svg tspan').forEach(t => {
                const txt = t.textContent.trim();
                if (txt) result.svgTexts.push({
                    text: txt,
                    x: t.getAttribute('x'),
                    y: t.getAttribute('y'),
                    class: t.getAttribute('class') || ''
                });
            });
            
            // Look for day-labeled divs
            document.querySelectorAll('[class*="day"], [class*="bar"], [class*="column"]').forEach(el => {
                result.labels.push({
                    tag: el.tagName,
                    class: el.getAttribute('class'),
                    text: el.textContent.trim().slice(0,80)
                });
            });
            
            return result;
        }
    """)
    
    print(f"\n=== Chart DOM Analysis ===")
    print(f"Visible SVG bars (h>2): {len(chart_data['bars'])}")
    for b in chart_data['bars']:
        print(f"  bar[{b['index']}]: h={b['height']}, x={b['x']}, y={b['y']}, fill={b['fill']}, class='{b['class'][:40]}'")
    
    print(f"\nSVG text labels ({len(chart_data['svgTexts'])}):")
    for t in chart_data['svgTexts'][:30]:
        print(f"  '{t['text']}' x={t['x']} y={t['y']} class='{t['class'][:30]}'")
    
    print(f"\nDay/bar/column divs ({len(chart_data['labels'])}):")
    for l in chart_data['labels'][:20]:
        print(f"  {l['tag']} class='{l['class']}': '{l['text'][:60]}'")

    # ── Navigate to Verlauf
    print("\n=== Navigating to Verlauf ===")
    verlauf_clicked = False
    for selector in [
        "a:has-text('Verlauf')",
        "button:has-text('Verlauf')",
        "a[href*='verlauf']",
        "a[href*='history']",
        "[href*='verlauf']"
    ]:
        el = page.locator(selector).first
        if el.count() > 0 and el.is_visible():
            el.click()
            verlauf_clicked = True
            print(f"  Clicked: {selector}")
            break
    
    if not verlauf_clicked:
        page.goto("http://localhost:4174/#/verlauf")
    
    page.wait_for_timeout(2000)
    page.screenshot(path=f"{RESULTS_DIR}/date-shift-04-verlauf.png")
    
    verlauf_body = page.locator("body").inner_text()
    print(f"\nVerlauf page (first 1000 chars):\n{verlauf_body[:1000]}")

    # ── Inspect calendar highlight
    calendar_data = page.evaluate("""
        () => {
            const highlighted = [];
            // Look for highlighted/active/today calendar cells
            const selectors = [
                '[class*="today"]', '[class*="active"]', '[class*="selected"]',
                '[class*="current"]', '[aria-current="date"]', '[aria-selected="true"]'
            ];
            selectors.forEach(sel => {
                document.querySelectorAll(sel).forEach(el => {
                    highlighted.push({
                        selector: sel,
                        class: el.getAttribute('class'),
                        text: el.textContent.trim().slice(0,100),
                        ariaLabel: el.getAttribute('aria-label')
                    });
                });
            });
            return highlighted;
        }
    """)
    print(f"\n=== Calendar Highlighted Cells ===")
    for h in calendar_data[:10]:
        print(f"  [{h['selector']}] class='{h['class']}' text='{h['text']}' aria='{h['ariaLabel']}'")

    print(f"\n=== Console Errors ===")
    print(errors if errors else "None")
    
    browser.close()

print("\n" + "="*60)
print("SUMMARY")
print("="*60)
print(f"Today (browser local): {today_js['dateStr']} = {today_js['dayName']}")
print(f"Today (UTC):           {today_js['utcDateStr']}")
print("Screenshots in:", RESULTS_DIR)
