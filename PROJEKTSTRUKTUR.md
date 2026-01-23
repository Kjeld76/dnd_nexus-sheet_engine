# D&D Nexus - Projektstruktur & Architektur

## Übersicht

**D&D Nexus** ist eine Desktop-Anwendung zur Verwaltung von D&D 5e (2024) Charakteren. Die App basiert auf einer **Tauri 2.0** Architektur mit React Frontend und Rust Backend.

**Version:** 1.6.1  
**Sprache:** Deutsch  
**Plattform:** Windows, macOS, Linux (Desktop)

---

## Technologie-Stack

### Frontend
- **Framework:** React 19.0.0
- **Sprache:** TypeScript 5.6.0
- **Build-Tool:** Vite 6.0.0
- **Styling:**
  - Tailwind CSS 3.4.0
  - PostCSS 8.4.32
  - Custom CSS mit CSS-Variablen (Dark/Light Mode)
- **State Management:** Zustand 5.0.0
- **Icons:** Lucide React 0.294.0
- **Utilities:**
  - clsx 2.0.0 (CSS-Klassen-Verwaltung)
  - tailwind-merge 2.2.0
  - @tanstack/react-virtual 3.0.0 (Virtualisierung)

### Backend (Tauri)
- **Framework:** Tauri 2.0
- **Sprache:** Rust (Edition 2021)
- **Datenbank:** SQLite via `rusqlite` 0.32 (bundled)
- **Serialisierung:** Serde 1.0 + serde_json 1.0
- **Plugins:**
  - tauri-plugin-dialog 2.0 (Datei-Dialoge)
  - tauri-plugin-fs 2.0 (Dateisystem-Zugriff)
- **Weitere Bibliotheken:**
  - uuid 1.6 (ID-Generierung)
  - regex 1.10 (Text-Verarbeitung)
  - encoding_rs 0.8 (Encoding-Unterstützung)
  - chrono 0.4 (Zeitstempel)
  - dotext 0.1

### Entwicklung & Testing
- **Testing:** Vitest 1.0.0 + @testing-library/react 14.0.0
- **Linting:** ESLint 8.55.0 + @typescript-eslint
- **Formatting:** Prettier 3.1.1
- **Git Hooks:** Husky 9.1.7 + lint-staged 16.2.7
- **Scripts:** tsx 4.7.0 (TypeScript-Ausführung)
- **Datenbank-Tools:**
  - better-sqlite3 12.6.0 (Node.js SQLite für Scripts)
- **PDF-Verarbeitung:** pdf-parse 1.1.1
- **Word-Verarbeitung:** mammoth 1.8.0

---

## Projektstruktur

