# 📚 D&D Nexus - Projekt Wiki

Willkommen im zentralen Wissensspeicher von D&D Nexus. Dieses Wiki erklärt die Architektur und die technischen Details hinter der App.

## 🏗️ Architektur
D&D Nexus ist eine Hybrid-Anwendung:
- **Frontend:** React 19 + TypeScript + Zustand für das State-Management.
- **Backend:** Rust (Tauri 2.0) für Systemzugriff und Performance.
- **Datenbank:** SQLite für persistente lokale Speicherung.

## 💾 Datenbank-Konzept
Wir nutzen ein **Duales Tabellen-System**:
1.  **`core_*` Tabellen:** Enthält offizielle Daten aus dem PHB 2024. Diese sind schreibgeschützt.
2.  **`custom_*` Tabellen:** Speichert deine Homebrew-Inhalte und Overrides.
3.  **Views:** SQL-Views wie `all_spells` kombinieren beide Quellen. Wenn ein Homebrew-Eintrag die gleiche `parent_id` wie ein Core-Eintrag hat, gewinnt der Homebrew-Eintrag (Override-Logik).

## 🛠️ Tooling
- **Parser:** Befindet sich in `tools/parser/`. Extrahiert Daten aus DOCX/PDF und wandelt sie in JSON-Seeds für die Datenbank um.
- **Maintenance Script:** `scripts/maintenance.ts` sorgt für Code-Qualität und automatisierte Releases.

## 🧪 Testing
- **Frontend-Tests:** `vitest` für Komponenten-Tests.
- **Rust-Tests:** Standard `cargo test` für die Backend-Logik.
- **GitHub Actions:** Automatisierte Prüfung bei jedem Push.

## 📜 Wichtige Dokumente
- [Changelog](CHANGELOG.md) - Was ist neu?
- [Checklist](CHECKLIST.md) - Was ist noch zu tun?
- [Release Guide](RELEASE_GUIDE.md) - Wie veröffentliche ich eine neue Version?

