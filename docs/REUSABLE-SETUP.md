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
