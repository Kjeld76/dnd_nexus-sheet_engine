# D&D Nexus - Projektzusammenfassung

## Projektübersicht

**D&D Nexus** ist eine moderne Desktop-Anwendung zur Verwaltung von D&D 5e (2024) Charakteren. Die App basiert auf einer **Tauri-Architektur** mit React Frontend und Rust Backend.

**Version:** 1.7.16  
**Plattform:** Windows, macOS, Linux (Desktop)  
**Sprache:** Deutsch

---

## Technologie-Stack

### Frontend
- **React 19.0.0** + **TypeScript 5.6.0**
- **Vite 6.0.0** (Build-Tool)
- **Tailwind CSS 3.4.0** (Styling mit Dark/Light Theme)
- **Zustand 5.0.0** (State Management)
- **Lucide React 0.294.0** (Icons)
- **@tanstack/react-virtual 3.0.0** (Virtualisierung)

### Backend (Tauri/Rust)
- **Tauri 2.0** (Desktop-Framework)
- **SQLite** via `rusqlite 0.32` (bundled)
- **Serde 1.0** (JSON Serialisierung)
- **Plugins:** Dialog, Filesystem
- **Weitere:** uuid, regex, encoding_rs, chrono, dotext

### Entwicklung & Testing
- **Vitest 1.0.0** + **@testing-library/react** (Testing)
- **ESLint 8.55.0** + **@typescript-eslint** (Linting)
- **Prettier 3.1.1** (Formatting)
- **Husky 9.1.7** + **lint-staged** (Git Hooks)
- **tsx 4.7.0** (TypeScript Scripts)
- **better-sqlite3** (Node.js SQLite für Scripts)

---

## Architektur

### Frontend-Struktur (`src/`)

#### Hauptkomponenten
- **`main.tsx`** – App-Entry Point, Sidebar-Navigation, Theme-Switch
- **`screens/`**:
  - `CharacterList.tsx` – Charakter-Übersicht/Liste
  - `CharacterSheet.tsx` – Charakterbogen (Hauptansicht)
- **`components/`**:
  - `Compendium.tsx` – Kompendium-Hauptansicht
  - `CompendiumEditor.tsx` – Homebrew-Editor (JSON + Formular)
  - `character/` – Charakter-spezifische Komponenten:
    - `AttributeBlock.tsx` – Attribute & Rettungswürfe
    - `SkillList.tsx` – Fertigkeiten
    - `CombatStats.tsx` – Kampf-Statistiken
    - `HPManagement.tsx` – Lebenspunkte-Verwaltung
    - `EquipmentList.tsx` – Inventar
    - `WeaponsTable.tsx` – Waffen-Tabelle
    - `ArmorTable.tsx` – Rüstungen-Tabelle
    - `FeatsList.tsx` – Talente
    - `ModifiersList.tsx` – Modifikatoren
    - `BackgroundAbilityScoreDialog.tsx` – Hintergrund-Attributsdialog
    - `ToolChoiceDialog.tsx` – Werkzeug-Auswahl
    - `StartingEquipmentDialog.tsx` – Start-Ausrüstung
  - `ui/` – UI-Komponenten (Button, etc.)

#### State Management (`lib/`)
- **`store.ts`** – Charakter-Store (CRUD, aktueller Charakter)
- **`compendiumStore.ts`** – Kompendium-Daten (lazy loading per Kategorie)
- **`themeStore.ts`** – Theme-Management (persistiert in localStorage)
- **`api.ts`** – Tauri-Command-Wrapper
- **`characterLogic.ts`** – Charakter-Berechnungen
- **`traitParser.ts`** – Spezies-Merkmale Parser
- **`types.ts`** – TypeScript-Typen
- **`math.ts`** – D&D-spezifische Mathematik

### Backend-Struktur (`src-tauri/src/`)

