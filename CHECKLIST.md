# D&D Nexus - Core Migration Checklist

## 🎯 Performance- & Ressourcen-Targets
- [x] Installer size < 70MB (Release Profile mit LTO & Strip aktiviert)
- [x] Memory usage < 100MB idle (Dev-Build Profile optimiert)
- [x] Spell/Item lookup performance < 10ms (SQL-Indizes auf Name & Parent_ID gesetzt)

## Phase 1: Analyse & Vorbereitung
- [x] PHB 2024 DOCX Struktur analysieren
- [x] SQLite Schema für Core-Tabellen definieren (Core/Custom Pattern)
- [x] Rust-Validierungslogik vorbereiten

## Phase 2: Daten-Extraktion ( Surgical Purge )
- [x] **Core Spells** (308 Zauber, 100% PHB 2024 Compliance & Cleanup)
- [x] **Core Species** (10 Spezies, Cleaned Traits & Speed)
- [x] **Core Classes & Subclasses** (12 Klassen)
- [x] **Core Items** (Waffen, Rüstungen, Ausrüstung)
- [x] Waffen (38)
- [x] Rüstungen (13)
- [x] Werkzeuge (23)
- [x] Abenteurerausrüstung (68)
- [x] **Core Skills** (18 Fertigkeiten)
- [x] **Core Feats (Talente)** (75 Talente, alle Kategorien)
- [x] **Cross-references verified** (Links zwischen Zaubern, Klassen und Items etabliert)

## Phase 3: Charakter-Logik (PHB 2024 Deep Logic)
- [x] **Basis-Mathematik:** HP, XP-Level-Sync, Übungsbonus (1-30).
- [x] **Erweiterte Attribute:**
    - [x] Rettungswürfe (Mod + Übung)
    - [x] Alle 18 Fertigkeiten (Präzise Attributszuordnung)
    - [x] Passive Wahrnehmung (10 + Wahrnehmungs-Bonus)
- [x] **Kampf-Logik:**
    - [x] Rüstungsklasse (AC) basierend auf Rüstungstyp (Leicht/Mittel/Schwer) + Geschick-Cap.
    - [x] Waffen-Angriffe: Mod + Übung + Finesse/Ranged-Logik.
    - [x] Initiative (DEX-Mod + potenzielle Boni).
- [ ] **Zauberwirken-Statistik:**
    - [x] Zauber-SG (8 + Übung + Attribut).
    - [x] Zauber-Angriffsbonus (Übung + Attribut).
    - [ ] Zauberplätze-Verwaltung nach Level/Klasse.

## Phase 4: Datenbank-Integration & Stabilität
- [x] SQL-Seed Generierung (automatisiert)
- [x] SQLite Population
- [x] Rust-Backend API (Tauri Commands)
- [x] **No SQL errors in logs** (Stabilität bestätigt)

## Phase 5: UI & UX (Charakterbogen v2)
- [x] **Navigation:** Tab-System (Kampf, Zauber, Inventar, Notizen).
- [x] **Scrolling:** Behobene Layout-Fehler für lange Inhalte.
- [ ] **Charakter-Editor (Step-by-Step):**
    - [ ] Spezies-Auswahl (lädt Merkmale & Speed).
    - [ ] Klassen-Auswahl (lädt Hit Dice, Saves & Skills).
    - [ ] Hintergrund-Auswahl (lädt Talente & Fertigkeiten).
- [ ] **Inventar-Management:** Ausrüsten von Items -> Auswirkung auf AC/Speed.
- [ ] **Zauberbuch:** Auswahl und Vorbereitung von Zaubern aus dem Kompendium.

## Status: 90% Komplett (Core Logic & UI Foundation)
*Nächster Schritt: Implementierung der AC-Berechnungs-Logik und Waffen-Angriffe.*