```
dnd_nexus-sheet_engine/
├── src/                          # Frontend (React + TypeScript)
│   ├── components/               # React-Komponenten
│   │   ├── character/            # Charakter-spezifische Komponenten
│   │   │   ├── AttributeBlock.tsx
│   │   │   ├── SkillList.tsx
│   │   │   ├── CombatStats.tsx
│   │   │   ├── HPManagement.tsx
│   │   │   ├── EquipmentList.tsx
│   │   │   ├── WeaponsTable.tsx
│   │   │   ├── ArmorTable.tsx
│   │   │   ├── FeatsList.tsx
│   │   │   ├── ModifiersList.tsx
│   │   │   ├── BackgroundAbilityScoreDialog.tsx
│   │   │   ├── ToolChoiceDialog.tsx
│   │   │   ├── StartingEquipmentDialog.tsx
│   │   │   └── ...
│   │   ├── Compendium.tsx        # Kompendium-Hauptkomponente
│   │   ├── CompendiumEditor.tsx  # Homebrew-Editor
│   │   ├── ErrorBoundary.tsx
│   │   ├── NexusLogo.tsx
│   │   └── ui/                   # UI-Komponenten
│   │       └── Button.tsx
│   ├── screens/                  # Hauptbildschirme
│   │   ├── CharacterList.tsx     # Charakter-Liste
│   │   └── CharacterSheet.tsx    # Charakterbogen
│   ├── lib/                      # Geschäftslogik & Utilities
│   │   ├── api.ts                # Tauri Command-Wrapper
│   │   ├── store.ts              # Zustand Store (Charaktere)
│   │   ├── compendiumStore.ts    # Zustand Store (Kompendium)
│   │   ├── themeStore.ts         # Zustand Store (Theme)
│   │   ├── characterLogic.ts     # Charakter-Berechnungen
│   │   ├── traitParser.ts        # Spezies-Merkmale Parser
│   │   ├── types.ts              # TypeScript-Typen
│   │   ├── math.ts               # D&D-spezifische Mathematik
│   │   ├── logger.ts             # Logging-Utilities
│   │   ├── errors.ts             # Fehlerbehandlung
│   │   ├── consoleExporter.ts    # Debug-Export
│   │   ├── PDFExportService.ts   # PDF-Generierung (Frontend)
│   │   ├── uiConstants.ts        # UI-Konstanten
│   │   ├── types/
│   │       ├── weapons.ts
│   │       └── armors.ts
│   ├── main.tsx                  # React Entry Point
│   ├── index.css                 # Globale Styles
│   └── test/
│       └── setup.ts              # Test-Setup
│
├── src-tauri/                    # Backend (Rust + Tauri)
│   ├── src/
│   │   ├── main.rs               # Tauri Entry Point
│   │   ├── menu.rs               # App-Menü
│   │   ├── commands/             # Tauri Commands (API)
│   │   │   ├── mod.rs
│   │   │   ├── character.rs      # Charakter-CRUD
│   │   │   ├── compendium.rs     # Kompendium-Queries
│   │   │   ├── homebrew.rs       # Homebrew-CRUD
│   │   │   ├── settings.rs       # Einstellungen
│   │   │   ├── files.rs          # Datei-Operationen
│   │   │   ├── pdf.rs            # PDF-Export
│   │   │   ├── features.rs       # Klassen-Features
│   │   │   ├── subclasses.rs     # Subklassen
│   │   │   └── logging.rs        # Logging
│   │   ├── db/                   # Datenbank-Layer
│   │   │   ├── mod.rs            # DB-Initialisierung
│   │   │   ├── migrations.rs     # Schema-Migrationen
│   │   │   ├── queries.rs        # SQL-Queries
│   │   │   ├── seed.rs           # Seed-Daten
│   │   │   ├── features.rs       # Feature-Daten
│   │   │   ├── inventory.rs      # Inventar-Management
│   │   │   ├── modifiers.rs      # Modifikatoren-Daten
│   │   │   ├── spells.rs         # Zauber-Daten
│   │   │   ├── stats.rs          # Statistik-Queries
│   │   │   └── validation.rs     # Datenvalidierung
│   │   ├── types/                # Rust-Typen
│   │   │   ├── mod.rs
│   │   │   ├── character.rs
│   │   │   ├── compendium.rs
│   │   │   └── weapons.rs
│   │   ├── core/                 # Kern-Logik
│   │   │   ├── mod.rs
│   │   │   ├── calculator.rs     # Berechnungen
│   │   │   ├── modifiers.rs      # Modifikatoren
│   │   │   ├── types.rs
│   │   │   └── units.rs          # Einheiten-Umrechnung
│   │   ├── tools/                # Utility-Module
│   │   │   ├── mod.rs
│   │   │   └── data_validator.rs
│   │   └── bin/                  # CLI-Tools (Binaries)
│   │       ├── import_all_weapons.rs
│   │       ├── import_all_armors.rs
│   │       ├── import_all_backgrounds.rs
│   │       ├── migrate_weapons_schema.rs
│   │       ├── migrate_armor_schema.rs
│   │       ├── migrate_background_equipment.rs
│   │       └── ...
│   ├── Cargo.toml                # Rust Dependencies
│   ├── tauri.conf.json           # Tauri-Konfiguration
│   ├── build.rs                  # Build-Script
│   └── icons/                    # App-Icons
│
├── scripts/                      # Node.js-Scripts (Datenverarbeitung)
│   ├── release.ts                # Release-Automatisierung
│   ├── maintenance.ts            # Wartungs-Scripts
│   ├── extract-backgrounds-complete.ts
│   ├── migrate-backgrounds.ts
│   ├── validate-backgrounds.ts
│   ├── analyze-*.ts              # Analyse-Scripts
│   └── db-sync.js                # DB-Synchronisation
│
├── docs/                         # Dokumentation
│   ├── *.md                      # Konzepte & Designs
│
├── prompts/                      # AI-Prompts (Dokumentation)
│
├── resources/                    # Ressourcen
│   ├── books/                    # PDF/Word-Dateien
│   └── original_data/            # Original-Datenbanken
│
├── dist/                         # Build-Output (Frontend)
│
├── dnd-nexus.db                  # SQLite-Datenbank (Haupt-DB)
│
├── package.json                  # Node.js Dependencies
├── pnpm-lock.yaml                # Dependency-Lock
├── vite.config.ts                # Vite-Konfiguration
├── tsconfig.json                 # TypeScript-Konfiguration
├── tailwind.config.js            # Tailwind-Konfiguration
├── vitest.config.ts              # Vitest-Konfiguration
└── README.md                     # Projekt-Dokumentation

```

