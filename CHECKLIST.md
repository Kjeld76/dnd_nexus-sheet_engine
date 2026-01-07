# D&D Nexus - Core Migration Checklist

## 🎯 Performance- & Ressourcen-Targets
- [ ] Installer size < 70MB (Tauri Optimization)
- [ ] Memory usage < 100MB idle
- [ ] Spell/Item lookup performance < 10ms (Rust/SQL indexing)

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
- [ ] **Cross-references verified** (Links zwischen Zaubern, Klassen und Items)

## Phase 3: Mathematische Formalisierung
- [x] HP-Formeln für alle Klassen (Automatisierte Berechnung)
- [x] Schadenskalierung (Cantrips/Merkmale - Vorbereitet in Logic)
- [x] Rüstungsklassen-Berechnungen (Basis-Logik integriert)

## Phase 4: Datenbank-Integration & Stabilität
- [x] SQL-Seed Generierung (automatisiert)
- [x] SQLite Population
- [x] Rust-Backend API (Tauri Commands)
- [x] **No SQL errors in logs** (Stabilität bestätigt)

## Phase 5: UI & UX
- [x] Compendium UI (Kategorisiert & Enriched JSON)
- [x] Suche & Filter für Talente & Items
- [x] Validierungs-Dashboard
- [x] **Real-World Test:** Ersten Charakter erstellen und speichern (Daten-Verknüpfungstest)

## Status: 85% Komplett (Tools & Gear integrated)
*Nächster Schritt: Cross-Reference Validierung und Mathematische Formalisierung.*
