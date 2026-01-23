---
trigger: always_on
---

# D&D Nexus – Cursor-Regeln

## Projekt
Tauri-2-Desktop-App: React 19 + TypeScript (Frontend), Rust (Backend), SQLite. D&D 5e (2024) Charaktere + Kompendium. Siehe PROJEKTSTRUKTUR.md.

## Regelwerke (einzige Quelle)
- **`resources/books/`** sind die autoritativen Quellen für D&D 5e (2024): Spielerhandbuch (PHB), Spielleiterhandbuch (DMG).
- Für **regelrelevante Inhalte** (Mechanik, Zaubertexte, Klassenmerkmale, Spezies-Merkmale, Hintergründe, Waffen/Rüstungen, Items, etc.): **nur** die Regelwerke heranziehen. Keine Texte, Werte oder Beschreibungen aus dem Gedächtnis erfinden oder „plausibel“ ergänzen.
- Bei Unsicherheit: in den Regelwerken nachschlagen (PDF/DOCX in `resources/books/`) oder den Nutzer explizit auf die Quelle verweisen. `docs/` und `prompts/` dienen der Implementierung, ersetzen die Regelwerke für in‑game‑Inhalte nicht.

## Sprache
- Kommunikation mit dem Nutzer: Deutsch.
- Code, Variablen, Funktionsnamen, SQL, Commit-Messages: Englisch.
- UI-Texte (Labels, Buttons, Fehlermeldungen): Deutsch.

## Typen & D&D-Domain
- **Attribute:** `str`, `dex`, `con`, `int`, `wis`, `cha` (snake_case, 3 Buchstaben). `Attributes` in `src/lib/types.ts`; in Rust analog.
- **Typen zentral:** TS in `src/lib/types.ts` und `src/lib/types/*`; Rust in `src-tauri/src/types/*`. Bei neuen Feldern (Character, Compendium-Entitäten) Frontend- und Backend-Typen gemeinsam anpassen.
- **D&D-Formeln:** `src/lib/math.ts` (Modifier, Level/XP, etc.); Kampf: `docs/KAMPF_FORMELSAMMLUNG.md`.

## Frontend (src/)

### API & Tauri
- Tauri-`invoke()` **nur** in `src/lib/api.ts` (bzw. in `api/*.ts`-Modulen, die von api.ts genutzt werden). **Nicht** in Komponenten oder Stores.
- Command-Namen: `snake_case`. Neue Endpoints in die passende API-Gruppe (`characterApi`, `compendiumApi`, `homebrewApi`, `settingsApi`, `files`-Calls) eintragen.

### Imports
- Bevorzugt relative Pfade (`../../lib/...`). `@/` (tsconfig path) nur wenn es Lesbarkeit verbessert.
- Types aus `./types` bzw. `./types/weapons`, `./types/armors`.

### State
- Globaler State: Zustand-Stores (`store.ts`, `compendiumStore.ts`, `themeStore.ts`). Kein Redux/Context für App-State.
- API-Calls laufen über die Stores oder gezielt über `*Api` aus `api.ts`.

### Komponenten
- Funktionskomponenten, ggf. `React.FC<Props>`. Props-Interface immer benennen.
- Styling: Tailwind. Für dynamische Klassen: `clsx` / `tailwind-merge` (cn-Pattern wenn vorhanden).
- Komponenten in `components/`, `components/character/`, `components/features/`, `components/ui/`.

### Design & Styling
- **Token-first:** Farben/Border-Radius über CSS-Variablen in `src/index.css` (`:root`/`.light`/`.dark`). Keine Hex/Hardcodes in Komponenten; Tailwind nutzt `hsl(var(--primary) / <alpha-value>)` etc. (siehe `tailwind.config.js`).
- **Magic Numbers:** Wiederkehrende Werte (Geschwindigkeit, Virtualizer-Höhen, …) in `src/lib/uiConstants.ts`.
- **Theme:** `darkMode: "class"`; Umschaltung über `useThemeStore`, Klasse auf `<html>`. Bei UI-Design: DESIGN_SCHEMA.md, DIGITALES_GRIMOIRE_UI_KONZEPT.md.

### Fehler (Frontend)
- `src/lib/errors.ts`: `AppError`, `formatError`, `logError`. Kein blindes `console.error`; bei Tauri-Fehlern `formatError` nutzen und ggf. an Nutzer anzeigen.

### Tests
- Vitest + Testing Library. Setup: `src/test/setup.ts`.

## Backend (src-tauri/)

### Tauri-Commands
- Neue Commands in `src-tauri/src/commands/` (passendes Modul oder neues `*.rs`), Modul in `commands/mod.rs` eintragen, Handler in `main.rs` bei `invoke_handler(tauri::generate_handler![ ... ])` registrieren.
- Signatur: `#[tauri::command]` + `async fn`, `State<'_, Database>` bzw. `State<'_, AppState>`, `Result<T, String>`. App-intern `AppResult<T>` nutzen und am Ende `.map_err(|e| e.to_string())` für Tauri.