---

## Datenbank-Schema (SQLite)

### Architektur-Prinzipien

1. **Core/Custom Trennung:** Jede Entität hat `core_*` und `custom_*` Tabellen
2. **Override-Mechanismus:** Custom-Einträge können Core-Einträge überschreiben (via `parent_id`)
3. **Views für Unified Access:** `all_*` Views kombinieren Core + Custom mit Source-Markierung
4. **JSON-Felder:** Komplexe, regelbasierte Daten werden als JSON gespeichert

### Haupt-Tabellen

#### Kompendium-Entitäten
- `core_spells` / `custom_spells` - Zauber
- `core_species` / `custom_species` - Spezies
- `core_classes` / `custom_classes` - Klassen
- `core_backgrounds` / `custom_backgrounds` - Hintergründe
- `core_weapons` / `custom_weapons` - Waffen
- `core_armors` / `custom_armors` - Rüstungen
- `core_tools` / `custom_tools` - Werkzeuge
- `core_items` / `custom_items` - Gegenstände
- `core_equipment` / `custom_equipment` - Ausrüstungspakete
- `core_feats` / `custom_feats` - Talente
- `core_skills` - Fertigkeiten (nur Core)
- `core_gear` / `custom_gear` - Ausrüstung (Legacy)
- `core_subclasses` / `custom_subclasses` - Subklassen
- `core_class_features` / `custom_class_features` - Klassen-Features
- `core_feature_options` / `custom_feature_options` - Feature-Optionen
- `core_progression_tables` / `custom_progression_tables` - Aufstiegstabellen
- `feature_prerequisites` - Feature-Voraussetzungen
- `core_mag_items_base` / `custom_mag_items_base` - Magische Gegenstände (Basis)
  - `*_armor`, `*_weapons`, `*_wondrous`, `*_jewelry`, `*_consumables`, `*_focus_items`

#### Mapping-Tabellen
- `weapon_property_mappings` - Waffen ↔ Eigenschaften
- `armor_property_mappings` - Rüstungen ↔ Eigenschaften
- `weapon_properties` - Waffen-Eigenschaften (Referenztabelle)
- `weapon_masteries` - Waffen-Meisterschaften (Referenztabelle)
- `armor_properties` - Rüstungs-Eigenschaften (Referenztabelle)
- `background_starting_equipment` - Hintergrund-Ausrüstung
- `class_starting_equipment` - Klassen-Ausrüstung
- `core_equipment_items` / `custom_equipment_items` - Ausrüstungspaket-Inhalte (Items)
- `core_equipment_tools` / `custom_equipment_tools` - Ausrüstungspaket-Inhalte (Tools)
- `core_mag_item_crafting` / `custom_mag_item_crafting` - Crafting-Rezepte

#### Anwendungs-Daten
- `characters` - Charaktere (JSON-Speicher)
- `character_inventory` - Charakter-Inventar
- `settings` - Einstellungen (Key-Value)

#### Views
- `all_spells`, `all_species`, `all_classes`, `all_weapons`, `all_armors`, etc.
  - Kombinieren Core + Custom
  - Fügen `source`-Feld hinzu ('core', 'homebrew', 'override')

### Datenmodell-Besonderheiten

**JSON-Storage:**
- Komplexe Daten (z.B. Zauber-Beschreibungen, Spezies-Merkmale) werden als JSON in `data`-Feldern gespeichert
- Ermöglicht flexible Schema-Erweiterungen ohne Migrationen