#### Datenbank-Layer (`db/`)
- **`mod.rs`** – DB-Initialisierung (Mutex<Connection>)
- **`migrations.rs`** – Schema-Definitionen (SQL, Views, Trigger)
- **`queries.rs`** – SQL-Queries (Prepared Statements)
- **`seed.rs`** – Seed-Daten

#### Commands (`commands/`)
- **`character.rs`** – Charakter-CRUD (create, get, update, delete, list)
- **`compendium.rs`** – Kompendium-Queries (get_all_spells, get_all_species, etc.)
- **`homebrew.rs`** – Homebrew-CRUD (create, update, delete custom entries)
- **`files.rs`** – Datei-Import/Export (JSON, PDF)
- **`pdf.rs`** – PDF-Generierung
- **`settings.rs`** – Einstellungen
- **`logging.rs`** – Logging

#### Kern-Logik (`core/`)
- **`calculator.rs`** – D&D-Berechnungen (AC, Modifier, etc.)
- **`modifiers.rs`** – Modifikatoren-Logik
- **`units.rs`** – Einheiten-Umrechnung (metrisch/imperial)
- **`types.rs`** – Rust-Typen

#### Tools (`tools/`)
- **`data_validator.rs`** – Datenvalidierung

#### Binaries (`bin/`)
Rust CLI-Tools für Datenverarbeitung:
- `import_all_weapons.rs`
- `import_all_armors.rs`
- `import_all_backgrounds.rs`
- `import_class_data.rs`
- `migrate_*.rs` (Schema-Migrationen)
- `test_*.rs` (Test-Scripts)

---

## Datenbank-Schema

### Architektur-Prinzipien

1. **Core/Custom Trennung**: Jede Entität hat `core_*` und `custom_*` Tabellen
2. **Override-Mechanismus**: Custom-Einträge können Core-Einträge überschreiben (via `parent_id`)
3. **Views für Unified Access**: `all_*` Views kombinieren Core + Custom mit Source-Markierung
4. **JSON-Felder**: Komplexe, regelbasierte Daten werden als JSON gespeichert

### Haupt-Tabellen

#### Kompendium-Entitäten
- `core_spells` / `custom_spells` – Zauber
- `core_species` / `custom_species` – Spezies
- `core_classes` / `custom_classes` – Klassen
- `core_backgrounds` / `custom_backgrounds` – Hintergründe
- `core_weapons` / `custom_weapons` – Waffen
- `core_armors` / `custom_armors` – Rüstungen
- `core_tools` / `custom_tools` – Werkzeuge
- `core_items` / `custom_items` – Gegenstände
- `core_equipment` / `custom_equipment` – Ausrüstungspakete
- `core_feats` / `custom_feats` – Talente
- `core_skills` – Fertigkeiten (nur Core)

#### Mapping-Tabellen
- `weapon_property_mappings` – Waffen ↔ Eigenschaften
- `armor_property_mappings` – Rüstungen ↔ Eigenschaften
- `weapon_properties` – Waffen-Eigenschaften (Referenztabelle)
- `weapon_masteries` – Waffen-Meisterschaften (Referenztabelle)
- `armor_properties` – Rüstungs-Eigenschaften (Referenztabelle)
- `background_starting_equipment` – Hintergrund-Ausrüstung

#### Anwendungs-Daten
- `characters` – Charaktere (JSON-Speicher in `data`-Feld)
- `settings` – Einstellungen (Key-Value)

#### Views
- `all_spells`, `all_species`, `all_classes`, `all_weapons`, `all_armors`, etc.
  - Kombinieren Core + Custom
  - Fügen `source`-Feld hinzu ('core', 'homebrew', 'override')

### Datenmodell-Besonderheiten

**JSON-Storage:**
- Charaktere werden vollständig als JSON in `characters.data` gespeichert
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

## Hauptfunktionen

### Charakterverwaltung

