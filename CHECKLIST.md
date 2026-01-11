# D&D Nexus Sheet Engine - Checkliste

## Phase 5 - Charakter-Editor & Interaktion

### ✅ Abgeschlossen
- [x] Species Workflow implementiert (automatische Anwendung von Traits, Sprachen)
- [x] Species Traits Komponente erstellt und angezeigt
- [x] Ability Score Choice Dialog für wählbare Attributsmodifikatoren
- [x] Traits-Modifikatoren werden in SpeciesTraits angezeigt
- [x] PHB 2024 Konformität: Attributsmodifikatoren für Völker entfernt (2024 Regeln)


### 📋 Offen

**Funktionalität:**
- [ ] AttributeBlock erweitern: Species-Trait-Modifikatoren direkt anzeigen
- [ ] SkillList erweitern: Species-Trait-Modifikatoren direkt anzeigen
- [ ] Traits-Parser verbessern: Robustere Erkennung von mechanischen Effekten
- [ ] Rettungswürfe mit Vorteil/Nachteil anzeigen (z.B. durch Species Traits)

**Design ("Digital Grimoire"):**
- [ ] Spacing: Mehr Raum überall, Desktop-orientiert optimieren
- [ ] Empty States: Hintergrund-Pattern mit Drachen/Runen-Line-Art
- [ ] Loading Spinner: W20 Ikosaeder (optional, benötigt Framer Motion)
- [ ] Tauri-Titlebar: Dark-Mode sicherstellen (via window.shadow)

## Nächster Fokus

### Rettungswürfe auf Charakterbogen
- [ ] Komponente `SavingThrowsList.tsx` erstellen
- [ ] Rettungswürfe in CombatStats oder separatem Bereich anzeigen
- [ ] Proficiency-Indikatoren für Rettungswürfe
- [ ] Species-Trait-Modifikatoren (z.B. Vorteil) bei Rettungswürfen anzeigen
- [ ] Integration in CharacterSheet.tsx