**Foreign Keys:**
- `parent_id` in Custom-Tabellen verweist auf Core-Einträge (Override-Mechanismus)
- `weapon_property_mappings` verweist auf `weapon_properties` und Waffen
- `background_starting_equipment` verweist auf Items/Tools/Weapons

**Indizes:**
- Namen: Für schnelle Suche
- `parent_id`: Für Override-Queries
- `updated_at`: Für Charakter-Synchronisation

---

## State Management (Zustand)

### Stores

1. **`useCharacterStore`** (`src/lib/store.ts`)
   - Aktueller Charakter
   - Charakter-Liste
   - CRUD-Operationen
   - Attribute, Proficiencies, Inventar-Updates

2. **`useCompendiumStore`** (`src/lib/compendiumStore.ts`)
   - Kompendium-Daten (Spells, Species, Classes, etc.)
   - Lazy Loading per Kategorie
   - Caching in Memory

3. **`useThemeStore`** (`src/lib/themeStore.ts`)
   - Dark/Light Mode
   - Persistiert (localStorage)

### API-Layer

**`src/lib/api.ts`**
- Wrapper um Tauri Commands
- `characterApi`: Charakter-CRUD
- `compendiumApi`: Kompendium-Queries
- `homebrewApi`: Homebrew-CRUD
- `settingsApi`: Einstellungen

**Tauri Commands** (`src-tauri/src/commands/`)
- Rust-Funktionen, die von Frontend aufgerufen werden
- Bridge zwischen React und SQLite

---

## Frontend-Architektur

### Routing/Navigation
- **Kein React Router:** Navigation erfolgt über Zustand
- **Haupt-Views:** CharacterList, CharacterSheet, Compendium
- **Sidebar-Navigation:** Wechsel zwischen Charaktere/Kompendium

### Komponenten-Hierarchie

```
App (main.tsx)
├── Sidebar (Navigation)
└── Main Content
    ├── CharacterList (wenn kein Charakter ausgewählt)
    ├── CharacterSheet (wenn Charakter ausgewählt)
    │   ├── CharacterSheetLayout
    │   │   ├── AttributeBlock
    │   │   ├── SkillList
    │   │   ├── CombatStats
    │   │   ├── EquipmentList
    │   │   ├── WeaponsTable
    │   │   ├── ArmorTable
    │   │   ├── FeatsList
    │   │   └── ModifiersList
    │   └── ...
    └── Compendium (wenn Kompendium aktiv)
        ├── Compendium (Liste/Suche)
        └── CompendiumEditor (wenn Edit-Mode)
```

### Styling-System

**Tailwind CSS mit Custom-Theme:**
- CSS-Variablen für Farben (Dark/Light Mode)
- Custom-Utilities für D&D-spezifische Designs
- Responsive (Desktop-optimiert)

**Theme-System:**
- Dark/Light Mode via CSS-Klassen
- Persistiert in `useThemeStore`
- Smooth Transitions

---

## Backend-Architektur (Rust/Tauri)

### Datenbank-Layer

**`src-tauri/src/db/mod.rs`**
- `Database`-Struct mit `Mutex<Connection>`
- `init_database()`: Initialisierung & Migrationen
- Thread-safe Zugriff

**`src-tauri/src/db/migrations.rs`**
- Schema-Definitionen (SQL)
- Views für Unified Access
- Trigger für Datenvalidierung

**`src-tauri/src/db/queries.rs`**
- Prepared Statements
- Query-Helper-Funktionen

### Command-Layer

**Tauri Commands** (`src-tauri/src/commands/`)
- `#[tauri::command]`-Annotationen
- Serialisierung via Serde
- Fehlerbehandlung via `Result<T, String>`

**Command-Kategorien:**
- `character.rs`: Charakter-CRUD
- `compendium.rs`: Kompendium-Queries (Lesen)
- `homebrew.rs`: Homebrew-CRUD (Schreiben)
- `settings.rs`: Einstellungen
- `files.rs`: Datei-Import/Export
- `pdf.rs`: PDF-Generierung

### Kern-Logik

**`src-tauri/src/core/`**
- `calculator.rs`: D&D-Berechnungen (AC, Modifier, etc.)
- `modifiers.rs`: Modifikatoren-Logik
- `units.rs`: Einheiten-Umrechnung (metrisch/imperial)

---

## Build & Deployment

