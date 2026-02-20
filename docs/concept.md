# Water Tracker App — Konzept & Architektur

> **Version:** 0.1 (Draft)  
> **Datum:** 2026-02-20  
> **Status:** Zur Review durch Product Owner  

---

## Inhaltsverzeichnis

1. [User Stories](#1-user-stories)
2. [Datenmodell](#2-datenmodell)
3. [Getränke-Katalog & Hydrations-Faktoren](#3-getränke-katalog--hydrations-faktoren)
4. [Architektur-Empfehlung](#4-architektur-empfehlung)
5. [Offene Entscheidungen für Product Owner](#5-offene-entscheidungen-für-product-owner)

---

## 1. User Stories

### US-01: Getränk erfassen

**Als** Nutzer  
**möchte ich** schnell ein Getränk mit Typ und Menge eintragen,  
**damit** meine tägliche Flüssigkeitsaufnahme erfasst wird.

**Akzeptanzkriterien:**
- [ ] Nutzer kann einen Getränketyp aus einer vordefinierten Liste wählen (Wasser, Tee, Kaffee, Milch, Saft, Cola, Bier, Wein, etc.)
- [ ] Menge kann über Presets eingegeben werden: Glas (250 ml), Becher (300 ml), Flasche (500 ml), Große Flasche (1000 ml)
- [ ] Alternativ: freie Eingabe in ml
- [ ] Eintrag wird mit aktuellem Timestamp gespeichert
- [ ] Nach Eintrag wird die Tagesübersicht aktualisiert
- [ ] Erfassung funktioniert mit max. 3 Taps/Klicks für den häufigsten Fall (Wasser, 250 ml)
- [ ] Visuelles Feedback nach erfolgreichem Eintrag (z.B. kurze Animation, Checkmark)

### US-02: Wasser-Äquivalent anzeigen

**Als** Nutzer  
**möchte ich** sehen, wie viel „echtes Wasser" mein Getränk zur Hydration beiträgt,  
**damit** ich einschätzen kann, wie gut ich hydriert bin.

**Akzeptanzkriterien:**
- [ ] Bei Getränkeauswahl wird der Hydrations-Faktor sichtbar angezeigt (z.B. „Kaffee: 0,95× Wasser")
- [ ] Wasser-Äquivalent = Menge × Hydrations-Faktor → wird berechnet und in Tagesübersicht addiert
- [ ] Tagesübersicht zeigt BEIDE Werte: Gesamtmenge (ml) UND Wasser-Äquivalent (ml)
- [ ] Bei Getränken mit Faktor < 0,5 erscheint eine **Warnung** (z.B. „Alkoholische Getränke dehydrieren — zählt nur teilweise")
- [ ] Bei Getränken mit Faktor ≤ 0 erscheint eine **starke Warnung** (z.B. „Spirituosen wirken dehydrierend!")
- [ ] Warnung ist informativ, nicht blockierend — Eintrag ist trotzdem möglich

### US-03: Tagesfortschritt sehen

**Als** Nutzer  
**möchte ich** auf einen Blick sehen, wie viel ich heute schon getrunken habe,  
**damit** ich weiß, ob ich noch mehr trinken sollte.

**Akzeptanzkriterien:**
- [ ] Hauptscreen zeigt eine Fortschrittsanzeige (Kreisdiagramm oder Wellenanimation)
- [ ] Fortschritt basiert auf dem **Wasser-Äquivalent** (nicht Rohmenge)
- [ ] Tagesziel wird als 100%-Marke dargestellt
- [ ] Aktueller Wert in ml (Wasser-Äquivalent) wird numerisch angezeigt
- [ ] Farbcodierung: Rot (< 30%), Orange (30–60%), Gelb (60–90%), Grün (≥ 90%)
- [ ] Liste der heutigen Einträge unterhalb der Fortschrittsanzeige
- [ ] Anzeige aktualisiert sich sofort nach neuem Eintrag

### US-04: Historie einsehen

**Als** Nutzer  
**möchte ich** vergangene Tage einsehen können,  
**damit** ich mein Trinkverhalten über die Zeit verfolgen kann.

**Akzeptanzkriterien:**
- [ ] Kalenderansicht oder scrollbare Liste der letzten 30+ Tage
- [ ] Pro Tag sichtbar: Gesamtmenge (ml), Wasser-Äquivalent (ml), Ziel erreicht (✓/✗)
- [ ] Farbliche Markierung: Grüner Punkt = Ziel erreicht, Roter Punkt = nicht erreicht
- [ ] Tap/Klick auf einen Tag öffnet Detail-Ansicht mit allen Einträgen dieses Tages
- [ ] Tage ohne Einträge sind als „keine Daten" markiert (nicht als 0 ml)

### US-05: Statistik & Auswertung

**Als** Nutzer  
**möchte ich** eine Wochen- und Monatsauswertung sehen,  
**damit** ich Trends in meinem Trinkverhalten erkenne.

**Akzeptanzkriterien:**
- [ ] Wochenansicht: 7 Balken (Mo–So) mit Tagesmengen (Wasser-Äquivalent)
- [ ] Tagesziel als horizontale Linie im Chart
- [ ] Durchschnitt der aktuellen Woche/Monats wird angezeigt
- [ ] Streak-Anzeige: „X Tage in Folge Ziel erreicht" 🔥
- [ ] Vergleich aktuelle vs. letzte Woche (besser/schlechter/gleich)
- [ ] Optional: Monatsansicht mit Tagesübersicht als Heatmap

### US-06: Tagesziel einstellen

**Als** Nutzer  
**möchte ich** mein persönliches Tagesziel festlegen,  
**damit** die App mich passend einschätzt.

**Akzeptanzkriterien:**
- [ ] Standard-Tagesziel: 2000 ml (vorgefüllt)
- [ ] Einstellbar in 100-ml-Schritten (Slider oder +/−)
- [ ] Bereich: 500 ml – 5000 ml
- [ ] Änderung wirkt sofort auf Tagesfortschritt
- [ ] Hinweis: „Empfohlen: 1500–2500 ml je nach Körpergewicht und Aktivität"
- [ ] Ziel wird persistent gespeichert

### US-07: Eintrag bearbeiten / löschen (Ergänzung)

**Als** Nutzer  
**möchte ich** einen falschen Eintrag korrigieren oder löschen,  
**damit** meine Daten korrekt sind.

**Akzeptanzkriterien:**
- [ ] Swipe-to-Delete oder Tap → Menü mit „Bearbeiten" / „Löschen"
- [ ] Bearbeiten: Menge und Getränketyp änderbar
- [ ] Löschen mit Bestätigung (Undo-Möglichkeit für 5 Sekunden)
- [ ] Tagesfortschritt aktualisiert sich sofort

### US-08: Onboarding (Ergänzung)

**Als** neuer Nutzer  
**möchte ich** beim ersten Start kurz eingeführt werden,  
**damit** ich die App sofort nutzen kann.

**Akzeptanzkriterien:**
- [ ] Max. 3 Screens: Willkommen → Tagesziel setzen → Los geht's
- [ ] Übersprungbar
- [ ] Wird nur beim allerersten Start gezeigt
- [ ] Setzt initiale Einstellungen (Tagesziel)

---

## 2. Datenmodell

### Entitäten

#### `UserSettings` (Singleton, 1 pro Gerät/User)

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | string (UUID) | Eindeutige ID |
| `dailyGoalMl` | number | Tagesziel in ml (Default: 2000) |
| `onboardingCompleted` | boolean | Onboarding abgeschlossen? |
| `createdAt` | ISO 8601 string | Erstellt am |
| `updatedAt` | ISO 8601 string | Zuletzt geändert |

#### `BeverageType` (Katalog, vordefiniert + erweiterbar)

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | string | Kurzname (z.B. `water`, `coffee`) |
| `name` | string | Anzeigename (z.B. „Kaffee") |
| `nameEn` | string | Englischer Name (für i18n) |
| `icon` | string | Emoji oder Icon-Referenz |
| `hydrationFactor` | number | 0.0 – 1.5 (1.0 = wie Wasser) |
| `warningLevel` | `none` \| `mild` \| `strong` | Warnstufe |
| `warningText` | string \| null | Warnhinweis |
| `category` | string | Kategorie (water, hot, cold, alcohol, other) |
| `isCustom` | boolean | Vom Nutzer erstellt? |
| `sortOrder` | number | Reihenfolge in der Auswahl |

#### `DrinkEntry` (Hauptdaten, 0–n pro Tag)

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | string (UUID) | Eindeutige ID |
| `beverageTypeId` | string | Referenz auf BeverageType |
| `amountMl` | number | Menge in ml |
| `hydrationFactor` | number | Faktor zum Zeitpunkt des Eintrags (Snapshot) |
| `waterEquivalentMl` | number | Berechnet: amountMl × hydrationFactor |
| `date` | string (YYYY-MM-DD) | Tag (für Gruppierung) |
| `timestamp` | ISO 8601 string | Exakter Zeitpunkt |
| `createdAt` | ISO 8601 string | Erstellt am |
| `updatedAt` | ISO 8601 string | Zuletzt geändert |

#### `DailySummary` (abgeleitete/gecachte Daten, 1 pro Tag)

| Feld | Typ | Beschreibung |
|---|---|---|
| `date` | string (YYYY-MM-DD) | Tag (Primary Key) |
| `totalMl` | number | Summe aller Einträge in ml |
| `totalWaterEquivalentMl` | number | Summe Wasser-Äquivalent |
| `goalMl` | number | Tagesziel an diesem Tag |
| `goalReached` | boolean | totalWaterEquivalentMl ≥ goalMl |
| `entryCount` | number | Anzahl Einträge |

### Design-Entscheidungen

1. **Hydrations-Faktor als Snapshot:** Der Faktor wird beim Eintrag gespeichert (nicht nur referenziert), damit spätere Änderungen am Katalog keine historischen Daten verfälschen.

2. **`DailySummary` ist Cache:** Kann jederzeit aus `DrinkEntry`-Daten neu berechnet werden. Dient der Performance bei Statistik-Abfragen.

3. **`date` als YYYY-MM-DD String:** Einfache Gruppierung, Sortierung und Abfrage. Timezone wird client-seitig bestimmt.

4. **Backend-Kompatibilität:** Alle IDs sind UUIDs (client-generiert). Timestamps sind ISO 8601. Das Modell kann 1:1 in eine REST-API oder Datenbank überführt werden. Bei Sync wäre ein `syncedAt` / `dirty`-Flag pro Entität nötig.

### ER-Diagramm (Textform)

```
UserSettings (1) ──── hat ──── (n) DrinkEntry
                                    │
                                    └── referenziert ──── BeverageType (Katalog)
                                    │
DailySummary (1 pro Tag) ◄──── berechnet aus ──── DrinkEntry (n pro Tag)
```

---

## 3. Getränke-Katalog & Hydrations-Faktoren

Basierend auf dem **Beverage Hydration Index (BHI)** nach Maughan et al. (2016, Am J Clin Nutr 103: 717-723). Der BHI misst, wie viel Flüssigkeit 2 Stunden nach Konsum im Körper verbleibt, verglichen mit der gleichen Menge Wasser.

### Umrechnungstabelle

| ID | Getränk | Hydrations-Faktor | Warnstufe | Hinweis |
|---|---|---|---|---|
| `water` | Wasser 💧 | **1.00** | none | Referenzwert |
| `sparkling_water` | Sprudelwasser 🫧 | **1.00** | none | Gleich wie stilles Wasser |
| `tea_herbal` | Kräutertee 🍵 | **1.00** | none | Koffeinfrei, wie Wasser |
| `tea_black` | Schwarztee 🫖 | **0.95** | none | Minimaler Koffein-Effekt |
| `tea_green` | Grüner Tee 🍵 | **0.95** | none | Minimaler Koffein-Effekt |
| `coffee` | Kaffee ☕ | **0.95** | none | BHI-Studie: kein signifikanter Unterschied zu Wasser bei normalen Mengen |
| `milk_skim` | Magermilch 🥛 | **1.10** | none | BHI höher als Wasser (Elektrolyte, Nährstoffe) |
| `milk_whole` | Vollmilch 🥛 | **1.10** | none | BHI höher als Wasser |
| `orange_juice` | Orangensaft 🍊 | **1.05** | none | Leicht besser als Wasser (Zucker, K+) |
| `apple_juice` | Apfelsaft 🍎 | **1.00** | none | Vergleichbar mit Wasser |
| `cola` | Cola 🥤 | **0.95** | none | BHI-Studie: kein signifikanter Unterschied |
| `cola_diet` | Cola light/zero 🥤 | **0.95** | none | Wie Cola, ohne Zucker |
| `sports_drink` | Sportgetränk ⚡ | **1.00** | none | BHI-Studie: wie Wasser |
| `lemonade` | Limonade 🍋 | **0.95** | none | Vergleichbar |
| `smoothie` | Smoothie 🥤 | **1.00** | none | Hoher Wassergehalt |
| `soup` | Suppe/Brühe 🍲 | **1.05** | none | Elektrolyte fördern Retention |
| `beer` | Bier 🍺 | **0.60** | mild | „Bier hydratisiert deutlich weniger als Wasser. Zählt nur teilweise." |
| `wine` | Wein 🍷 | **0.40** | mild | „Wein hat einen hohen Alkoholgehalt. Zählt nur eingeschränkt zur Hydration." |
| `champagne` | Sekt/Prosecco 🥂 | **0.40** | mild | Wie Wein |
| `spirits` | Spirituosen 🥃 | **-0.10** | strong | „Spirituosen wirken dehydrierend! Zählt negativ." |
| `cocktail` | Cocktail 🍹 | **0.30** | mild | „Cocktails enthalten viel Alkohol. Geringe Hydrationswirkung." |
| `energy_drink` | Energy Drink ⚡ | **0.85** | mild | „Hoher Koffeingehalt. Bei großen Mengen leicht harntreibend." |

### Quellen & Begründung

- **Maughan RJ et al. (2016).** "A randomized trial to assess the potential of different beverages to affect hydration status: development of a beverage hydration index." *Am J Clin Nutr* 103:717-723.
  - Kern-Ergebnis: Kaffee, Tee, Cola, Bier (Lager) zeigen keinen signifikant unterschiedlichen BHI zu Wasser bei moderaten Mengen.
  - Milch (voll/mager) und ORS haben signifikant höheren BHI (~1.5).

- **Anpassung für die App:** Die BHI-Studie testete moderate Mengen (1L). Für die App wurden die Werte leicht konservativ angepasst:
  - Milch: BHI 1.5 → App-Faktor 1.1 (konservativer, da in der Praxis selten 1L Milch auf einmal)
  - Bier: BHI ~1.0 (nur Lager, 1L) → App-Faktor 0.6 (konservativer, da Alkohol bei kumuliertem Konsum stärker dehydriert)
  - Wein/Spirituosen: Nicht in der Studie → abgeleitet aus Alkoholgehalt und bekannter Diurese

- **Alkohol-Regel:** Ab ~4% Alkohol sinkt der Hydrations-Faktor deutlich. Spirituosen (>20%) werden als dehydrierend eingestuft.

### Warn-Logik

| Warnstufe | Trigger | UI-Darstellung |
|---|---|---|
| `none` | Faktor ≥ 0.8 | Kein Hinweis |
| `mild` | 0.0 < Faktor < 0.8 | Gelbes Warnsymbol ⚠️ + Hinweistext |
| `strong` | Faktor ≤ 0.0 | Rotes Warnsymbol 🛑 + Warntext + visueller Akzent |

---

## 4. Architektur-Empfehlung

### 4.1 Tech-Stack

| Komponente | Empfehlung | Begründung |
|---|---|---|
| **Framework** | **React 19** + TypeScript | Größtes Ökosystem, beste Capacitor-Integration, Alex' Team-Erfahrung am wahrscheinlichsten. Alternative: Vue 3 (leichtgewichtiger). |
| **Build-Tool** | **Vite 6** | Schnellstes DX, nativer PWA-Plugin-Support, Capacitor-kompatibel |
| **Styling** | **Tailwind CSS 4** | Utility-first, schnell prototypen, responsive built-in, kleine Bundle-Size |
| **UI-Komponenten** | **Headless (eigene)** + ein paar Radix Primitives | Volle Kontrolle über Look & Feel, keine heavy-weight Library |
| **State Management** | **Zustand** | Leichtgewichtig, TypeScript-freundlich, kein Boilerplate |
| **Lokale DB** | **Dexie.js** (IndexedDB-Wrapper) | Typsicher, reaktiv, offline-first, einfache Queries, gut dokumentiert |
| **Charts** | **Recharts** oder **Chart.js** (via react-chartjs-2) | Einfach für Balken/Kreis-Diagramme. Recharts ist React-nativer. |
| **Icons** | **Lucide React** | Lightweight, konsistent, Tree-shakeable |
| **Testing** | **Vitest** + **Testing Library** | Vite-nativ, schnell, Standard |
| **PWA** | **vite-plugin-pwa** (Workbox) | Automatische Service-Worker-Generierung, Manifest-Handling |

### 4.2 Projektstruktur

```
~/app/water-tracker/
├── docs/                   # Konzept, Architektur-Docs
├── public/
│   ├── icons/              # PWA-Icons (192, 512)
│   └── manifest.json       # → wird von vite-plugin-pwa generiert
├── src/
│   ├── app/
│   │   ├── App.tsx         # Root-Komponente, Router
│   │   └── routes.tsx      # Route-Definitionen
│   ├── components/
│   │   ├── ui/             # Basis-Komponenten (Button, Card, etc.)
│   │   └── drink/          # Feature-Komponenten (DrinkForm, DrinkList)
│   ├── data/
│   │   ├── beverages.ts    # Getränke-Katalog (statische Daten)
│   │   └── db.ts           # Dexie DB-Definition & Migrations
│   ├── hooks/
│   │   ├── useDrinks.ts    # CRUD-Hooks für DrinkEntry
│   │   ├── useStats.ts     # Statistik-Berechnungen
│   │   └── useSettings.ts  # UserSettings
│   ├── stores/
│   │   └── appStore.ts     # Zustand Store (UI-State, aktiver Tag)
│   ├── types/
│   │   └── index.ts        # TypeScript-Typen (DrinkEntry, BeverageType, etc.)
│   ├── utils/
│   │   ├── hydration.ts    # Wasser-Äquivalent-Berechnung
│   │   └── date.ts         # Datum-Hilfsfunktionen
│   ├── pages/
│   │   ├── Dashboard.tsx   # Hauptscreen (Tagesfortschritt + Erfassung)
│   │   ├── History.tsx     # Historie-Ansicht
│   │   ├── Stats.tsx       # Statistik-Ansicht
│   │   ├── Settings.tsx    # Einstellungen
│   │   └── Onboarding.tsx  # Erstnutzer-Flow
│   ├── index.css           # Tailwind-Imports, globale Styles
│   └── main.tsx            # Entry Point
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
└── README.md
```

### 4.3 PWA-Strategie

| Aspekt | Umsetzung |
|---|---|
| **Manifest** | `vite-plugin-pwa` generiert manifest automatisch aus Config |
| **Service Worker** | Workbox (GenerateSW-Strategie) — cacht App-Shell + statische Assets |
| **Offline** | App funktioniert 100% offline (alle Daten in IndexedDB). Kein Backend nötig für V1. |
| **Install-Prompt** | Custom „Zum Homescreen hinzufügen"-Banner bei wiederholter Nutzung |
| **Updates** | Service Worker Update-Prompt: „Neue Version verfügbar — jetzt aktualisieren?" |
| **Icons** | 192×192 + 512×512 PNG, Maskable-Variante |

### 4.4 Capacitor-Readiness

Was jetzt schon beachten:
1. **Keine Browser-only APIs** direkt nutzen — abstrahieren (z.B. `notifications.ts` Wrapper)
2. **Projektstruktur** kompatibel: Capacitor erwartet `dist/` als Web-Root → Vite default passt
3. **Kein server-side Rendering** — alles client-side (SPA) → Capacitor-kompatibel
4. **CSS safe-area Insets** berücksichtigen (für Notch/Dynamic Island)
5. **Touch-optimiertes UI** — keine hover-only Interaktionen

Was NICHT jetzt nötig:
- Capacitor installieren/konfigurieren
- Native Plugins einbinden
- App-Store-Assets erstellen

### 4.5 Backend (Ausblick — nicht für V1)

Falls später Backend gewünscht:
- **Option A: Supabase** — PostgreSQL + Auth + Realtime Sync. Schnellster Weg zu einem Backend ohne eigene Infrastruktur.
- **Option B: Eigenes API** — Node.js + Express/Fastify + PostgreSQL/SQLite. Volle Kontrolle.
- **Sync-Strategie:** Optimistic Offline-First. Lokale DB ist "Source of Truth", Backend wird bei Connectivity synchronisiert. Conflict Resolution via `updatedAt`-Timestamp (Last-Write-Wins für V1).

---

## 5. Offene Entscheidungen für Product Owner

### 🔴 Muss vor Entwicklungsstart entschieden werden

| # | Frage | Optionen | Empfehlung |
|---|---|---|---|
| **PO-1** | **Zielmetrik: Rohmenge oder Wasser-Äquivalent?** Wird das Tagesziel gegen die tatsächlich getrunkene Menge oder das Wasser-Äquivalent gemessen? | A) Wasser-Äquivalent (genauer) B) Rohmenge (einfacher) C) Beides anzeigen, Ziel gegen Äquivalent | **C** — Beides zeigen, Ziel gegen Wasser-Äquivalent |
| **PO-2** | **Sprache der App?** Deutsch-only für V1 oder gleich zweisprachig? | A) Nur Deutsch B) Deutsch + Englisch C) Nur Englisch | **A** für V1, i18n-ready bauen |
| **PO-3** | **Braucht V1 ein Backend / User-Accounts?** Oder reicht rein lokale Speicherung? | A) Nur lokal (kein Backend) B) Optional: Export/Import als Backup C) Backend mit Login ab V1 | **A** für V1, B als Quick-Win |
| **PO-4** | **Name der App?** „Trinke ich genug?", „Hygrometer", „Water Tracker", oder etwas anderes? | Frei wählbar | Empfehlung: kurz, einprägsam, deutsch |

