# Changelog

Alle relevanten Änderungen an D&D Nexus werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt hält sich an [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### 
- **Autonom:**  (via Swarm Agent)
### 
- **Autonom:**  (via Swarm Agent)
### Added
- **Sage-Agent:** System zur PHB 2024 Regelverifizierung.
- **PDF-Engine:** High-Fidelity PDF-Parsing-Modul in Rust (`pdf-extract`).
- **Architecture:** Math-Registry (`docs/math_registry.md`) für zentrale Formel-Validation.

### Fixed
- **Mathematik:** Konsistenzprüfung aller Kern-Formeln gegen das 2024er Regelwerk.
- **Backend:** Mathematische Integrität gegen PHB 2024 verifiziert & Backend Cleanup.

### Changed
- **UI:** UI-Sperre (readOnly) für abgeleitete Werte zur Vermeidung von Fehlberechnungen.
- **UI:** Versiegelung der UI-Komponenten gegen Layout-Regressionen.
- **Code Quality:** Comprehensive cleanup of TypeScript lint errors (resolved `any` types in core components and scripts).



## [1.7.16] - 2026-01-18
### Fixed
- **TypeScript:** Type-Fehler behoben - `category_label` und `weapon_subtype` zu Weapon/Armor Types hinzugefügt
- **UI:** Deduplizierung von Rüstungseigenschaften (Stealth Nachteil) + Übersetzung ins Deutsche
- **UI:** Heavy-Warnung wird nur noch für ausgerüstete Waffen angezeigt

### Changed
- **Rust Backend:** `expect()` in `main` entfernt, um Abstürze zu vermeiden
- **Clippy:** Rust-Warnungen behoben

## [1.7.15] - 2026-01-18
### Added
- **Combat - Waffenangriffe & Schaden:**
  - Angriffsbonus und Schaden werden jetzt in der Waffenliste angezeigt
  - Verbesserte Waffenangriffs-Berechnung mit korrekter Attributs-Ermittlung (STR/DEX für Nahkampf/Fernkampf)
  - Magische Boni (+1/+2/+3) werden in Angriff **und** Schaden eingerechnet
  - Unterstützung für Vielseitig (Versatile), Nebenhand (Offhand) und Reichweiten-Labels
- **Combat - Waffen-Optionen:**
  - Toggle für Nebenhand (NH) - automatische Validierung, nur eine Waffe kann Nebenhand sein
  - Toggle für Zweihändig (2H) - nur bei vielseitigen Waffen sichtbar
  - Zwei-Waffen-Kampf (ZWK) Toggle - nur verfügbar bei Nebenhand-Waffen und wenn Kampfstil vorhanden
- **Combat - Kampfstile:**
  - Kampfstile werden nur noch für Klassen angezeigt, die sie haben können (Kämpfer, Paladin, etc.)
  - Kampfstile werden aus der Datenbank geladen (Feats mit Kategorie "kampfstil")
  - Deutsche Begriffe für Kampfstile (z.B. "Zwei-Waffen-Kampf" statt "Two-Weapon Fighting")
  - Validierung: Zwei-Waffen-Kampf erfordert den entsprechenden Kampfstil
- **UI - Waffenhinweise:**
  - Heavy-Warnung: Hinweis bei schweren Waffen ohne ausreichendes Attribut
  - Reach-Hinweis: Anzeige bei Waffen mit Weitreichend-Eigenschaft

### Fixed
- **Combat:** Deduplizierung von Waffeneigenschaften (Backend + Frontend)
- **UI:** Responsive Design-Verbesserungen für Charakterblatt

### Changed
- **Dokumentation:** Kampf-Formelsammlung hinzugefügt (`docs/KAMPF_FORMELSAMMLUNG.md`)

*Hinweis: Die Versionen 1.7.12, 1.7.13 und 1.7.14 wurden übersprungen.*

## [1.7.11] - 2026-01-17
### Changed
- **Responsive Design - Charakterblatt:** Vollständige Überarbeitung des Layouts für verschiedene Bildschirmgrößen
  - Grid-Layout: Mobile (1 Spalte) → Tablet (2 Spalten) → Desktop (3 Spalten)
  - Linke Spalte (Attribute): Fest 280px auf Desktop, volle Breite auf Mobile
  - Mittlere Spalte rutscht bei schmalen Fenstern unter die linke Spalte (verhindert Stauchungen)
  - Responsive Breakpoints: `md:768px`, `xl:1280px`
- **Waffen & Rüstungen - UI-Optimierungen:**
  - "+ Hinzufügen" Button unter Überschrift verschoben (verhindert Abtrennung)
  - Action-Buttons (Aktivieren/Löschen) nach unten rechts in Karten positioniert
  - Buttons überlappen nicht mehr den Text (Grid-Layout statt Flex)
  - Kompakteres Design mit kleineren Buttons (`p-1`, `size={12}`)
- **HP-Management - Kompaktes Layout:**
  - Trefferwürfel und Todesrettungen in optimiertem 2-Spalten-Grid
  - Bessere Abstände und responsive Schriftgrößen
  - Flex-wrap für Controls, um Überlauf zu vermeiden

### Fixed
- **Layout-Stauchungen:** Mittlere Spalte rutscht jetzt korrekt unter die linke Spalte bei schmalen Fenstern
- **Button-Überlappung:** Action-Buttons in Waffen/Rüstungen überlappen keine Textinhalte mehr

## [1.7.10] - 2026-01-15
### Added
- **Datenbank-Normalisierung:** Vollständige Analyse und Optimierung der Datenbankstruktur (1NF, 2NF, 3NF)
  - Normalisierung von `core_equipment` (JSON-Arrays → relationale Tabellen)
  - Neue Tabellen: `core_equipment_items`, `core_equipment_tools` für strukturierte Daten
  - Views für einheitliche Abfragen: `all_equipment_items`, `all_equipment_tools`
- **Magische Gegenstände - Custom-Varianten:**
  - Custom-Tabellen für Homebrew magische Items erstellt (`custom_mag_items_base`, `custom_mag_weapons`, `custom_mag_armor`, etc.)
  - Views für vereinheitlichte Abfragen: `all_mag_items_base`, `all_mag_weapons`, `all_mag_armor`, etc.
  - Konsistente Struktur zwischen normalen und magischen Items (analog zu `custom_weapons`/`custom_armors`)
- **Magische Gegenstände - Import:**
  - Vollständiger Import von 240 magischen Gegenständen aus dem Spielleiterhandbuch (2024)
  - Normalisierte Tabellenstruktur: `core_mag_items_base` + kategorie-spezifische Tabellen
  - Tool-Matching für Crafting-Anforderungen (Verknüpfung mit `core_tools`/`custom_tools`)
  - Unterstützung für alle Kategorien: Waffen, Rüstungen, Consumables, Focus Items, Jewelry, Wondrous Items

### Changed
- **Datenbank-Architektur:** Konsistente Struktur zwischen normalen und magischen Items
  - Normale Items: monolithische Tabellen (wie bisher)
  - Magische Items: normalisierte Struktur (Basis-Tabelle + Kategorie-Tabellen)
  - Beide unterstützen jetzt Custom-Varianten für Homebrew-Inhalte

## [1.7.9] - 2026-01-14
### Changed
- **Code-Qualität:** ESLint/TypeScript-Cleanup abgeschlossen (0 Warnings, `typecheck` + `build` wieder stabil).
- **Refactor:** `CharacterSheet.tsx` Background-Apply/Change-Flow ent-nestet und in klar benannte Helper-Funktionen zerlegt (ohne Verhaltensänderung).
- **Refactor:** `Compendium.tsx` Helper/Guards/Typen nach `src/components/compendium/compendiumUtils.ts` ausgelagert (bessere Lesbarkeit, weniger Deep-Nesting).
- **Refactor:** UI-Magic-Numbers zentralisiert in `src/lib/uiConstants.ts` (z.B. Default-Speed, Virtualizer-Parameter).

## [1.7.8] - 2026-01-14
### Fixed
- **CI/CD:** Bundle-Ziele in `tauri.conf.json` von festen Windows-Werten auf `all` geändert, damit auch auf Linux Installationspakete (.deb, .AppImage) erstellt werden.

## [1.7.7] - 2026-01-14
### Fixed
- **CI/CD:** Erneute Korrektur der Linux-Systemabhängigkeiten für Ubuntu 24.04 (Noble).
- **Rust Backend:** Absicherung der `open_devtools` Funktion gegen Release-Build-Abstürze.

## [1.7.3] - 2026-01-14
### Fixed
- **Linux Build:** Fehlende System-Bibliotheken (`libglib2.0-dev`, `libsoup-3.0-dev` etc.) im GitHub Action Workflow hinzugefügt.
- **Windows Build:** Rust-Kompilierungsfehler behoben, indem `open_devtools` nur im Debug-Modus aktiviert wird (`#[cfg(debug_assertions)]`).

## [1.7.2] - 2026-01-14
### Fixed
- **Frontend Build:** TypeScript-Fehler in `Compendium.tsx` behoben (Typ-Konflikt bei `RefObject` für die virtualisierte Liste).

## [1.7.1] - 2026-01-14
### Fixed
- **CI/CD:** Platzhalter-Fehler in der `release.yml` korrigiert, damit Git-Tags korrekt für die Release-Erstellung genutzt werden.

## [1.7.0] - 2026-01-14
### Added
- **Hintergründe - Strukturierte Startausrüstung:**
  - Datenbank-Schema für `starting_equipment` optimiert (Mengenangaben, Einheiten und Varianten werden jetzt strukturiert gespeichert)
  - Unterstützung für komplexe Items wie "Pergament (10 Blätter)" oder "Öl (drei Flaschen)"
  - Varianten wie "Buch (Gebete)" werden korrekt im Inventar und in Dialogen angezeigt
- **Inventar - Dedizierter Werkzeug-Bereich:**
  - Neuer Bereich "WERKZEUGE" im Inventar-Tab
  - Automatische Zuweisung von Werkzeugen (aus Hintergründen oder Paketen) in diesen Bereich
  - Werkzeuge werden jetzt korrekt aus allen Inventar-Listen gelöscht, wenn der Hintergrund gewechselt wird
- **Gewichtsberechnung & UI:**
  - Werkzeuge werden nun in das Gesamtgewicht eingerechnet
  - Interaktives Info-Icon (Tooltip) beim Gesamtgewicht erklärt die berechneten Bereiche (Am Körper, Rucksack, Werkzeuge, Ausrüstung)
- **Hintergrund-Wechsel - Gold-Tracking:**
  - Automatisches Tracking von Gold, das durch den Hintergrund gewährt wurde
  - Bei einem Hintergrund-Wechsel wird das gewährte Gold wieder abgezogen (mit Schutz gegen negativen Kontostand)
- **Stabilität & Persistenz:**
  - Rust Backend (`CharacterMeta`) erweitert, um Hintergrund-Fortschritt (Boni, Werkzeugwahl, Ausrüstung) dauerhaft zu speichern
  - "Clean-First" Prinzip beim Hintergrund-Wechsel: Komplette Bereinigung alter Daten vor Anwendung des neuen Hintergrunds zur Vermeidung von Race Conditions

### Fixed
- **Hintergründe - Dialog-Sequenzierung:**
  - Dialoge für Attribute, Werkzeuge und Ausrüstung erscheinen nun zuverlässig nacheinander
  - Fehler behoben, bei dem Dialoge nach einem Hintergrund-Wechsel nicht mehr erschienen
  - Problem mit verschwindenden Mengen/Varianten im Frontend gelöst
- **Fehlerbehandlung:**
  - "Can't find variable: removeBackgroundItem" Fehler behoben
  - Absicherung gegen Abstürze beim Löschen von nicht (mehr) vorhandenen Gegenständen oder Gold

## [1.6.0] - 2026-01-12
### Added
- **Navigationsmenü im Charakterblatt:** Tab-Navigation für Kampf, Zauber, Inventar und Notizen
  - Visuelle Tab-Buttons mit Icons (Shield, Wand2, Backpack, Book)
  - Aktiver Tab wird hervorgehoben
  - Einfaches Wechseln zwischen den verschiedenen Bereichen des Charakterbogens

### Fixed
- **Equipment-Datenanzeige:** Korrekte Behandlung von NULL-Werten in Equipment-Daten
  - Option<f64> für total_cost_gp und total_weight_kg
  - Option<String> für items, tools und data Felder
  - Default-Werte für fehlende Daten (0.0 für Zahlen, "[]" bzw. "{}" für JSON)
  - Alle 7 Ausrüstungspakete werden jetzt korrekt angezeigt
- **Datenbank-Integration:** Projekt-Datenbank wird jetzt direkt verwendet
  - Kein Seeding mehr nötig - alle Daten werden direkt aus dnd-nexus.db geladen
  - Verbesserte Pfadauflösung für Datenbank-Datei
  - Alle Compendium-Daten (Spells, Items, Equipment, etc.) sind jetzt vollständig sichtbar

### Changed
- **Datenbank-Architektur:** Übergang von zwei Datenbanken (Projekt-DB + App-DB) zu einer einzigen Datenbank
  - Alle Daten (Regelwerks-Daten UND Charaktere) werden in dnd-nexus.db gespeichert
  - Verhindert Datenverlust bei Charakteren
  - Einfacheres Backup und Datenmanagement

## [1.4.3] - 2026-01-07
### Added
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
### Added
- **CI/CD Pipeline:** Automatisierte Builds und Releases via GitHub Actions.
- **Wartungs-Script:** Neuer Befehl `pnpm maintenance` zum Aufräumen, Testen und Releasen.
- **Code-Qualität:** Husky & lint-staged integriert für automatische Prüfungen vor jedem Commit.
- **Konfiguration:** `vitest.config.ts`, `vite.config.ts` und `.eslintrc.cjs` für stabile Test- und Linting-Umgebungen hinzugefügt.

### Fixed
- Unbenutzte Variablen und fehlerhafte Imports in Frontend-Komponenten entfernt.
- Typ-Prüfungsfehler (Typecheck) behoben, die den GitHub-Build blockiert haben.

## [1.4.0] - 2026-01-07
### Added
- Kompendium-Editor für Homebrew-Inhalte.
- JSON-Modus für fortgeschrittene Datenbearbeitung.
- Erste Version des automatisierten Release-Scripts.

## [1.3.1] - 2026-01-07
### Added
- Support für PHB 2024 Regelwerk.
- SQLite Integration für Core-Daten.

