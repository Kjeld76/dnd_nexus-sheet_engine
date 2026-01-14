# D&D Nexus Sheet Engine - Checkliste

## Phase 5 - Charakter-Editor & Interaktion

## 📌 Offen (priorisiert & gruppiert)

### **P1 — Stabilität & Qualität (Backend / Build)**
- [ ] **Rust/Clippy-Runde (Backend):** `cargo clippy` in `src-tauri/` ausführen und alle Warnungen beheben
  - `.unwrap()`/`.expect()` entfernen, wo sinnvoll → saubere Fehlerpfade mit `AppError`
  - Lock-/DB-Fehler konsistent über `AppResult`/`map_lock_error` (falls noch Lücken existieren)
  - Ergebnis: weniger Runtime-Risiko + stabilere CI

### **P1 — Core-Gameplay (Combat)**
- [ ] **Angriffs-Berechnung:** Angriffswerte mit Waffeneigenschaften und Modifikatoren
  - Angriffsbonus = Attributsmodifikator + Übungsbonus + Waffenmodifikatoren
  - Schadensbonus = Attributsmodifikator + Waffenmodifikatoren
  - Waffeneigenschaften berücksichtigen (z.B. Finesse, Two-Handed)

### **P2 — Refactor & Wartbarkeit (Frontend)**
- [ ] **CharacterSheet weiter entschlacken:** Helper aus `src/screens/CharacterSheet.tsx` nach `src/lib/character/*` auslagern
  - z.B. Background-Apply/Equipment-Normalisierung/Inventory-Helpers als eigene Module
  - Ergebnis: kleinere Datei, bessere Testbarkeit, weniger Deep-Nesting

### **P2 — UX & Datenkonsistenz (Inventar)**
- [ ] **Equipment-Integration:** Verknüpfung mit Compendium-Items (Dropdown-Auswahl statt Freitext)
- [ ] **Gewichtslimit:** Anzeige bei Überschreitung des Tragfähigkeitslimits

### **P2 — UI/UX Layout & Visual Design ("Digitales Grimoire")**
- [ ] **GUI-Überarbeitung:** Layout + Look&Feel konsistent als „Digitales Grimoire“
  - Konzept: `DIGITALES_GRIMOIRE_UI_KONZEPT.md`
  - **Visuelle Identität:** Farben/Tokens (Dark „Shadow“ / Light „Parchment“), Branding (Banner/Favicon), Typografie (Cinzel Decorative / EB Garamond / Grenze Gotisch)
  - **Komponenten-Stil:** Buttons („forged“), Cards („parchment“), Navigation (Top-Bar mit Blur)
  - **Auto-Flow Layout:** statt fixer Breiten → Grid/Flex-Wrap, responsive Spalten (lg:3 / md:2 / sm:1)
  - **Tailwind-Refactor:** `w-full max-w-[1400px] mx-auto`, Grid-Spans statt `w-[..]`, `min-w[...]`, `truncate`, `text-base xl:text-lg`
  - **Overflow/Typo-Fixes:** keine Überlappungen (z.B. HP-Box), `h-fit` statt Fixhöhen, Buttons bei wenig Platz umbrechen (grid auto-fit)

### **P2 — Regel-Transparenz (Character UI)**
- [ ] **Traits-Parser verbessern:** Robustere Erkennung von mechanischen Effekten
- [ ] **AttributeBlock erweitern:** Species-Trait-Modifikatoren direkt anzeigen (Vorteil-Badges bereits vorhanden, aber könnte erweitert werden)
- [ ] **SkillList erweitern:** Species-Trait-Modifikatoren direkt anzeigen (Vorteil-Badges bereits vorhanden)

### **P3 — Polishing (Design)**
- [ ] **Tauri-Titlebar:** Dark-Mode sicherstellen (via window.shadow)
- [ ] **Empty States:** Hintergrund-Pattern mit Drachen/Runen-Line-Art
- [ ] **Loading Spinner:** W20 Ikosaeder (optional, benötigt Framer Motion)

