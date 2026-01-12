# Changelog

Alle relevanten Änderungen an D&D Nexus werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt hält sich an [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.6.0] - 2026-01-12
### Hinzugefügt
- **Navigationsmenü im Charakterblatt:** Tab-Navigation für Kampf, Zauber, Inventar und Notizen
  - Visuelle Tab-Buttons mit Icons (Shield, Wand2, Backpack, Book)
  - Aktiver Tab wird hervorgehoben
  - Einfaches Wechseln zwischen den verschiedenen Bereichen des Charakterbogens

### Behoben
- **Equipment-Datenanzeige:** Korrekte Behandlung von NULL-Werten in Equipment-Daten
  - Option<f64> für total_cost_gp und total_weight_kg
  - Option<String> für items, tools und data Felder
  - Default-Werte für fehlende Daten (0.0 für Zahlen, "[]" bzw. "{}" für JSON)
  - Alle 7 Ausrüstungspakete werden jetzt korrekt angezeigt
- **Datenbank-Integration:** Projekt-Datenbank wird jetzt direkt verwendet
  - Kein Seeding mehr nötig - alle Daten werden direkt aus dnd-nexus.db geladen
  - Verbesserte Pfadauflösung für Datenbank-Datei
  - Alle Compendium-Daten (Spells, Items, Equipment, etc.) sind jetzt vollständig sichtbar

### Geändert
- **Datenbank-Architektur:** Übergang von zwei Datenbanken (Projekt-DB + App-DB) zu einer einzigen Datenbank
  - Alle Daten (Regelwerks-Daten UND Charaktere) werden in dnd-nexus.db gespeichert
  - Verhindert Datenverlust bei Charakteren
  - Einfacheres Backup und Datenmanagement

## [1.4.3] - 2026-01-07
### Hinzugefügt
- **Hintergründe (Backgrounds):** Vollständige Integration von Hintergründen aus PHB 2024
  - Hintergrund-Auswahl im Charakterbogen
  - Automatische Anwendung von Attributswerten (+2/+1 oder alle +1)
  - Automatische Anwendung von Herkunftstalenten (Feats)
  - Automatische Anwendung von Fertigkeiten und Werkzeugen
  - Dialog für Attributswerte-Auswahl mit automatischer Auswahl bei "Alle +1"
  - Automatisches Entfernen alter Hintergrund-Boni beim Hintergrund-Wechsel
  - Dedizierte Talente-Anzeige im Charakterbogen
  - Hintergründe im Kompendium mit verlinkbaren Skills, Tools und Feats

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

