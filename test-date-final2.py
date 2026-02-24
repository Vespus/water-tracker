"""
Final verification: Date shift bug fix test - fixed selectors
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
    print(f"Browser today: {today_info['dateStr']} = {today_info['dayName']} ({today_info['shortDay']})")
    
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
    print("✓ Added Wasser (250ml)")

    # Go to Statistik
    page.locator("button:has-text('Statistik')").first.click()
    page.wait_for_timeout(2500)
    
    # Get precise mapping - using the selectors that worked before
    mapping = page.evaluate("""
        () => {
            const result = { bars: [], ticks: [] };
            
            // X-axis ticks from recharts - this worked before
            document.querySelectorAll('svg text').forEach(text => {
                const txt = text.textContent.trim();
                if (txt && ['So','Mo','Di','Mi','Do','Fr','Sa'].includes(txt)) {
                    const x = parseFloat(text.getAttribute('x') || 0);
                    const y = parseFloat(text.getAttribute('y') || 0);
                    result.ticks.push({ label: txt, x, y });
                }
            });
            
            // Bar rectangles - use recharts-rectangle class
            document.querySelectorAll('.recharts-rectangle').forEach((rect, i) => {
                const h = parseFloat(rect.getAttribute('height') || 0);
                if (h > 5) {  // Only meaningful bars
                    result.bars.push({
                        index: i,
                        x: parseFloat(rect.getAttribute('x') || 0),
                        width: parseFloat(rect.getAttribute('width') || 0),
                        height: h,
                        y: parseFloat(rect.getAttribute('y') || 0),
                        fill: rect.getAttribute('fill')
                    });
                }
            });
            
            return result;
        }
    """)
    
    print(f"\n=== STATISTIK ===")
    print(f"Ticks found: {[(t['label'], round(t['x'],1)) for t in mapping['ticks']]}")
    print(f"Bars with data: {len(mapping['bars'])}")
    
    bars_with_data = []
    for b in mapping['bars']:
        center_x = b['x'] + b['width']/2
        # Find closest tick
        closest_tick = min(mapping['ticks'], key=lambda t: abs(t['x'] - center_x))
        bars_with_data.append({
            'bar': b,
            'center_x': center_x,
            'day': closest_tick['label']
        })
        print(f"  Bar[{b['index']}] h={b['height']:.0f}, center={center_x:.1f} → '{closest_tick['label']}'")
    
    page.screenshot(path=f"{RESULTS_DIR}/final-statistik.png")

    # Go to Verlauf
    page.locator("button:has-text('Verlauf')").first.click()
    page.wait_for_timeout(2500)
    
    # Check calendar - look for highlighted day
    calendar = page.evaluate("""
        () => {
            const result = { highlightedDays: [], allDays: [] };
            
            // Find all potential calendar day elements
            const cells = document.querySelectorAll('button, div');
            cells.forEach(cell => {
                const txt = cell.textContent.trim();
                const cls = cell.getAttribute('class') || '';
                const dayNum = parseInt(txt);
                if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
                    const isHighlighted = 
                        cls.includes('ring') || 
                        cls.includes('bg-cyan') ||
                        cls.includes('bg-blue') ||
                        cls.includes('selected') ||
                        cls.includes('active') ||
                        cls.includes('rounded-full');
                    
                    result.allDays.push({ day: dayNum, highlighted: isHighlighted, cls: cls.slice(0,80) });
                    if (isHighlighted) {
                        result.highlightedDays.push(dayNum);
                    }
                }
            });
            
            return result;
        }
    """)
    
    print(f"\n=== VERLAUF ===")
    print(f"Highlighted days: {calendar['highlightedDays']}")
    print(f"All days found: {[d['day'] for d in calendar['allDays'][:10]]}...")
    
    page.screenshot(path=f"{RESULTS_DIR}/final-verlauf.png")

    browser.close()

# Final answer
print(f"\n{'='*60}")
print("FINAL ANSWER:")
print(f"  Today (browser):   {today_info['dayName']} ({today_info['shortDay']})")
if bars_with_data:
    bar_day = bars_with_data[0]['day']
    print(f"  Stats bar shows:  {bar_day}")
    match = "✓ MATCH" if bar_day == today_info['shortDay'] else "✗ MISMATCH"
    print(f"  {match}")
else:
    print("  (No bars with data found)")
    
if calendar['highlightedDays']:
    print(f"  Verlauf highlights: day {calendar['highlightedDays'][0]}")
    if 24 in calendar['highlightedDays']:
        print(f"  ✓ Day 24 (today) is highlighted in calendar")
print(f"{'='*60}")
