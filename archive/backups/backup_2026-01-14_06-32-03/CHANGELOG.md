# Changelog

Alle relevanten Änderungen an D&D Nexus werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt hält sich an [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Hinzugefügt
- **Werkzeuge (Tools) - Vollständiger Import:** Alle Werkzeuge aus PHB 2024 importiert
  - 39 Werkzeuge importiert (18 Handwerkszeuge, 6 Andere Werkzeuge, 10 Musikinstrument-Varianten, 4 Spielset-Varianten)
  - Kategorie-Support: Handwerkszeug, Anderes Werkzeug
  - Varianten-Support: Musikinstrumente und Spielsets mit Varianten (z.B. Spielset → Drachenschach, Drei-Drachen-Ante, Spielkarten, Würfel)
  - Vollständige Daten: Attribut, Verwenden-Aktionen, Herstellen-Listen
- **Hintergründe - Tool-Wahl mit Varianten:** ToolChoiceDialog erweitert für Varianten
  - Spielset-Varianten werden jetzt korrekt im Background-Dialog angezeigt
  - Musikinstrument-Varianten werden korrekt angezeigt
  - Verbessertes Kategorie-Matching findet Tools auch bei unterschiedlichen Kategorienamen
  - Varianten werden als wählbare Optionen präsentiert

### Behoben
- **Hintergründe - Dialog-Reihenfolge:** Korrekte Reihenfolge der Wahl-Dialoge bei Hintergrund-Wechsel
  - Ability Score Dialog wird jetzt immer zuerst angezeigt
  - Tool Choice Dialog erscheint nach Ability Scores (falls vorhanden)
  - Starting Equipment Dialog erscheint nach Tool Choice oder direkt nach Ability Scores
  - Alle Dialoge werden nacheinander korrekt angezeigt
  - `prevBackgroundIdRef` wird korrekt aktualisiert, Background wird erst als "applied" markiert wenn alle Dialoge durch sind
- **Hintergründe - Fehlende Variable:** Behebung des Fehlers "Can't find variable: equipmentNotApplied"
  - Entfernung der undefinierten Variable aus Debug-Logs
  - Charakterbögen können jetzt wieder geöffnet werden, auch nach fehlerhaften Item-Eingaben
- **Hintergründe - Vollständige Integration:** Alle kritischen Punkte behoben
  - Alle Wahl-Abfragen werden konstant eingepflegt
  - Konsequenzen aus Hintergrund-Wahlen erscheinen korrekt auf dem Charakterbogen
  - Beim Hintergrund-Wechsel werden alle alten Konsequenzen vollständig entfernt
  - Tools werden aus allen Equipment-Listen entfernt (nicht nur aus `equipment_on_body_items`)

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

