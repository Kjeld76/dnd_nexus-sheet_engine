# D&D Nexus Sheet Engine - Checkliste

## Phase 5 - Charakter-Editor & Interaktion

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
  - Alte Konsequenzen werden vollständig entfernt beim Hintergrund-Wechsel
- [x] **Werkzeuge (Tools) - Vollständiger Import:** Alle Werkzeuge aus PHB 2024 importiert
  - 39 Werkzeuge mit vollständigen Daten (Attribut, Verwenden, Herstellen)
  - Kategorie-Support implementiert
  - Varianten-Support für Musikinstrumente und Spielsets
- [x] **ToolChoiceDialog - Varianten-Support:** Spielset- und Musikinstrument-Varianten werden korrekt angezeigt
  - Verbessertes Kategorie-Matching
  - Varianten werden als wählbare Optionen präsentiert


### 📋 Offen


**Combat-Seite - Waffen & Rüstungen:**
- [x] Waffen-Import: Waffen in die Datenbank importiert (38 Waffen mit Properties & Masteries)
- [x] Rüstungen-Import: Rüstungen in die Datenbank importiert (13 Rüstungen + 1 Schild mit Properties)
- [x] Waffen & Rüstungen im Kompendium vollständig angezeigt (Properties, Masteries, Anziehzeiten)
- [x] Waffen-Tabelle: Anzeige aller verfügbaren Waffen aus dem Kompendium im Charakterblatt
- [x] Rüstungen-Tabelle: Anzeige aller verfügbaren Rüstungen aus dem Kompendium im Charakterblatt
- [x] Automatische Rüstungsklasse-Berechnung: AC-Berechnung basierend auf ausgerüsteter Rüstung
- [x] Rüstung ausrüsten/ablegen: Toggle für is_equipped Status
- [x] Waffe ausrüsten/ablegen: Toggle für is_equipped Status
- [ ] Angriffs-Berechnung: Angriffswerte mit Waffeneigenschaften und Modifikatoren

**Combat-Seite - HP-Management:**
- [x] HP-Anzeige erweitern: Aktuelle HP, Maximale HP, Temporäre HP
- [x] Hit Dice Anzeige: Verwendet/Verfügbar
- [x] Todesrettungen: Erfolge/Fehlschläge mit visueller Anzeige
- [x] HP-Bonus-Transparenz: Anzeige, welche Bonis in Max HP eingerechnet wurden
- [x] HP-Editor: Eingabefelder für HP-Management
- [x] HP-Berechnung: Toggle zwischen Durchschnitt und Gewürfelt

**Funktionalität:**
- [ ] AttributeBlock erweitern: Species-Trait-Modifikatoren direkt anzeigen (Vorteil-Badges bereits vorhanden, aber könnte erweitert werden)
- [ ] SkillList erweitern: Species-Trait-Modifikatoren direkt anzeigen (Vorteil-Badges bereits vorhanden)
- [ ] Traits-Parser verbessern: Robustere Erkennung von mechanischen Effekten

**Design ("Digital Grimoire"):**
- [x] Spacing: Mehr Raum überall, Desktop-orientiert optimieren
- [ ] Empty States: Hintergrund-Pattern mit Drachen/Runen-Line-Art
- [ ] Loading Spinner: W20 Ikosaeder (optional, benötigt Framer Motion)
- [ ] Tauri-Titlebar: Dark-Mode sicherstellen (via window.shadow)

**Inventar-Seite:**
- [x] EquipmentList-Komponente erstellt
- [x] Inventar-Seite mit Equipment-Kategorien (Am Körper, Im Rucksack, Auf Packtier, Im Nimmervollen Beutel)
- [x] Gewichtsberechnung implementiert (Waffen, Rüstungen, Items, Equipment, Tools)
- [x] Währungsfelder (Gold, Silber, Kupfer) hinzugefügt
- [x] Backend: CharacterMeta um Inventar-Felder erweitert (equipment_on_body_items, currency_gold, etc.)

## Nächster Fokus

### Combat-Seite erweitern
- [ ] Angriffs-Berechnung: Angriffswerte mit Waffeneigenschaften und Modifikatoren
  - Angriffsbonus = Attributsmodifikator + Übungsbonus + Waffenmodifikatoren
  - Schadensbonus = Attributsmodifikator + Waffenmodifikatoren
  - Waffeneigenschaften berücksichtigen (z.B. Finesse, Two-Handed)

### Inventar-Seite erweitern
- [ ] Equipment-Integration: Verknüpfung mit Compendium-Items (Dropdown-Auswahl statt Freitext)
- [ ] Gewichtslimit: Anzeige bei Überschreitung des Tragfähigkeitslimits
