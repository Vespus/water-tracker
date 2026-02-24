"""
Final verification: Date shift bug fix test
"""
from playwright.sync_api import sync_playwright
import os

RESULTS_DIR = "/home/alex/app/water-tracker/test-results"
os.makedirs(RESULTS_DIR, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 390, "height": 844}, color_scheme="light")

    page.goto("http://localhost:4174/")
    page.wait_for_timeout(2000)

    # Get today's weekday
    today_info = page.evaluate("""
        () => {
            const now = new Date();
            const shortDays = ['So','Mo','Di','Mi','Do','Fr','Sa'];
            return {
                dateStr: now.toISOString().slice(0,10),
                dayName: ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'][now.getDay()],
                shortDay: shortDays[now.getDay()],
                dayIndex: now.getDay()
            };
        }
    """)
    
    # Skip onboarding
    for _ in range(5):
        skip = page.locator("button:has-text('Überspringen')")
        if skip.count() > 0 and skip.first.is_visible():
            skip.first.click()
            page.wait_for_timeout(500)
        else:
            break
    
    page.wait_for_timeout(800)

    # Add drink
    page.locator("button:has-text('Wasser')").first.click()
    page.wait_for_timeout(800)
    print(f"✓ Added Wasser (250ml)")

    # Go to Statistik
    page.locator("button:has-text('Statistik')").first.click()
    page.wait_for_timeout(2000)
    
    # Get precise mapping of bars to days
    mapping = page.evaluate("""
        () => {
            const result = { bars: [], ticks: [] };
            
            // Find all ticks on x-axis (day labels)
            document.querySelectorAll('.recharts-cartesian-axis-tick').forEach(tick => {
                const text = tick.querySelector('text');
                if (text) {
                    const txt = text.textContent.trim();
                    const x = parseFloat(text.getAttribute('x') || 0);
                    const y = parseFloat(text.getAttribute('y') || 0);
                    result.ticks.push({ label: txt, x, y });
                }
            });
            
            // Find bar rectangles (data bars)
            document.querySelectorAll('.recharts-bar-rectangle').forEach((bar, i) => {
                const rect = bar.querySelector('rect');
                if (rect) {
                    result.bars.push({
                        index: i,
                        x: parseFloat(rect.getAttribute('x') || 0),
                        width: parseFloat(rect.getAttribute('width') || 0),
                        height: parseFloat(rect.getAttribute('height') || 0),
                        y: parseFloat(rect.getAttribute('y') || 0),
                        fill: rect.getAttribute('fill')
                    });
                }
            });
            
            return result;
        }
    """)
    
    print(f"\n=== STATISTIK ANALYSIS ===")
    print(f"Today: {today_info['dateStr']} = {today_info['dayName']} ({today_info['shortDay']})")
    
    print(f"\nX-Axis Ticks ({len(mapping['ticks'])}):")
    for t in mapping['ticks']:
        print(f"  '{t['label']}' → x={t['x']:.1f}")
    
    print(f"\nData Bars ({len(mapping['bars'])}):")
    bars_with_data = []
    for b in mapping['bars']:
        if b['height'] > 0:
            center_x = b['x'] + b['width']/2
            # Find closest tick
            closest_tick = min(mapping['ticks'], key=lambda t: abs(t['x'] - center_x))
            bars_with_data.append({
                'bar': b,
                'center_x': center_x,
                'day': closest_tick['label']
            })
            print(f"  [Bar {b['index']}] h={b['height']:.0f}, center_x={center_x:.1f} → '{closest_tick['label']}' (tick x={closest_tick['x']:.1f})")
    
    if not bars_with_data:
        print("  NO BARS WITH DATA FOUND")
    
    # Determine result
    if bars_with_data:
        bar_day = bars_with_data[0]['day']
        browser_day = today_info['shortDay']
        
        print(f"\n=== RESULT ===")
        print(f"Browser says today is: {today_info['dayName']} ({browser_day})")
        print(f"Bar with data is at:    {bar_day}")
        
        if bar_day == browser_day:
            print("✓ PASS: Bar is under TODAY's weekday (no date shift)")
        else:
            print(f"✗ FAIL: Bar shows '{bar_day}' but today is '{browser_day}'")
    
    page.screenshot(path=f"{RESULTS_DIR}/date-shift-verification-statistik.png")

    # Go to Verlauf
    page.locator("button:has-text('Verlauf')").first.click()
    page.wait_for_timeout(2000)
    
    # Check which calendar day is highlighted
    verlauf_info = page.evaluate("""
        () => {
            const result = { highlightedDays: [], todayMarker: null };
            
            // Find all calendar day buttons/divs
            const cells = document.querySelectorAll('[role="button"], button, [class*="cell"], [class*="day"]');
            cells.forEach(cell => {
                const txt = cell.textContent.trim();
                const cls = cell.getAttribute('class') || '';
                const dayNum = parseInt(txt);
                if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
                    // Check if highlighted (has ring, bg, etc.)
                    const isHighlighted = 
                        cls.includes('ring') || 
                        cls.includes('bg-') ||
                        cls.includes('cyan') ||
                        cls.includes('blue') ||
                        cls.includes('selected') ||
                        cls.includes('active');
                    
                    if (isHighlighted) {
                        result.highlightedDays.push({
                            day: dayNum,
                            class: cls.slice(0,100)
                        });
                    }
                }
            });
            
            // Look for "Heute" marker
            const heute = document.querySelector('*:has-text("Heute")');
            if (heute) {
                // Find associated date number
                const parent = heute.closest('div[class*="calendar"]') || heute.parentElement;
                result.todayMarker = parent ? parent.textContent.slice(0,100) : 'found';
            }
            
            return result;
        }
    """)
    
    print(f"\n=== VERLAUF ANALYSIS ===")
    print(f"Highlighted calendar days: {verlauf_info['highlightedDays']}")
    
    page.screenshot(path=f"{RESULTS_DIR}/date-shift-verification-verlauf.png")

    browser.close()

print(f"\n{'='*60}")
print(f"FINAL ANSWER:")
print(f"  Today (browser):   {today_info['dayName']} ({today_info['shortDay']})")
if bars_with_data:
    print(f"  Stats bar shows:  {bars_with_data[0]['day']}")
print(f"  Verlauf highlights: day {verlauf_info['highlightedDays'][0]['day'] if verlauf_info['highlightedDays'] else '?'}")
print(f"{'='*60}")
