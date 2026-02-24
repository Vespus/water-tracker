# US-009: Statistik-Erweiterung – Trinkverteilung nach Uhrzeit

**Trello:** https://trello.com/c/pBRGhwrw  
**Status:** Backlog  
**Labels:** feature, ui

---

## User Story

**Als** Nutzer  
**möchte ich** in der Statistik-Ansicht eine stündliche Aufschlüsselung meiner Trinkgewohnheiten sehen,  
**damit** ich verstehe, zu welchen Tageszeiten ich zu wenig trinke und gezielt gegensteuern kann.

---

## Akzeptanzkriterien

- [ ] Neue Sektion „Tagesverteilung" in `src/pages/Stats.tsx` unterhalb des Weekly-Charts
- [ ] Balkendiagramm: X-Achse = Stunden (0–23), Y-Achse = Menge in ml (Durchschnitt)
- [ ] Balken in Blau für Stunden mit Einträgen
- [ ] Stunden ohne Einträge: grauer / leerer Balken
- [ ] Rote Markierung bei Lücken > 3 aufeinanderfolgende Stunden ohne Eintrag
- [ ] Aggregation über Zeitraum (default: Letzte 7 Tage → Durchschnitt pro Stunde)
- [ ] Tooltip / Label zeigt genaue ml-Menge bei Tap/Hover

---

## UX / Design

| Aspekt | Spezifikation |
|--------|--------------|
| Position | Unter dem Weekly-Chart in Stats.tsx |
| Sektion-Header | „Tagesverteilung" mit Uhr-Icon 🕐 |
| Chart-Typ | Vertikales Balkendiagramm |
| Blau | Durchschnittliche Menge vorhanden |
| Grau | Keine Einträge in diesem Zeitraum |
| Rot | Problemzone: >3h Lücke (Balken rot eingefärbt) |

```
ml
300 |          █
250 |      █   █       █
200 |  █   █   █   █   █
150 |  █   █   █   █   █   █
100 |  █   █   █   █   █   █
 50 |  █   █   █   █   █   █
  0 +--8---9--10--11--12--13-- ...
        ↑↑↑↑↑↑↑↑↑↑↑
        rot: Lücke 14-17 Uhr
```

---

## Technische Hinweise

- **Seite:** `src/pages/Stats.tsx`
- **Neue Komponente:** `src/components/ui/HourlyChart.tsx`
- **Neues Utility:** `src/utils/hourlyStats.ts`
- Bestehende Chart-Bibliothek nutzen (recharts o.ä.) oder eigene SVG-Bars

### Utility-Funktionen (Vorschlag)

```ts
// src/utils/hourlyStats.ts

/** Gruppiert Log-Einträge nach Stunde, aggregiert über mehrere Tage */
function groupByHour(logs: WaterLog[], days = 7): HourlyData[]

/** Detektiert Lücken > maxGapHours aufeinanderfolgende leere Stunden */
function detectGaps(hourlyData: HourlyData[], maxGapHours = 3): HourlyData[]

interface HourlyData {
  hour: number;       // 0-23
  avgMl: number;      // Durchschnitt über Zeitraum
  isGap: boolean;     // >3h aufeinanderfolgende leere Stunden
}
```

---

## Definition of Done

- [ ] HourlyChart-Komponente in Stats.tsx eingebunden
- [ ] Stündliche Aggregation korrekt (letzte 7 Tage, Durchschnitt)
- [ ] Rote Balken / Markierung bei >3h-Lücken
- [ ] Tooltip/Label vorhanden
- [ ] Responsive auf Mobile
- [ ] Tester-Abnahme ✅
