# US-008: Dashboard-Timeline (Trinkverteilung)

**Trello:** https://trello.com/c/CJBGWR0j  
**Status:** Backlog  
**Labels:** feature, ui

---

## User Story

**Als** Nutzer  
**möchte ich** auf dem Dashboard eine Timeline meiner Trinkgewohnheiten über den Tag sehen,  
**damit** ich auf einen Blick erkenne, ob meine Wasseraufnahme gleichmäßig verteilt ist.

---

## Akzeptanzkriterien

- [ ] Timeline-Leiste unter dem ProgressRing auf der Dashboard-Seite
- [ ] Zeitachse: 8:00–22:00 Uhr (14 Stunden, pro Stunde ein Segment)
- [ ] Jede Stunde mit Trinkeinträgen → blaues Tropfen-/Balken-Symbol
- [ ] Stunden ohne Einträge → leeres/graues Segment
- [ ] Lücken > 3 Stunden → rote Markierung / roter Balken
- [ ] Minimalistisches Design — kein extra Screen, inline auf Dashboard
- [ ] Kein Navigations-Overhead: alles sofort sichtbar

---

## UX / Design

| Aspekt | Spezifikation |
|--------|--------------|
| Position | Direkt unter dem ProgressRing-Widget |
| Zeitraum | 08:00–22:00 (konfigurierbar) |
| Blau | Stunde mit Trinkeintrag |
| Grau | Stunde ohne Eintrag |
| Rot | Problemzone: >3h Lücke |
| Stil | Horizontale Mini-Balken oder Dot-Streak, kompakt |

```
08 09 10 11 12 13 14 15 16 17 18 19 20 21 22
 ●  ●  ·  ·  ●  ●  ·  ·  ·  ·  ●  ·  ·  ·  ·
           ^^^^^^^^^^^^^^^^^^
           Rot: 4h Lücke (11-14 Uhr)
```

---

## Technische Hinweise

- **Seite:** `src/pages/Dashboard.tsx`
- **Neue Komponente:** `src/components/ui/DayTimeline.tsx`
- **Datenquelle:** heutiges Log aus dem Store, stündlich gruppiert
- **Keine neue Route** nötig

### Datenstruktur (Vorschlag)

```ts
interface HourSlot {
  hour: number;       // 0-23
  hasDrink: boolean;
  totalMl: number;
  isGap: boolean;     // true wenn >3h Lücke bis nächstem Eintrag
}
```

---

## Definition of Done

- [ ] Komponente gerendert auf Dashboard
- [ ] Heute-Daten korrekt gruppiert nach Stunde
- [ ] Rote Markierung bei Lücke >3h funktioniert
- [ ] Responsive auf Mobile (min. 320px)
- [ ] Tester-Abnahme ✅
