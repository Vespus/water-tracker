# US-010: Zeit-Anpassung über Edit-Button (Heutige Einträge)

**Trello:** https://trello.com/c/KkPvx4Bx  
**Status:** Backlog  
**Labels:** feature, ui  
**Schätzung:** S (Small)

---

## User Story

**Als** Nutzer  
**möchte ich** die Uhrzeit eines bestehenden Eintrags in der "Heutige Einträge"-Liste nachträglich anpassen können,  
**damit** ich Tippfehler oder vergessene Zeitstempel korrigieren kann.

---

## Kontext & Scope-Klarstellung

> ✅ **Edit-Button existiert bereits** — Menge und Getränk-Typ sind darüber schon editierbar.  
> 🎯 **Einzige Erweiterung:** Ein Zeit-Feld (Uhrzeit) zum bestehenden Edit-Dialog/Form hinzufügen.

---

## Akzeptanzkriterien

- [ ] Der bestehende Edit-Dialog/Form enthält zusätzlich ein Zeit-Feld (`<input type="time">`)
- [ ] Das Zeit-Feld ist mit der aktuellen Uhrzeit des Eintrags vorausgefüllt
- [ ] Nach Bestätigung wird der Eintrag mit der neuen Uhrzeit gespeichert
- [ ] Abbrechen-Möglichkeit (kein versehentliches Überschreiben)
- [ ] Die Liste sortiert sich nach Uhrzeit neu, wenn der Zeitstempel geändert wurde
- [ ] Validierung: Uhrzeit muss im heutigen Tag liegen (00:00–23:59)

---

## UX / Design

| Aspekt | Spezifikation |
|--------|--------------|
| Trigger | Bestehender Edit-Button (Stift-Icon) pro Eintrag |
| Neu | Zeit-Input (`<input type="time">`) im bestehenden Edit-Formular |
| Scope | Zeit **hinzugefügt** — Menge + Getränk bereits editierbar (bleibt erhalten) |
| Feedback | Eintrag blinkt kurz auf nach Speichern (optional) |

---

## Technische Hinweise

- **Seite / Komponente:** Bestehende Edit-Komponente für Tageseinträge erweitern
- **Store-Aktion:** `timestamp`-Feld beim Update mitschreiben
- **Kein neuer Screen**, kein neuer Button nötig — nur Feld ergänzen

### Store-Änderung (Vorschlag)

```ts
// Bestehende updateEntry-Funktion um time-Feld erweitern:
updateEntry: (id: string, { amount, drinkType, time }: Partial<Entry>) => {
  // time = "HH:MM" → neuen timestamp aus heutigem Datum + time berechnen
}
```

---

## Definition of Done

- [ ] Zeit-Feld im bestehenden Edit-Dialog sichtbar und vorausgefüllt
- [ ] Speichern aktualisiert Timestamp im Store + UI
- [ ] Abbrechen verwirft die Änderung
- [ ] Liste neu sortiert nach Uhrzeit
- [ ] Tester-Abnahme ✅
