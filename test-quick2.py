"""Quick date-shift verification — skips onboarding, adds drink, checks stats chart."""
from playwright.sync_api import sync_playwright
import os, json

RESULTS = "/home/alex/app/water-tracker/test-results"
os.makedirs(RESULTS, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 390, "height": 844})

    page.goto("http://localhost:4174/")
    page.wait_for_timeout(2000)

    # ── Browser date info
    dates = page.evaluate("""() => {
        const now = new Date();
        const days = ['So','Mo','Di','Mi','Do','Fr','Sa'];
        return {
            local: now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0'),
            utc:   now.toISOString().slice(0,10),
            localDay: days[now.getDay()],
            utcDay: days[new Date(now.toISOString().slice(0,10)+'T12:00:00Z').getDay()]
        };
    }""")
    print(f"Browser local date: {dates['local']} ({dates['localDay']})")
    print(f"Browser UTC date:   {dates['utc']} ({dates['utcDay']})")

    # ── Skip Onboarding by writing to localStorage
    page.evaluate("""() => {
        // Set onboarding complete + default settings in IndexedDB via the app
        // Simpler: inject a flag the app checks
        const settings = {
            id: 'default',
            dailyGoalMl: 2000,
            theme: 'system',
            favoriteBeverageIds: [],
            lastAmounts: {},
            favoriteAmounts: {},
            onboardingDone: true
        };
        // Store in localStorage as fallback, but mainly use the app's own IDB
        localStorage.setItem('onboarding_done', 'true');
    }""")

    # Click through onboarding buttons
    for _ in range(10):
        # Check if we see "Überspringen" or "Weiter" or "Los geht's" buttons
        skip = page.locator("button").filter(has_text="Überspringen").first
        weiter = page.locator("button").filter(has_text="Weiter").first
        start = page.locator("button").filter(has_text="Los").first

        if skip.count() > 0 and skip.is_visible():
            skip.click()
            page.wait_for_timeout(500)
        elif weiter.count() > 0 and weiter.is_visible():
            weiter.click()
            page.wait_for_timeout(500)
        elif start.count() > 0 and start.is_visible():
            start.click()
            page.wait_for_timeout(1000)
            break
        else:
            break

    page.wait_for_timeout(2000)
    page.screenshot(path=f"{RESULTS}/q2-01-dashboard.png")
    body = page.locator("body").inner_text()
    print(f"\nDashboard text (first 500):\n{body[:500]}")

    # ── Add a drink: look for any clickable drink / quick-add
    added = False
    # Try quick buttons with amounts
    for selector in ["[data-amount]", "button:has-text('ml')", "button:has-text('300')",
                     "button:has-text('250')", "button:has-text('200')"]:
        el = page.locator(selector).first
        if el.count() > 0 and el.is_visible():
            el.click()
            page.wait_for_timeout(1000)
            print(f"Clicked {selector}")
            added = True
            break

    if not added:
        # Click first non-nav, non-header button visible on page
        btns = page.locator("button").all()
        print("\nAll buttons on dashboard:")
        for btn in btns[:20]:
            txt = btn.inner_text().strip()[:50]
            vis = btn.is_visible()
            print(f"  '{txt}' visible={vis}")

    page.screenshot(path=f"{RESULTS}/q2-02-after-add.png")

    # ── Navigate to Statistik
    nav_items = page.locator("nav a, nav button, a[href*='stat'], button").all()
    for el in nav_items:
        try:
            txt = el.inner_text().strip()
            if "Stat" in txt:
                el.click()
                page.wait_for_timeout(2000)
                print(f"\nNavigated to Statistik")
                break
        except:
            pass

    page.screenshot(path=f"{RESULTS}/q2-03-stats.png")

    # ── Extract chart data
    chart = page.evaluate("""() => {
        const svg = document.querySelector('.recharts-wrapper svg');
        if (!svg) return { error: 'No SVG' };
        const xLabels = [...svg.querySelectorAll('.recharts-xAxis .recharts-text tspan, .recharts-xAxis text')]
            .map(t => t.textContent.trim()).filter(Boolean);
        const bars = [...svg.querySelectorAll('.recharts-bar-rectangle rect, .recharts-bar rect')]
            .map((r,i) => ({
                index: i,
                fill: r.getAttribute('fill'),
                height: parseFloat(r.getAttribute('height') || '0').toFixed(1),
                y: parseFloat(r.getAttribute('y') || '0').toFixed(1)
            }));
        return { xLabels, bars };
    }""")
    print(f"\n=== Chart Data ===")
    print(json.dumps(chart, indent=2))

    # ── Check which bar (index) has data (non-grey, non-zero height)
    if 'bars' in chart and 'xLabels' in chart:
        labels = chart['xLabels']
        bars = chart['bars']
        print(f"\nDay labels: {labels}")
        print(f"\nBars with data (height > 0, not grey):")
        for bar in bars:
            h = float(bar['height'])
            if h > 0 and bar['fill'] not in ['#e5e7eb', '#e5e7eb']:
                idx = bar['index']
                label = labels[idx] if idx < len(labels) else '?'
                print(f"  Bar[{idx}] = {label}: height={h}, fill={bar['fill']}")

    browser.close()

print("\n=== DONE ===")
print(f"Today local: {dates['local']} = {dates['localDay']}")