#### Charakter-Erstellung und -Verwaltung
- **Charakter-Erstellung**: Schnelle Erstellung neuer Charaktere mit Vorlagen
- **Charakter-Listen**: Übersicht aller erstellten Charaktere
- **Charakter-Details**: Vollständige Charakterbögen mit allen relevanten Informationen
- **Tab-Navigation**: Einfaches Wechseln zwischen Kampf, Zauber, Inventar und Notizen
- **Charakter-Speicherung**: Automatische Speicherung aller Charakterdaten in lokaler Datenbank

#### Attribute und Rettungswürfe
- **6 Grundattribute**: Stärke, Geschick, Konstitution, Intelligenz, Weisheit, Charisma
- **Attributswerte**: Direkte Eingabe von Attributswerten (1-30)
- **Automatische Modifikatoren**: Berechnung der Attributsmodifikatoren (+/-)
- **Rettungswürfe**: Anzeige von Vorteilen bei Rettungswürfen basierend auf Spezies-Merkmalen
- **Proficiencies**: Markierung von Proficiencies für Rettungswürfe

#### Fertigkeiten (Skills)
- **18 Fertigkeiten**: Alle Standard-Fertigkeiten aus D&D 5e
- **Proficiencies**: Markierung von Fertigkeiten mit Proficiency oder Expertise
- **Automatische Berechnung**: Gesamtbonus basierend auf Attribut, Proficiency und Modifikatoren
- **Spezies-Modifikatoren**: Anzeige von Vorteilen bei Fertigkeiten basierend auf Spezies-Merkmalen

#### Spezies (Species)
- **Spezies-Auswahl**: Auswahl aus verfügbaren Spezies (PHB 2024)
- **Automatische Anwendung**: 
  - Geschwindigkeit (Bewegungsrate) - wird automatisch auf Charakterbogen übernommen
  - Größenkategorie - wird angezeigt und berücksichtigt
  - Sprachen (automatisches Hinzufügen von Sprachen zur Proficiencies-Liste)
  - Attribute (wenn vorhanden, z.B. bei Homebrew-Spezies)
- **Spezies-Merkmale (Traits)**: 
  - Vollständige Anzeige aller Merkmale mit Beschreibungen
  - Automatische Erkennung mechanischer Effekte aus Beschreibungen
  - Vorteile bei Rettungswürfen: Automatische Erkennung und Anzeige als Badge
  - Vorteile bei Fertigkeiten: Automatische Erkennung und Anzeige als "V"-Badge
  - Visuelle Anzeige: Badges direkt auf Attributs- und Fertigkeits-Bereichen
- **Choice-basierte Attribute**: 
  - Dialog für Spezies mit wählbaren Attributssteigerungen
  - Flexible Zuteilung von Attributspunkten nach Spielerpräferenz

#### Klassen (Classes)
- **Klassen-Auswahl**: Auswahl aus verfügbaren Klassen
- **Unterklassen**: Unterstützung für Klassen mit Unterklassen

#### Hintergründe (Backgrounds)
- **Hintergrund-Auswahl**: Auswahl aus verfügbaren Hintergründen (PHB 2024)
- **Automatische Anwendung**:
  - **Attributswerte**: Dialog zur Auswahl zwischen +2/+1 oder +1/+1/+1
  - **Werkzeug-Auswahl**: Dialog zur Auswahl eines Werkzeugs (falls wählbar)
  - **Starting Equipment**: Dialog zur Auswahl zwischen Option A oder B (falls vorhanden)
  - **Herkunftstalent (Feat)**: Automatisches Hinzufügen des Hintergrund-Feats
  - **Fertigkeiten**: Automatisches Hinzufügen von zwei Fertigkeiten zur Proficiencies-Liste
- **Hintergrund-Wechsel**: 
  - Automatisches Entfernen aller alten Hintergrund-Boni beim Wechsel
  - "Clean-First" Prinzip sorgt für stabile Dialog-Sequenzen beim Wechsel
- **Persistent Tracking**: Rust-Backend speichert den Fortschritt der Hintergrund-Anwendung dauerhaft

