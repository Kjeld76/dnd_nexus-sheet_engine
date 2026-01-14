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
- [ ] HP-Anzeige erweitern: Aktuelle HP, Maximale HP, Temporäre HP
- [ ] Hit Dice Anzeige: Verwendet/Verfügbar
- [ ] Todesrettungen: Erfolge/Fehlschläge mit visueller Anzeige
- [ ] HP-Bonus-Transparenz: Anzeige, welche Bonis in Max HP eingerechnet wurden
- [ ] HP-Editor: Eingabefelder für HP-Management

**Funktionalität:**
- [ ] AttributeBlock erweitern: Species-Trait-Modifikatoren direkt anzeigen (Vorteil-Badges bereits vorhanden, aber könnte erweitert werden)
- [ ] SkillList erweitern: Species-Trait-Modifikatoren direkt anzeigen (Vorteil-Badges bereits vorhanden)
- [ ] Traits-Parser verbessern: Robustere Erkennung von mechanischen Effekten

**Design ("Digital Grimoire"):**
- [x] Spacing: Mehr Raum überall, Desktop-orientiert optimieren
- [ ] Empty States: Hintergrund-Pattern mit Drachen/Runen-Line-Art
- [ ] Loading Spinner: W20 Ikosaeder (optional, benötigt Framer Motion)
- [ ] Tauri-Titlebar: Dark-Mode sicherstellen (via window.shadow)

## Nächster Fokus

### Combat-Seite vervollständigen
- [ ] Waffen-Tabelle: Anzeige und Verwaltung von Waffen
- [ ] Rüstungen-Tabelle: Anzeige und Verwaltung von Rüstungen
- [ ] Waffen-Import: Waffen in Datenbank importieren
- [ ] Automatische AC-Berechnung: Basierend auf ausgerüsteter Rüstung
- [ ] HP-Management: Vollständige HP-Anzeige mit Bonis-Transparenz
