# D&D Nexus

D&D Nexus ist ein moderner Charakterbogen-Generator für **Dungeons & Dragons 5e (Version 2024)**. Die Anwendung ist als Desktop-App konzipiert und bietet eine nahtlose Integration von Regelwerksdaten, Homebrew-Inhalten und einer intuitiven Benutzeroberfläche.

## 🚀 Features

- **Charakter-Management:** Erstellen, Bearbeiten und Verwalten von D&D 5e Charakteren nach den neuesten 2024er Regeln.
- **Integriertes Kompendium:** Vollständiger Zugriff auf Zauber, Spezies, Klassen, Gegenstände und Talente (Feats).
- **PHB-Import:** Automatischer Import von Daten aus dem Spielerhandbuch (PDF/DOCX) über einen integrierten Parser.
- **Homebrew-Unterstützung:** Einfaches Hinzufügen eigener Inhalte, die sich nahtlos in die bestehenden Datenbanken integrieren.
- **Offline-First:** Alle Daten werden lokal in einer SQLite-Datenbank gespeichert.
- **Modernes UI:** Gebaut mit React 19 und Tailwind CSS für ein flüssiges und ansprechendes Erlebnis.
- **PDF-Export:** Generierung von druckfertigen Charakterbögen.

## 🛠 Tech Stack

### Frontend
- **Framework:** React 19 + Vite
- **Sprache:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Icons:** Lucide React

### Backend
- **Framework:** Tauri 2.0 (Desktop-Bridge)
- **Sprache:** Rust
- **Datenbank:** SQLite (via `rusqlite`)

## 📋 Voraussetzungen

Um das Projekt lokal zu entwickeln, benötigst du:

- **Node.js:** Version 20 oder höher
- **Rust:** Aktuelle Stable-Version (`rustc` & `cargo`)
- **pnpm:** Als Package Manager
- **Tauri-Abhängigkeiten:** Siehe [Tauri Setup Guide](https://tauri.app/v1/guides/getting-started/prerequisites)

## 🛠 Installation & Entwicklung

1. **Repository klonen:**
   ```bash
   git clone https://github.com/Kjeld76/dnd_nexus-sheet_engine.git
   cd dnd_nexus-sheet_engine
   ```

2. **Abhängigkeiten installieren:**
   ```bash
   pnpm install
   ```

3. **Entwicklungsmodus starten:**
   ```bash
   pnpm tauri dev
   ```

4. **Daten importieren:**
   Nach dem ersten Start kannst du über das Kompendium-Menü die PHB-Daten (Spielerhandbuch 2024) importieren, sofern die entsprechenden Dokumente im Projektordner liegen.

## 🏗 Projektstruktur

- `src/`: React Frontend (Komponenten, Screens, Stores).
- `src-tauri/`: Rust Backend (Datenbank-Logik, Tauri-Commands).
- `tools/parser/`: TypeScript-basierter Parser für DOCX/PDF Dokumente.
- `dnd5e_strict.db`: Core-Datenbank für D&D 5e Inhalte.

## 📜 Lizenz

Dieses Projekt ist für den privaten Gebrauch bestimmt. D&D und alle zugehörigen Marken sind Eigentum von Wizards of the Coast.

---
Entwickelt mit ❤️ für die D&D Community.