#### Kampf-Statistiken
- **Rüstungsklasse (AC)**: Automatische Berechnung basierend auf Rüstung
- **Initiative**: Basierend auf Geschick
- **Geschwindigkeit**: Basierend auf Spezies
- **Lebenspunkte (HP)**: 
  - Aktuelle HP
  - Maximale HP
  - Temporäre HP
  - Hit Dice (Verwendet/Verfügbar)
  - Todesrettungen (Erfolge/Fehlschläge)

#### Modifikatoren (Modifiers)
- **Manuelle Modifikatoren**: Hinzufügen von benutzerdefinierten Modifikatoren
- **Quellenverfolgung**: Jeder Modifikator hat eine Quelle (z.B. "Magischer Gegenstand", "Zauber", etc.)
- **Modifikator-Typen**: 
  - Override: Ersetzt den Basiswert
  - Add: Addiert zum Basiswert
  - Multiply: Multipliziert den Basiswert
- **Zielgruppierung**: Modifikatoren werden nach Ziel (Attribut, Fertigkeit, etc.) gruppiert angezeigt
- **Bedingte Modifikatoren**: Optional: Modifikatoren können Bedingungen haben
- **Entfernen**: Möglichkeit, Modifikatoren zu entfernen

#### Inventar
- **Gegenstände**: Verwaltung von Ausrüstung und Gegenständen aus dem Kompendium
- **Waffen**: 
  - Verwaltung von Waffen (wird aus Kompendium geladen)
  - Waffenstatistiken (Schaden, Eigenschaften, etc.)
- **Rüstungen**: 
  - Verwaltung von Rüstungen (wird aus Kompendium geladen)
  - Automatische Berechnung der Rüstungsklasse (AC)
- **Werkzeuge**: 
  - Eigener Bereich: Dedizierte Liste für Werkzeuge im Inventar
  - 39 Werkzeuge aus PHB 2024 (Handwerkszeug, Anderes Werkzeug)
  - Varianten-Support: Musikinstrumente (10 Varianten) und Spielsets (4 Varianten)
  - Vollständige Informationen: Attribut, Verwenden-Aktionen, Herstellen-Listen
  - Automatisches Hinzufügen bei Background-Auswahl
- **Gewichtsberechnung**: 
  - Automatisches Gesamtgewicht (Körper + Rucksack + Werkzeuge + Ausrüstung)
  - Info-Tooltip: Detaillierte Aufschlüsselung der berechneten Bereiche via Hover-Icon
- **Währungs-Management**: Gold, Silber, Kupfer mit automatischem Tracking für Hintergrund-Boni

### Kompendium

#### Verfügbare Kategorien
- **Zauber (Spells)**: Vollständige Zauberliste mit allen Details
- **Klassen (Classes)**: Alle Klassen mit Unterklassen
- **Spezies (Species)**: Alle Spezies mit Merkmalen
- **Waffen (Weapons)**: Waffenstatistiken und Eigenschaften
- **Rüstungen (Armor)**: Rüstungsstatistiken und Eigenschaften
- **Werkzeuge (Tools)**: Werkzeuginformationen
- **Gegenstände (Items)**: Verschiedene Gegenstände und Ausrüstung
- **Ausrüstungspakete (Equipment)**: Vorgefertigte Ausrüstungspakete (z.B. Entdeckerausrüstung)
- **Talente (Feats)**: Alle verfügbaren Talente
- **Fertigkeiten (Skills)**: Fertigkeitsinformationen
- **Hintergründe (Backgrounds)**: Vollständige Hintergrund-Informationen

#### Kompendium-Features
- **Suche**: Durchsuchbares Kompendium mit Echtzeit-Filterung über alle Kategorien
- **Detaillierte Ansicht**: Vollständige Informationen zu jedem Eintrag
  - Beschreibungen und Flavor-Text
  - Mechanische Eigenschaften (Level, Schule, Zeitaufwand, Reichweite, etc.)
  - Statistiken (Schaden, AC, Gewicht, Kosten, etc.)
  - Quellenangaben (PHB 2024, Core, Homebrew, Override)