### Fehler
- `AppError` / `AppResult` aus `error.rs`. `map_lock_error()` für `db.0.lock()`. Keine `unwrap()` in Production-Pfaden; `?` oder explizite Fehlerbehandlung.

### Datenbank
- Schema/Migrationen: `db/migrations.rs`. Tabellen-Schema: `core_*` (Regelwerk) und `custom_*` (Homebrew/Overrides) mit `parent_id`; `all_*`-Views vereinen beide + `source` ('core'|'homebrew'|'override').
- Neue Kompendium-Entitäten: `core_*`, `custom_*` und `all_*`-View anlegen; ggf. bestehende Views in `run_migrations` anpassen.

### Typen (Rust)
- `src-tauri/src/types/`: Serde `#[derive(Serialize, Deserialize)]`, `#[serde(default)]` für optionale/backward-kompatible Felder. Mit Frontend-Typen (`src/lib/types.ts`) abgestimmt halten (Character, HealthPool, Modifier, …). `types/mod.rs` exportiert die Module.

### Binaries / CLI
- Einmalige oder Migrations-Scripts: `src-tauri/src/bin/*.rs`. Werden nicht in `main.rs` registriert.

## Scripts (scripts/)
- Node/TS: `tsx` (z.B. `pnpm tsx scripts/...` oder via `package.json`). SQLite: `better-sqlite3` wo nötig.
- Rust-Binaries: `cargo run --bin <name>` aus `src-tauri/`.

## Qualität vor PR
- **Frontend:** `pnpm lint`, `pnpm typecheck`, `pnpm test run`. `lint-staged` (pre-commit) nur für `src/**/*.{ts,tsx,css}`.
- **Rust:** `cargo fmt`, `cargo clippy --all-targets` in `src-tauri/`. Siehe CHECKLIST.md (P1: Clippy, reduce `unwrap`/`expect`). Siehe CONTRIBUTING.md.

## CHECKLIST.md
- Roadmap und offene Tasks (P1–P3). Vor Feature-Arbeit prüfen: Priorität, Abhängigkeiten, verlinkte Docs (`docs/KAMPF_FORMELSAMMLUNG.md`, `DIGITALES_GRIMOIRE_UI_KONZEPT.md`, `DESIGN_SCHEMA.md` usw.).
- Erledigte Punkte: `[ ]` → `[x]` setzen, ggf. kurze Bestätigung ergänzen.

## Domänen-Docs (docs/, prompts/)
- Bei Änderungen an **Kampf:** `docs/KAMPF_FORMELSAMMLUNG.md`. **Features/Klassen:** `docs/IMPLEMENTIERUNGSKONZEPT_FEATURE_SYSTEM.md`, `docs/CLASS_*.md`. **Datenbank/Import:** passende `docs/*-concept.md`, `docs/*-analysis.md`. **Hintergründe/Equipment:** `prompts/`, `docs/background-*.md`. Vor Implementierung Konzept prüfen, Abweichungen begründen.

## CHANGELOG.md
- Format: [Keep a Changelog](https://keepachangelog.com/de/1.0.0/), [Semantic Versioning](https://semver.org/). Einträge auf Deutsch.
- Bei sichtbaren oder relevanten Änderungen: Eintrag unter `[Unreleased]` (oder der nächsten Version) mit `### Added`, `### Changed`, `### Fixed`, `### Removed`. Kurz und prägnant, gleicher Stil wie bestehende Einträge.
- Releases/Versionierung: RELEASE_GUIDE.md, `pnpm release` / `pnpm maintenance`.

## Vermeiden
- `invoke()` in Komponenten/Stores; neue Tauri-Commands ohne Eintrag in `main.rs`; `unwrap()`/`expect()` in Rust-Production-Pfaden; Hex/Hardcoded-Farben statt CSS-Tokens; neue `core_*`/`custom_*`-Tabellen ohne `all_*`-View; Frontend- oder Backend-Typen einseitig anpassen; **Regeltexte, -werte oder -beschreibungen erfinden** – nur `resources/books/` (Regelwerke) als Quelle.

## Nützliche Referenzen
- **Regelwerke:** `resources/books/` (PHB, DMG – einzige Quelle für regelrelevante Inhalte).
- PROJEKTSTRUKTUR.md, CONTRIBUTING.md, RELEASE_GUIDE.md, CHECKLIST.md, CHANGELOG.md; DESIGN_SCHEMA.md, DIGITALES_GRIMOIRE_UI_KONZEPT.md; docs/ für Konzepte; prompts/ für Extraktion/Import.