### 🟡 Kann während der Entwicklung entschieden werden

| # | Frage | Optionen | Empfehlung |
|---|---|---|---|
| **PO-5** | **Fortschrittsanzeige: Welcher Stil?** | A) Kreisdiagramm B) Wasserglas-Animation (fill-up) C) Balkendiagramm D) Numerisch | **B** — Wasserglas mit Füllstand. Emotional, sofort verständlich. |
| **PO-6** | **Schnelleingabe: Favoriten?** Soll es eine „letzte Getränke" / Favoriten-Funktion geben? | A) Ja, die 3 häufigsten als Quick-Buttons B) Nein, immer volle Auswahl | **A** — Quick-Buttons für die häufigsten Getränke |
| **PO-7** | **Tagesziel: Personalisierung?** Soll das Tagesziel anhand von Gewicht/Aktivität berechnet werden können? | A) Nur manuell B) Optional: Rechner (Gewicht × 30ml) | **A** für V1, Hinweis auf empfohlene Werte reicht |
| **PO-8** | **Darkmode?** | A) Nur Light B) Nur Dark C) System-Einstellung folgen | **C** — System-Präferenz, kein manueller Toggle nötig |

### 🟢 Kann auf später verschoben werden

| # | Thema |
|---|---|
| **PO-9** | Erinnerungen / Push-Notifications |
| **PO-10** | Eigene Getränke anlegen |
| **PO-11** | Gamification (Badges, Achievements) |
| **PO-12** | Multi-Device Sync |
| **PO-13** | Daten-Export (CSV, PDF) |

---

## Anhang: Referenzen

1. Maughan RJ, Watson P, Cordery PA, et al. "A randomized trial to assess the potential of different beverages to affect hydration status: development of a beverage hydration index." *American Journal of Clinical Nutrition* 103(3):717-723, 2016.
2. European Food Safety Authority (EFSA). "Scientific Opinion on Dietary Reference Values for water." *EFSA Journal* 8(3):1459, 2010.
3. Capacitor Documentation: https://capacitorjs.com/docs
4. Vite PWA Plugin: https://vite-pwa-org.netlify.app/
5. Dexie.js: https://dexie.org/