- **Quellen-Markierung**: 
  - Klare visuelle Kennzeichnung von Core-Content vs. Homebrew vs. Override
  - Badges zur schnellen Identifikation der Quelle

### Homebrew & Custom Content

#### Editor
- **Vollständiger Editor**: Erstellen und Bearbeiten von eigenen Inhalten
- **Unterstützte Typen**:
  - Zauber: Vollständige Zaubererstellung mit allen Eigenschaften
  - Klassen: Erstellen von Custom-Klassen mit Features
  - Spezies: Erstellen von Custom-Spezies mit Merkmalen
  - Waffen: Erstellen von Custom-Waffen mit Statistiken
  - Rüstungen: Erstellen von Custom-Rüstungen mit AC und Eigenschaften
  - Werkzeuge: Erstellen von Custom-Werkzeugen
  - Ausrüstung: Erstellen von Custom-Ausrüstungsgegenständen
- **Formular-Editor**: Benutzerfreundliches Formular für die meisten Felder
- **JSON-Editor**: 
  - Direkter Zugriff auf JSON-Daten für erweiterte Bearbeitung
  - Vollständige Kontrolle über alle Datenfelder
  - Copy-to-Clipboard Funktion für einfachen Datenaustausch
- **Quellenverwaltung**: 
  - Markierung als Core (PHB) oder Homebrew/Custom
  - Override-Funktion: Überschreiben von Core-Inhalten mit angepassten Versionen
  - Parent-Referenzen: Verknüpfung mit ursprünglichen Core-Einträgen

#### Datenmanagement
- **Lokale Datenbank**: Alle Daten werden lokal in SQLite-Datenbank gespeichert
- **Persistenz**: Homebrew-Inhalte bleiben nach Neustart erhalten
- **Bearbeitung**: Vollständige Bearbeitung eigener Inhalte (Name, Eigenschaften, etc.)
- **Löschen**: Möglichkeit, eigene Inhalte zu löschen (Core-Inhalte sind geschützt)
- **Datenintegrität**: Automatische Validierung und Fehlerbehandlung

### Import & Export

#### Charakter-Import/Export
- **Charakter exportieren**: Export einzelner Charaktere als JSON-Datei
- **Charakter importieren**: Import von Charakteren aus JSON-Dateien
- **Datenübertragung**: Einfacher Austausch von Charakteren zwischen Installationen

#### PDF-Export
- **Charakterbogen als PDF**: Export des vollständigen Charakterbogens als PDF-Datei
- **PHB 2024 Layout**: Formatierung entsprechend dem offiziellen Charakterbogen-Layout

#### Backup & Wiederherstellung
- **Datenbank-Backup**: Erstellen von Sicherungskopien der gesamten Datenbank
- **Datenwiederherstellung**: Wiederherstellung von Daten aus Backup-Dateien

### Einstellungen & Anpassungen

#### Anwendungseinstellungen
- **Theme**: Wechsel zwischen hellem und dunklem Design
- **Metrische/Empirische Einheiten**: Umstellung zwischen metrischen und imperialen Maßeinheiten
- **Persistente Einstellungen**: Alle Einstellungen werden gespeichert und bleiben erhalten

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
- **Kein React Router**: Navigation erfolgt über Zustand
- **Haupt-Views**: CharacterList, CharacterSheet, Compendium
- **Sidebar-Navigation**: Wechsel zwischen Charaktere/Kompendium

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

### Kompendium-Daten laden
```
React Component
  → useCompendiumStore.fetchSpells()
    → compendiumApi.getSpells()
      → Tauri Command: get_all_spells()
        → db::queries::get_all_spells()
          → SQLite Query auf all_spells View
            → Serde Deserialisierung
              → Vec<Spell>
                → Zustand Store
                  → React Re-Render
```

---

## Design-System

### Theme-System
- **CSS-Variablen (HSL)** für Tokens
- **Theme-Klasse** auf `<html>` (`light`/`dark`)
- **Tailwind-Mapping** via `hsl(var(--token) / <alpha-value>)`
- **Smooth Transitions** für Theme-Wechsel