### Frontend-Build
```bash
pnpm build  # TypeScript-Compilation + Vite-Build → dist/
```

### Tauri-Build
```bash
pnpm tauri:build  # Rust-Compilation + Frontend-Bundle → src-tauri/target/release/
```

### Release-Prozess
- **Script:** `scripts/release.ts`
- **Versionierung:** Semantic Versioning (1.6.1)
- **Bundles:** MSI/NSIS (Windows), App (macOS), AppImage (Linux)

### Performance-Optimierungen (Rust)
- **Release-Profile:**
  - `opt-level = "s"` (Größen-Optimierung)
  - `lto = true` (Link Time Optimization)
  - `strip = true` (Debug-Symbole entfernen)
  - `panic = "abort"` (Kleinere Binary)

---

## Entwicklungs-Workflow

### Scripts (package.json)

**Entwicklung:**
- `pnpm dev`: Frontend-Dev-Server (Vite)
- `pnpm tauri:dev`: Tauri Dev-Mode (Hot Reload)

**Testing:**
- `pnpm test`: Vitest Unit-Tests
- `pnpm test:ui`: Vitest UI
- `pnpm test:coverage`: Coverage-Report

**Code-Qualität:**
- `pnpm lint`: ESLint
- `pnpm format`: Prettier
- `pnpm typecheck`: TypeScript-Check

**Datenbank:**
- `pnpm extract:backgrounds`: Background-Extraktion
- `pnpm migrate:backgrounds`: Background-Migration
- `pnpm validate:backgrounds`: Background-Validierung

### Git Hooks (Husky)
- Pre-commit: `lint-staged` (ESLint + Prettier)

---

## Datenfluss

### Charakter-Laden
```
React Component
  → useCharacterStore.loadCharacter(id)
    → characterApi.get(id)
      → Tauri Command: get_character(id)
        → db::queries::get_character(id)
          → SQLite Query
            → JSON Deserialisierung
              → Character-Objekt
                → Zustand Store
                  → React Re-Render
```

### Charakter-Speichern
```
React Component
  → useCharacterStore.saveCharacter()
    → characterApi.update(id, data)
      → Tauri Command: update_character(id, data)
        → JSON Serialisierung
          → db::queries::update_character(id, json)
            → SQLite UPDATE
              → Erfolg/Fehler
                → Zustand Store Update
```

---

## Besonderheiten

### Homebrew-System
- **Override-Mechanismus:** Custom-Einträge können Core-Einträge überschreiben
- **Quellen-Markierung:** `source`-Feld ('core', 'homebrew', 'override')
- **Editor:** `CompendiumEditor.tsx` für JSON-Bearbeitung

### Charakter-Berechnungen
- **Automatische AC:** Basierend auf Rüstung + Modifikatoren
- **Modifikatoren-System:** Override/Add/Multiply-Typen
- **Proficiencies:** Skills, Tools, Languages, Weapons, Armor

### Datenimport
- **PDF-Parser:** `pdf-parse` für Regelwerk-Extraktion
- **Word-Parser:** `mammoth` für .docx-Dateien
- **Binaries:** Rust-Scripts für Bulk-Importe (`src-tauri/src/bin/`)

---

## Abhängigkeiten-Übersicht

### Frontend (Produktiv)
- React 19.0.0
- Zustand 5.0.0
- Tailwind CSS 3.4.0
- Lucide React 0.294.0
- @tanstack/react-virtual 3.0.0

### Backend (Rust)
- Tauri 2.0
- rusqlite 0.32 (SQLite)
- Serde 1.0 (Serialisierung)
- uuid 1.6
- regex 1.10

### Development
- TypeScript 5.6.0
- Vite 6.0.0
- Vitest 1.0.0
- ESLint + Prettier
- Husky + lint-staged

---

## Konfigurationsdateien

- `package.json`: Node.js Dependencies & Scripts
- `Cargo.toml`: Rust Dependencies
- `vite.config.ts`: Vite-Konfiguration (Aliases, Port, etc.)
- `tsconfig.json`: TypeScript-Kompilierungs-Optionen
- `tailwind.config.js`: Tailwind-Theme & Utilities
- `tauri.conf.json`: Tauri-App-Konfiguration (Fenster, Bundle, etc.)

---

*Letzte Aktualisierung: 2026-01-12*