### ✅ Abgeschlossen
- [x] Species Workflow implementiert (automatische Anwendung von Traits, Sprachen)
- [x] Species Traits Komponente erstellt und angezeigt
- [x] Ability Score Choice Dialog für wählbare Attributsmodifikatoren
- [x] Traits-Modifikatoren werden in SpeciesTraits angezeigt
- [x] PHB 2024 Konformität: Attributsmodifikatoren für Völker entfernt (2024 Regeln)
- [x] Navigationsmenü im Charakterblatt hinzugefügt (Kampf, Zauber, Inventar, Notizen)
- [x] Equipment-Daten werden korrekt angezeigt (NULL-Handling implementiert)
- [x] Alle Compendium-Daten sind vollständig sichtbar (Spells, Items, Equipment, etc.)
- [x] Datenbank-Architektur: Übergang zu einer einzigen Datenbank (dnd-nexus.db)
- [x] Rettungswürfe-Komponente erstellt (SavingThrowsList.tsx)
- [x] Rettungswürfe in CharacterSheet.tsx integriert
- [x] Proficiency-Indikatoren für Rettungswürfe implementiert
- [x] Species-Trait-Modifikatoren (Vorteil) bei Rettungswürfen angezeigt
- [x] Geschlecht wird jetzt korrekt gespeichert (Rust CharacterMeta erweitert)
- [x] **Hintergründe - Vollständige Integration:** Alle kritischen Punkte behoben
  - Wahl-Abfragen werden konstant eingepflegt (Ability Scores, Tool Choice, Starting Equipment)
  - Konsequenzen erscheinen korrekt auf dem Charakterbogen
  - Alte Konsequenzen werden vollständig entfernt beim Hintergrund-Wechsel (Inkl. Gold & Werkzeuge)
  - Strukturierte Startausrüstung (Mengen & Varianten) implementiert
- [x] **Inventar-Optimierung:**
  - Dedizierter Werkzeug-Bereich hinzugefügt
  - Gewichtsberechnung inkl. Werkzeuge
  - Tooltip für Gewichtsberechnung (Bereichs-Info)
- [x] **Werkzeuge (Tools) - Vollständiger Import:** Alle Werkzeuge aus PHB 2024 importiert
  - 39 Werkzeuge mit vollständigen Daten (Attribut, Verwenden, Herstellen)
  - Kategorie-Support implementiert
  - Varianten-Support für Musikinstrumente und Spielsets
- [x] **ToolChoiceDialog - Varianten-Support:** Spielset- und Musikinstrument-Varianten werden korrekt angezeigt
  - Verbessertes Kategorie-Matching
  - Varianten werden als wählbare Optionen präsentiert
- [x] **Combat-Seite - Waffen & Rüstungen:**
  - Waffen-Import: Waffen in die Datenbank importiert (38 Waffen mit Properties & Masteries)
  - Rüstungen-Import: Rüstungen in die Datenbank importiert (13 Rüstungen + 1 Schild mit Properties)
  - Waffen & Rüstungen im Kompendium vollständig angezeigt (Properties, Masteries, Anziehzeiten)
  - Waffen-Tabelle: Anzeige aller verfügbaren Waffen aus dem Kompendium im Charakterblatt
  - Rüstungen-Tabelle: Anzeige aller verfügbaren Rüstungen aus dem Kompendium im Charakterblatt
  - Automatische Rüstungsklasse-Berechnung: AC-Berechnung basierend auf ausgerüsteter Rüstung
  - Rüstung ausrüsten/ablegen: Toggle für is_equipped Status
  - Waffe ausrüsten/ablegen: Toggle für is_equipped Status
- [x] **Combat-Seite - HP-Management:**
  - HP-Anzeige erweitern: Aktuelle HP, Maximale HP, Temporäre HP
  - Hit Dice Anzeige: Verwendet/Verfügbar
  - Todesrettungen: Erfolge/Fehlschläge mit visueller Anzeige
  - HP-Bonus-Transparenz: Anzeige, welche Bonis in Max HP eingerechnet wurden
  - HP-Editor: Eingabefelder für HP-Management
  - HP-Berechnung: Toggle zwischen Durchschnitt und Gewürfelt
- [x] **Design ("Digital Grimoire"):**
  - Spacing: Mehr Raum überall, Desktop-orientiert optimieren
- [x] **Inventar-Seite:**
  - EquipmentList-Komponente erstellt
  - Inventar-Seite mit Equipment-Kategorien (Am Körper, Im Rucksack, Auf Packtier, Im Nimmervollen Beutel)
  - Gewichtsberechnung implementiert (Waffen, Rüstungen, Items, Equipment, Tools)
  - Währungsfelder (Gold, Silber, Kupfer) hinzugefügt
  - Backend: CharacterMeta um Inventar-Felder erweitert (equipment_on_body_items, currency_gold, etc.)