### Design-Patterns
- **Glassmorphism** (`.glass-panel`)
- **Dark-only Glow-Effekte** (Magie-Ästhetik)
- **Custom Scrollbar-Design**
- **Serif-Fonts** für Headlines (Cinzel, Playfair), **Sans** für UI (Inter)

### Token-System
- **Single Source of Truth**: Design-Tokens als CSS-Variablen in `src/index.css`
- **Semantische Tokens**: `background`, `foreground`, `card`, `muted`, `primary`, `accent`, etc.
- **Alpha-Mechanik**: Unterstützung für Transparenz via `/ <alpha-value>`

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
- **Versionierung:** Semantic Versioning (1.7.16)
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
- `pnpm verify:classes`: Klassen-Features-Verifikation
- `pnpm extract:magic-items`: Magic Items Extraktion

### Git Hooks (Husky)
- Pre-commit: `lint-staged` (ESLint + Prettier)

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

### Offline-First
- **Vollständig offline:** Keine Cloud-Abhängigkeit
- **Lokale Datenbank:** SQLite für alle Daten
- **Keine Internet-Verbindung erforderlich**

---

## Projektverzeichnis-Struktur

```
dnd_nexus-sheet_engine/
├── src/                          # Frontend (React + TypeScript)
│   ├── components/               # React-Komponenten
│   │   ├── character/            # Charakter-Komponenten
│   │   ├── compendium/           # Kompendium-Utils
│   │   ├── Compendium.tsx        # Kompendium-Hauptkomponente
│   │   ├── CompendiumEditor.tsx  # Homebrew-Editor
│   │   └── ui/                   # UI-Komponenten
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
│   │   └── types.ts              # TypeScript-Typen
│   ├── main.tsx                  # React Entry Point
│   └── index.css                 # Globale Styles
│
├── src-tauri/                    # Backend (Rust + Tauri)
│   ├── src/
│   │   ├── main.rs               # Tauri Entry Point
│   │   ├── commands/             # Tauri Commands (API)
│   │   ├── db/                   # Datenbank-Layer
│   │   ├── types/                # Rust-Typen
│   │   ├── core/                 # Kern-Logik
│   │   ├── tools/                # Utility-Module
│   │   └── bin/                  # CLI-Tools (Binaries)
│   ├── Cargo.toml                # Rust Dependencies
│   └── tauri.conf.json           # Tauri-Konfiguration
│
├── scripts/                      # Node.js-Scripts (Datenverarbeitung)
│   ├── release.ts                # Release-Automatisierung
│   ├── maintenance.ts            # Wartungs-Scripts
│   └── *.ts                      # Weitere Scripts
│
├── docs/                         # Dokumentation
├── resources/                    # Ressourcen (PDFs, etc.)
├── dnd-nexus.db                  # SQLite-Datenbank (Haupt-DB)
├── package.json                  # Node.js Dependencies
└── README.md                     # Projekt-Dokumentation
```

---

## Zusammenfassung

**D&D Nexus** ist eine vollständige, moderne Desktop-Anwendung für die Verwaltung von D&D 5e (2024) Charakteren. Die App kombiniert:

- **Robuste Architektur**: Tauri (Rust + React) für Performance und Sicherheit
- **Vollständige Charakterverwaltung**: Alle Aspekte von D&D 5e Charakteren
- **Umfangreiches Kompendium**: Alle PHB 2024 Inhalte durchsuchbar
- **Homebrew-System**: Erstellen und Verwalten eigener Inhalte
- **Offline-First**: Keine Internet-Verbindung erforderlich
- **Moderne UI**: Dark/Light Mode, Glassmorphism, responsive Design

Die App richtet sich sowohl an Spieler (Charakterverwaltung) als auch an Game Master (Kompendium-Verwaltung, Homebrew-Content).

---

*Letzte Aktualisierung: 2026-01-17*
