# Changelog

Alle relevanten Änderungen an D&D Nexus werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt hält sich an [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.3] - 2026-01-07
### Hinzugefügt
- **CI/CD Pipeline:** Automatisierte Builds und Releases via GitHub Actions.
- **Wartungs-Script:** Neuer Befehl `pnpm maintenance` zum Aufräumen, Testen und Releasen.
- **Code-Qualität:** Husky & lint-staged integriert für automatische Prüfungen vor jedem Commit.
- **Konfiguration:** `vitest.config.ts`, `vite.config.ts` und `.eslintrc.cjs` für stabile Test- und Linting-Umgebungen hinzugefügt.

### Behoben
- Unbenutzte Variablen und fehlerhafte Imports in Frontend-Komponenten entfernt.
- Typ-Prüfungsfehler (Typecheck) behoben, die den GitHub-Build blockiert haben.

## [1.4.0] - 2026-01-07
### Hinzugefügt
- Kompendium-Editor für Homebrew-Inhalte.
- JSON-Modus für fortgeschrittene Datenbearbeitung.
- Erste Version des automatisierten Release-Scripts.

## [1.3.1] - 2026-01-07
### Hinzugefügt
- Support für PHB 2024 Regelwerk.
- SQLite Integration für Core-Daten.

