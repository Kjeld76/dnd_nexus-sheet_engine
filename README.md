# D&D Nexus (v1.4.4)

## 📖 Dokumentation & Wiki
Alle technischen Details, die Datenbank-Struktur und Architektur-Entscheidungen findest du in unserem **[Online-Wiki](https://github.com/Kjeld76/dnd_nexus-sheet_engine/wiki)** oder lokal im Ordner `wiki/`.

## 📦 Releases & Versionierung
Die App nutzt ein vollautomatisiertes System zur Versionierung und Qualitätssicherung. Details findest du im [Release & Maintenance Guide](RELEASE_GUIDE.md).

### Automatisierter Workflow
1.  **Entwicklung**: Code schreiben.
2.  **Commit**: Lokale Prüfung durch Husky & lint-staged.
3.  **Release/Maintenance**: `pnpm maintenance patch "Nachricht"`.
    *   Führt Tests & Linting aus.
    *   Archiviert alte Logs.
    *   Erhöht die Version in allen Dateien (inkl. Wiki & README).
    *   Pusht Code und Wiki-Updates zu GitHub.
    *   GitHub Actions baut automatisch den Installer (`.msi`).

D&D Nexus ist eine Desktop-Anwendung zur Verwaltung von Charakterbögen für Dungeons & Dragons 5e (Regelwerk 2024).

## Funktionsumfang (v1.4.5)

* **Charakter-Management**: Verwaltung von Charakteren gemäß den 5e 2024 Regeln, einschließlich Attributsberechnungen, Fertigkeiten und Fortschrittssystem.
* **Kompendium & Editor**: 
    * Durchsuchbare Datenbank für Zauber, Spezies, Klassen, Gegenstände und Talente.
    * **Neu:** Integrierter Editor zum Bearbeiten bestehender Core-Daten (als Override) und Erstellen komplett neuer Homebrew-Inhalte.
    * Unterstützung für detaillierte Zauber-Attribute (Materialkomponenten, Klassen-Zuweisung, etc.).
    * **JSON-Modus**: Fortgeschrittene Bearbeitung der Rohdaten direkt im Editor möglich.
* **Homebrew-System**: Nahtlose Integration von eigenen Inhalten, die Core-Daten überschreiben oder ergänzen, ohne die Originaldaten zu löschen.
* **PHB-Datenimport**: Spezialisiertes Tooling zum Extrahieren von Daten aus offiziellen PDFs/DOCX.
* **Optimiertes UI**: Modernes, dunkles Design mit verbessertem Layout für maximale Übersichtlichkeit und Lesbarkeit der Statistiken.

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
   
   **Wichtig:** Falls der `wiki/` Ordner leer ist, initialisiere die Submodule:
   ```bash
   git submodule update --init --recursive
   ```
   
   Oder klone direkt mit Submodulen (empfohlen):
   ```bash
   git clone --recurse-submodules https://github.com/Kjeld76/dnd_nexus-sheet_engine.git
   ```
   
   **Nach einem `git pull`:** Falls das Wiki leer ist, führe aus:
   ```bash
   git submodule update --init --recursive
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
