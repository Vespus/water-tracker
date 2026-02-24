# User Story: Eigene Getränke definieren

**Story-ID:** US-007  
**Feature:** Custom Beverages  
**Label:** feature, ui, backend  
**Status:** Backlog

---

## Story

> Als User möchte ich eigene Getränke mit selbst gewähltem Name, Icon und Hydrationsfaktor anlegen,
> damit ich auch Getränke tracken kann, die nicht in der Standard-Liste vorhanden sind.

---

## Akzeptanzkriterien

### Anlegen

- [ ] **AC-01** Im Getränke-Auswahl-Screen des AddDrinkModal gibt es einen "＋ Eigenes Getränk" Button am Ende der Sektion "Meine Getränke" (erscheint immer, auch wenn noch kein Custom-Drink existiert)
- [ ] **AC-02** Das Anlegen-Formular enthält:
  - Freitextfeld: Name (max. 30 Zeichen, required)
  - Icon-Picker: Grid mit allen vorhandenen PNG-Icons aus `/icons/` (water.png, coffee.png, …) — mind. 4 Spalten
  - Default-Icon wenn kein Icon gewählt: `water.png`
  - Hydrationsfaktor-Slider: 0.0 – 1.5, Schrittweite 0.05, Default 1.0, Live-Anzeige als Dezimalzahl
- [ ] **AC-03** Speichern ist nur möglich, wenn ein Name eingegeben wurde (Save-Button disabled ohne Name)
- [ ] **AC-04** Custom-Drinks werden in IndexedDB persistiert (`customBeverages` Store) und überleben App-Neustart
- [ ] **AC-05** Custom-Drinks erscheinen nach dem Speichern sofort in der Getränkeliste unter der Sektion **"Meine Getränke"** — vor allen Standardkategorien

### Verwenden

- [ ] **AC-06** Custom-Drinks sind vollständig in den bestehenden Flows verwendbar:
  - Auswählbar im AddDrinkModal (beverage step)
  - Suchbar über das Suchfeld im Modal
  - Als Favorit markierbar (⭐ Star-Button)
  - Landen nach Nutzung in „Zuletzt verwendet"
  - Erscheinen in QuickButtons (Dashboard) nach ausreichend häufiger Nutzung
- [ ] **AC-07** Der Hydrationsfaktor eines Custom-Drinks wird korrekt für `waterEquivalentMl` angewendet

### Bearbeiten & Löschen

- [ ] **AC-08** Im AddDrinkModal: Long-Press auf einen Custom-Drink öffnet ein Kontext-Menü mit "Bearbeiten" und "Löschen" (Standard-Drinks haben dieses Menü NICHT)
- [ ] **AC-09** "Bearbeiten" öffnet dasselbe Formular wie beim Anlegen, vorausgefüllt mit den aktuellen Werten
- [ ] **AC-10** "Löschen" zeigt eine Bestätigungsfrage ("Getränk löschen?" Ja/Nein) — Drink wird aus DB entfernt, aus Favoriten-Liste bereinigt, bestehende DrinkEntries im Log bleiben erhalten (historische Daten bleiben)
- [ ] **AC-11** Wird ein gelöschter Custom-Drink in der History angezeigt, wird der Name als "(Gelöscht)" mit grauem Italic dargestellt

### Constraints

- [ ] **AC-12** Max. 20 Custom-Drinks (bei Erreichen des Limits: Button disabled + Hinweis "Maximum erreicht")
- [ ] **AC-13** Name-Duplikate sind erlaubt (User-Entscheidung)
- [ ] **AC-14** Icons sind nur aus den vorhandenen PNGs wählbar — kein Upload, keine Emojis

---

## UX-Vorschlag: Harmonische Integration

### Grundprinzip

Das Feature wird **nicht** auf der Settings-Seite versteckt. Custom Drinks sind **Inhalte** (wie Favoriten), keine App-Einstellungen — sie gehören deshalb direkt in den Drink-Workflow.

---

### Wo das Feature lebt: Im AddDrinkModal

Das `AddDrinkModal` ist der natürliche Ort. Es ist bereits der zentrale Hub für alles rund ums Getränk-Tracking. Der User ist genau dann in der richtigen Intention ("ich will ein Getränk hinzufügen"), wenn er merkt: "Mein Getränk ist nicht dabei."

**Vorher (ist):**
```
[Modal: Getränk wählen]
  🔍 Suche...
  Zuletzt verwendet: [Wasser] [Kaffee]
  Wasser: [Wasser] [Sprudelwasser]
  Heiß: [Tee] [Kaffee] ...
  Kalt: [OJ] [Cola] ...
  ...
```

**Nachher (soll):**
```
[Modal: Getränk wählen]
  🔍 Suche...
  Zuletzt verwendet: [Wasser] [Kaffee] [Mein Proteinshake]
  ┌─────────────────────────────────────────────┐
  │ Meine Getränke                    [+ Neu]   │
  │ [Proteinshake ✏️] [Laktosefrei ✏️]          │
  └─────────────────────────────────────────────┘
  Wasser: [Wasser] [Sprudelwasser]
  ...
```

