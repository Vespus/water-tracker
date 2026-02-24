"""Quick date-shift verification — captures screenshots + prints DOM data."""
from playwright.sync_api import sync_playwright
import os, json

RESULTS = "/home/alex/app/water-tracker/test-results"
os.makedirs(RESULTS, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 390, "height": 844})

    page.goto("http://localhost:4174/")
    page.wait_for_timeout(3000)

    # ── Get browser's local date vs UTC date
    dates = page.evaluate("""() => {
        const now = new Date();
        const days = ['So','Mo','Di','Mi','Do','Fr','Sa'];
        return {
            local: now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0'),
            utc:   now.toISOString().slice(0,10),
            day:   days[now.getDay()]
        };
    }""")
    print(f"Local date: {dates['local']} ({dates['day']})")
    print(f"UTC date:   {dates['utc']}")
    same = dates['local'] == dates['utc']
    print(f"Same? {same} {'(no timezone shift — test still valid)' if same else '(DIFFERENT — timezone shift active)'}")

    # ── Screenshot Dashboard
    page.screenshot(path=f"{RESULTS}/quick-01-dashboard.png")

    # ── Try to add a drink: look for quick-add buttons
    try:
        # Water tracker typically has drink buttons with ml amounts
        btns = page.locator("button").all()
        added = False
        for btn in btns:
            txt = btn.inner_text().strip()
            if any(x in txt for x in ["300", "250", "200", "500", "Wasser"]):
                btn.click()
                page.wait_for_timeout(1500)
                print(f"Clicked button: '{txt}'")
                added = True
                break
        if not added:
            print("No quick-add button found by text")
            # Print all button texts
            for btn in btns[:15]:
                print(f"  btn: '{btn.inner_text().strip()[:40]}'")
    except Exception as e:
        print(f"Add drink error: {e}")

    page.screenshot(path=f"{RESULTS}/quick-02-after-add.png")

    # ── Navigate to Statistik via nav
    nav = page.locator("nav a, nav button, footer a, footer button").all()
    for el in nav:
        txt = el.inner_text().strip()
        if "Stat" in txt or "stat" in txt:
            el.click()
            page.wait_for_timeout(2000)
            print(f"Navigated to Statistik via '{txt}'")
            break
    else:
        # Try hash routes
        page.goto("http://localhost:4174/")
        page.wait_for_timeout(500)
        page.evaluate("window.location.hash = '#/stats'")
        page.wait_for_timeout(2000)

    page.screenshot(path=f"{RESULTS}/quick-03-stats.png")

    # ── Extract XAxis labels and bar heights from Recharts SVG
    chart = page.evaluate("""() => {
        const svg = document.querySelector('.recharts-wrapper svg');
        if (!svg) return { error: 'No recharts SVG found' };
        // X axis tick texts
        const xLabels = [...svg.querySelectorAll('.recharts-xAxis .recharts-text')].map(t => t.textContent.trim());
        // Bar rects (the actual data bars)
        const bars = [...svg.querySelectorAll('.recharts-bar-rectangle rect')].map(r => ({
            fill: r.getAttribute('fill'),
            height: parseFloat(r.getAttribute('height') || '0'),
            y: parseFloat(r.getAttribute('y') || '0')
        }));
        return { xLabels, bars };
    }""")
    print(f"\n=== Recharts Data ===")
    print(json.dumps(chart, indent=2))

    browser.close()

print("\n=== DONE ===")
print(f"Screenshots in {RESULTS}/")
