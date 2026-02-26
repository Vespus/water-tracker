# Wiederverwendbares Projekt-Setup

Dieses Setup kann als Vorlage für neue Projekte unter `/home/alex/app/` dienen.

## Generische Dateien (1:1 kopierbar)

| Datei | Zweck |
|-------|-------|
| `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` | TypeScript-Config |
| `eslint.config.js` | ESLint mit React-Hooks + Refresh |
| `.prettierrc` | Prettier-Formatierung |
| `vitest.config.ts` + `src/test-setup.ts` | Test-Setup |

## Anpassbar (projektspezifisch)

| Datei | Was ändern |
|-------|-----------|
| `package.json` | Name, Description, Dependencies |
| `vite.config.ts` | PWA-Manifest (Name, Icons, Farben) |
| `src/i18n/` | Locale-Keys und Sprachen |
| `src/data/db.ts` | Dexie DB-Schema |
| `src/types/index.ts` | Datenmodell |

## Neues Projekt anlegen

```bash
cd /home/alex/app
mkdir mein-projekt && cd mein-projekt
npm create vite@latest . -- --template react-ts
npm install zustand dexie recharts lucide-react react-i18next i18next i18next-browser-languagedetector
npm install -D @tailwindcss/vite tailwindcss vite-plugin-pwa vitest @testing-library/react @testing-library/jest-dom jsdom prettier
```

Dann die generischen Config-Dateien aus einem bestehenden Projekt kopieren und die projektspezifischen anpassen.

## Context Discipline — Projektplanung

### Milestone-Sizing-Regel
Ein Coordinator-Auftrag darf max. **6-8 Sub-Agent-Roundtrips** erzeugen (inkl. erwartbare Bug-Loops).
- **Einfache Features (nur UI oder nur Backend):** 2-3 Stories pro Auftrag
- **Komplexe Features (UI + Backend + erwartbare Bugs):** 1 Story pro Auftrag
- **Concept-Phase IMMER separat** vom Build-Auftrag

### Concept-Qualitäts-Gate
Bevor ein Build-Auftrag an den Coordinator geht, muss das Concept enthalten:
- [ ] Datenmodell (Felder, Typen, Relationen)
- [ ] Komponenten-Struktur (welche Komponenten, wo)
- [ ] i18n-Keys (alle UI-Strings als Keys definiert)
- [ ] Akzeptanzkriterien pro User Story
- [ ] Edge Cases dokumentiert

Je präziser das Concept, desto weniger Bug-Loops → weniger Kontext-Verbrauch.

### Operative Regeln (im Coordinator verankert)
- Ein Task = Ein Fokus (kein paralleles Sub-Agent-Spawning)
- Fail-Fast bei Bug-Loops (max 2 Zyklen, dann Zwischenbericht)
- Trello als externes Gedächtnis (nicht auf Kontext verlassen)
- Sub-Agenten zu kompakten Antworten anweisen

### Token-Budget-Empfehlung (OpenClaw `contextTokens`)
| Agent | contextTokens | Begründung |
|---|---|---|
| Coordinator | Default (200k) | Braucht am meisten wg. Roundtrips |
| UI / Backend | 80.000 | Klare Einzelaufträge |
| Concept | 100.000 | Docs lesen + schreiben |
| Tester | 60.000 | Abgegrenzter Job |

---

## Testing-Leitfaden

### ✅ Richtig: Playwright TypeScript Tests (Native)
```bash
cd ~/app/water-tracker
npx playwright test tests/us010-time-edit.spec.ts
```
- Nutzt `playwright.config.ts` → startet Server automatisch via `webServer`
- Funktioniert in Sandbox-Umgebung (localhost-Zugriff wird vom webServer-Start gelöst)

### ❌ Falsch: Python/Playwright Scripts
- Python-Scripts via `uv run --with playwright python3 test_*.py`
- Problem: Sandbox-Isolation blockt localhost-Verbindungen
- **Niemals für Water Tracker nutzen** → stattdessen TypeScript Tests schreiben

### Test-Dateien ablegen
- `tests/*.spec.ts` → Playwright Tests (native)
- `test-*.py` → **NICHT VERWENDEN** (veraltet, funktioniert nicht)
- `test-results/` → Screenshots und Artefakte