Die **"Meine Getränke"-Sektion** erscheint immer ganz oben (nach "Zuletzt verwendet"), auch wenn leer — dann mit einem subtilen leeren State und dem "+ Neu" Button als primärer Call-to-Action.

---

### Wie der User interagiert

#### Anlegen (Happy Path)

1. User tippt im Dashboard auf **"+ Trinken"** → AddDrinkModal öffnet sich
2. User scrollt zur Sektion „Meine Getränke" und tippt **"＋ Neu"**
3. Ein **zweites Modal / Drawer** öffnet sich (über dem bestehenden Modal, `z-60`) mit dem Formular:
   ```
   ┌──────────────────────────────┐
   │  Eigenes Getränk             │
   │                              │
   │  Name:  [_____________]      │
   │                              │
   │  Icon:                       │
   │  [💧][☕][🍵][🥛][🍊][🥤]   │
   │  [🍋][🥤][🍲][🍺][🍷][🥂]   │
   │  …                           │
   │                              │
   │  Hydration:  [●————] 1.00    │
   │  ℹ️ 1.0 = neutral, <1 = weniger│
   │                              │
   │  [Abbrechen]  [Speichern]    │
   └──────────────────────────────┘
   ```
4. Nach "Speichern": Drawer schließt, **Sektion "Meine Getränke"** zeigt sofort das neue Getränk
5. User kann es direkt antippen → normaler Amount-Step → gespeichert

#### Bearbeiten / Löschen (via Long-Press)

- Long-Press auf Custom-Drink-Karte → Bottom-Sheet mit `[✏️ Bearbeiten]` `[🗑️ Löschen]` `[✕ Schließen]`
- Selbes Interaction-Pattern wie bestehende Long-Press-Funktion (Betrag-Änderung bei QuickButtons)
- Standard-Getränke zeigen dieses Menü **nicht** (verhindert Verwirrung)

---

### Wie es zum Favoriten-System passt

Das bestehende Favoriten-System (`favoriteBeverageIds`, ⭐-Button auf jeder BevCard) funktioniert **unverändert** für Custom-Drinks:

| Mechanismus | Standard-Drink | Custom-Drink |
|---|---|---|
| ⭐ Favorit markieren | ✅ | ✅ (identisch) |
| QuickButtons (Dashboard) | ✅ per Nutzungsfrequenz | ✅ identisch |
| `lastAmounts` merken | ✅ | ✅ |
| `favoriteAmounts` (QuickButton-Menge) | ✅ | ✅ |
| "Zuletzt verwendet" im Modal | ✅ | ✅ |
| Suchbar im Modal | ✅ | ✅ |
| Long-Press → Menge ändern | ✅ | ✅ (+ Edit/Delete) |

Custom-Drinks sind **vollwertige BeverageType-Objekte** mit `isCustom: true`. Das Type-System unterstützt das bereits (`isCustom: boolean` in `BeverageType`). Nur an wenigen Stellen muss unterschieden werden (Edit/Delete-Menü, Max-Limit-Check).

---

### Warum NICHT in Settings?

Settings = globale App-Konfiguration (Ziel, Sprache, Theme).  
Custom Drinks = **persönliche Inhalte** — konzeptionell dasselbe wie Favoriten.  
Favoriten liegen auch nicht in Settings, sondern im Drink-Workflow.  
Custom Drinks gehören dort hin, wo der User sie braucht: direkt beim Hinzufügen eines Drinks.

---

## Technische Hinweise (für Implementierung)

### Datenhaltung
```typescript
// Neuer IndexedDB Store: customBeverages
// BeverageType.isCustom = true
// id: 'custom_' + nanoid() 
// nameKey: direkter Name-String (kein i18n-Key nötig)
// iconUrl: '/icons/<gewähltes-file>.png'
// hydrationFactor: 0.0 – 1.5
// warningLevel: 'none' (kein Warning für Custom-Drinks)
// category: 'other' (oder neue Kategorie 'custom')
```

### Hook-Änderungen
- `useDrinks`: Custom-Drinks aus DB laden und mit `defaultBeverages` mergen
- `useFrequentBeverages`: funktioniert automatisch (basiert auf DrinkEntry-Statistik)
- `useRecentBeverages`: funktioniert automatisch

### Component-Änderungen
- `AddDrinkModal`: Sektion "Meine Getränke" + "+ Neu"-Button + Long-Press-Context-Menu für Custom-Drinks
- Neuer Component: `CustomBeverageForm` (Name, Icon-Picker, Slider) — wiederverwendbar für Anlegen + Bearbeiten
- `BevCard`: Kleines Edit-Indikator-Icon (✏️) bei `isCustom: true` Karten (optional, subtil)
