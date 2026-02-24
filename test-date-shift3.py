"""
Test: Statistics Date Shift Bug Fix — focused bar analysis
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

    # Get today's local weekday info
    today_js = page.evaluate("""
        () => {
            const now = new Date();
            const days = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
            // German short names used in chart
            const shortDays = ['So','Mo','Di','Mi','Do','Fr','Sa'];
            return {
                dayName: days[now.getDay()],
                shortName: shortDays[now.getDay()],
                dayIndex: now.getDay(),
                dateStr: now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0'),
                utcDateStr: now.toISOString().slice(0,10)
            };
        }
    """)
    print(f"=== Browser Today ===")
    print(f"  Local: {today_js['dateStr']} = {today_js['dayName']} ({today_js['shortName']})")
    print(f"  UTC:   {today_js['utcDateStr']}")

    # Skip onboarding
    for _ in range(5):
        skip = page.locator("button:has-text('Überspringen')")
        if skip.count() > 0 and skip.first.is_visible():
            skip.first.click()
            page.wait_for_timeout(600)
        else:
            break

    page.wait_for_timeout(1000)

    # Add a 250ml Wasser drink
    btn = page.locator("button:has-text('Wasser')").first
    if btn.count() > 0 and btn.is_visible():
        btn.click()
        page.wait_for_timeout(800)
        print("✓ Added 250ml Wasser")

    # Navigate to Statistik
    page.locator("button:has-text('Statistik')").first.click()
    page.wait_for_timeout(2000)

    page.screenshot(path=f"{RESULTS_DIR}/date-shift-final-statistik.png")

    # Deep analysis of recharts bar rectangles
    bar_analysis = page.evaluate("""
        () => {
            // The recharts bar rectangles are path elements or rect elements inside .recharts-bar-rectangle
            const result = {
                barRectangles: [],
                xAxisLabels: [],
                dataFromRecharts: null
            };
            
            // Get each recharts-bar-rectangle and its rect child
            const barGroups = document.querySelectorAll('.recharts-bar-rectangle');
            barGroups.forEach((g, i) => {
                const rect = g.querySelector('rect, path');
                if (rect) {
                    result.barRectangles.push({
                        index: i,
                        tag: rect.tagName,
                        x: rect.getAttribute('x'),
                        y: rect.getAttribute('y'),
                        width: rect.getAttribute('width'),
                        height: rect.getAttribute('height'),
                        fill: rect.getAttribute('fill'),
                        className: rect.getAttribute('class') || '',
                        d: rect.getAttribute('d') ? rect.getAttribute('d').slice(0,50) : null
                    });
                } else {
                    // Group might itself be a path
                    result.barRectangles.push({
                        index: i,
                        tag: 'group-no-child',
                        class: g.getAttribute('class')
                    });
                }
            });
            
            // X-axis labels
            document.querySelectorAll('.recharts-xAxis .recharts-text, .recharts-cartesian-axis-tick text').forEach(t => {
                const txt = t.textContent.trim();
                if (txt && isNaN(parseFloat(txt))) {  // skip numbers (y-axis)
                    const x = parseFloat(t.getAttribute('x') || t.closest('[x]')?.getAttribute('x') || '0');
                    result.xAxisLabels.push({ text: txt, x });
                }
            });
            
            // Try to read recharts internal store
            try {
                const chart = document.querySelector('.recharts-wrapper');
                if (chart) {
                    // Recharts stores data in React fiber
                    const fiberKey = Object.keys(chart).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternals'));
                    result.dataFromRecharts = fiberKey ? 'fiber-found' : 'no-fiber';
                }
            } catch(e) {
                result.dataFromRecharts = 'error: ' + e.message;
            }
            
            return result;
        }
    """)
    
    print(f"\n=== Recharts Bar Rectangles ({len(bar_analysis['barRectangles'])}) ===")
    for b in bar_analysis['barRectangles']:
        print(f"  [{b['index']}] x={b.get('x')}, y={b.get('y')}, w={b.get('width')}, h={b.get('height')}, fill={b.get('fill')}, class='{b.get('className','')[:40]}'")
    
    print(f"\n=== X-Axis Labels ({len(bar_analysis['xAxisLabels'])}) ===")
    for l in bar_analysis['xAxisLabels']:
        print(f"  '{l['text']}' at x={l['x']:.1f}")
    
    print(f"Recharts: {bar_analysis['dataFromRecharts']}")

    # Map bars to day labels by x-coordinate
    print(f"\n=== Bar → Day Mapping ===")
    labels = bar_analysis['xAxisLabels']
    bars = bar_analysis['barRectangles']
    
    if labels and bars:
        # Sort labels by x
        labels.sort(key=lambda l: l['x'])
        # For each bar, find closest label
        for b in bars:
            bx = float(b.get('x') or 0)
            bh = float(b.get('height') or 0)
            bw = float(b.get('width') or 0)
            bar_center = bx + bw/2
            closest = min(labels, key=lambda l: abs(l['x'] - bar_center))
            has_data = bh > 5
            marker = "<<< HAS DATA (250ml)" if has_data else "   (empty)"
            print(f"  Bar[{b['index']}] x={bx:.0f}, center={bar_center:.0f}, h={bh:.0f} → '{closest['text']}' {marker}")

    # Navigate to Verlauf
    page.locator("button:has-text('Verlauf')").first.click()
    page.wait_for_timeout(2000)
    page.screenshot(path=f"{RESULTS_DIR}/date-shift-final-verlauf.png")

    # Get calendar info - which day has data marker
    calendar_analysis = page.evaluate("""
        () => {
            const result = { cells: [], highlighted: [] };
            
            // Find calendar day cells
            const allCells = document.querySelectorAll('button, td, [role="gridcell"], [class*="cell"], [class*="day-cell"]');
            allCells.forEach(el => {
                const txt = el.textContent.trim();
                const cls = el.getAttribute('class') || '';
                if (txt && !isNaN(parseInt(txt)) && parseInt(txt) >= 1 && parseInt(txt) <= 31) {
                    result.cells.push({
                        day: parseInt(txt),
                        class: cls,
                        hasHighlight: cls.includes('highlight') || cls.includes('active') || cls.includes('today') || cls.includes('selected') || cls.includes('data') || cls.includes('goal') || cls.includes('miss')
                    });
                }
            });
            
            // Specifically look for colored/highlighted dates
            const highlightSelectors = [
                '[class*="cyan"]', '[class*="blue"]', '[class*="green"]',
                '[class*="ring"]', '[class*="border"]',
                '.bg-cyan-400', '.bg-blue-400', '.bg-green-400',
                '[class*="Ziel"]', '[class*="verfehlt"]',
                '[data-date]'
            ];
            highlightSelectors.forEach(sel => {
                document.querySelectorAll(sel).forEach(el => {
                    const txt = el.textContent.trim();
                    if (txt) {
                        result.highlighted.push({
                            selector: sel,
                            class: el.getAttribute('class'),
                            text: txt.slice(0,80),
                            dataDate: el.getAttribute('data-date')
                        });
                    }
                });
            });
            
            return result;
        }
    """)
    
    verlauf_text = page.locator("body").inner_text()
    print(f"\n=== Verlauf Page ===\n{verlauf_text[:600]}")
    
    print(f"\n=== Calendar Cells with Highlights ({len([c for c in calendar_analysis['cells'] if c['hasHighlight']])}) ===")
    for c in calendar_analysis['cells']:
        if c['hasHighlight']:
            print(f"  Day {c['day']}: '{c['class'][:80]}'")
    
    print(f"\n=== Highlighted Elements ({len(calendar_analysis['highlighted'])}) ===")
    for h in calendar_analysis['highlighted'][:15]:
        print(f"  [{h['selector']}] text='{h['text'][:50]}' class='{(h['class'] or '')[:60]}' data-date='{h['dataDate']}'")

    browser.close()

print("\n" + "="*60)
print(f"Today (browser local): {today_js['dateStr']} = {today_js['shortName']} ({today_js['dayName']})")
print(f"Today (UTC):           {today_js['utcDateStr']}")
