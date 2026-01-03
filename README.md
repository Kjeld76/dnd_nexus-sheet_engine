# D&D Nexus

D&D Nexus ist eine Desktop-Anwendung zur Verwaltung von Charakterbögen für Dungeons & Dragons 5e (Regelwerk 2024). Die Software basiert auf Tauri 2.0 und kombiniert ein React-Frontend mit einem Rust-Backend und lokaler SQLite-Datenspeicherung.

## Funktionsumfang

* **Charakter-Management**: Verwaltung von Charakteren gemäß den 5e 2024 Regeln, einschließlich Attributsberechnungen, Fertigkeiten und Fortschrittssystem.
* **Kompendium**: Durchsuchbare Datenbank für Zauber, Spezies, Klassen, Gegenstände und Talente (Feats).
* **PHB-Datenimport**: Integriertes Tool zum Extrahieren und Strukturieren von Daten aus offiziellen Regelwerken (unterstützt DOCX und PDF).
* **Homebrew-System**: Möglichkeit zur Erstellung und Einbindung eigener Inhalte (Zauber, Items etc.), die die Core-Datenbank erweitern oder überschreiben können.
* **Datenmodell**: Kombination aus festem Schema für Meta-Daten und flexiblen JSON-Strukturen für entities-spezifische Daten.

## Technischer Stack

### Frontend
* Framework: React 19
* Build-Tool: Vite
* Sprache: TypeScript 5.6
* State-Management: Zustand
* Styling: Tailwind CSS
* UI-Komponenten: Lucide React (Icons), @tanstack/react-virtual (Virtualisierung für große Listen)

### Backend
* Framework: Tauri 2.0 (IPC-Bridge zwischen Rust und Webview)
* Sprache: Rust
* Datenbank: SQLite (via rusqlite mit Prepared Statements)
* Serialisierung: Serde / Serde-JSON
* Daten-Integrität: UUID (v4) für alle Primärschlüssel

## Systemvoraussetzungen

* Node.js 20+
* Rust Stable (rustc & cargo)
* pnpm (Package Manager)
* Betriebssystem-spezifische Abhängigkeiten für Tauri (WebView2 unter Windows)

## Entwicklung und Installation

1. **Repository klonen**
   ```bash
   git clone https://github.com/Kjeld76/dnd_nexus-sheet_engine.git
   cd dnd_nexus-sheet_engine
   ```

2. **Abhängigkeiten installieren**
   ```bash
   pnpm install
   ```

3. **Entwicklungsmodus starten**
   ```bash
   pnpm tauri dev
   ```

4. **Produktions-Build erstellen**
   ```bash
   pnpm tauri build
   ```

## Datenbank-Struktur

Die Anwendung nutzt ein duales Tabellen-System in SQLite:
* **core_*-Tabellen**: Schreibgeschützte Tabellen für offizielle Regelwerksdaten.
* **custom_*-Tabellen**: Benutzerspezifische Daten und Overrides.
* **Views**: SQL-Views (z.B. `all_spells`) führen Core- und Custom-Daten zusammen und regeln die Priorisierung von Homebrew-Inhalten.

## Parser

Das Projekt enthält im Verzeichnis `tools/parser/` ein spezialisiertes Tool zur Datenextraktion. Dieses verarbeitet Rohdaten aus DOCX- oder PDF-Dateien und wandelt sie in das für die Anwendung benötigte JSON-Format um, um eine schnelle Befüllung des Kompendiums zu ermöglichen.

## Lizenz und Disclaimer

D&D Nexus ist ein Fan-Projekt. Dungeons & Dragons, PHB und zugehörige Inhalte sind Marken von Wizards of the Coast LLC.
