# Implementierungs-Roadmap: Mapping-Tabellen & Imports

## Übersicht

Diese Roadmap definiert die Reihenfolge und Abhängigkeiten für die Umsetzung der 5 Konzepte:
1. **Waffen-Import** (`weapon-import-concept.md`)
2. **Rüstungen-Import** (`armor-property-mappings-concept.md`)
3. **Zauber-Klassen-Mapping** (`spell-class-mappings-concept.md`)
4. **Zauber-Tags-Mapping** (`spell-tag-mappings-concept.md`) - Optional
5. **Frontend/Backend-Implementierung** (`mapping-tables-implementation-concept.md`)

---

## Implementierungs-Reihenfolge

### Phase 1: Datenbank-Schema (Grundlage)

**Priorität: HOCH** - Muss zuerst fertig sein, bevor Daten importiert werden können.

#### 1.1 Waffen-Mapping-Schema
- [ ] Migration `005_add_weapon_property_mappings.sql` erstellen
- [ ] `weapon_properties` Tabelle erstellen (12 Eigenschaften)
- [ ] `weapon_property_mappings` Tabelle erstellen
- [ ] `weapon_masteries` Tabelle erstellen (8 Meisterschaften)
- [ ] `all_weapons_unified` View erstellen
- [ ] `weapons_legacy` View erstellen (Rückwärtskompatibilität)
- [ ] Trigger für Validierung erstellen
- [ ] Migration in `migrations.rs` integrieren

**Abhängigkeiten:** Keine  
**Geschätzte Zeit:** 2-3 Stunden

#### 1.2 Rüstungen-Mapping-Schema
- [ ] Migration `007_update_armor_schema.sql` erstellen
- [ ] `core_armors`/`custom_armors` Schema erweitern:
  - `base_ac` NULL erlauben
  - `ac_bonus`, `ac_formula`, `don_time_minutes`, `doff_time_minutes` hinzufügen
- [ ] Migration `008_add_armor_property_mappings.sql` erstellen
- [ ] `armor_properties` Tabelle erstellen
- [ ] `armor_property_mappings` Tabelle erstellen
- [ ] `all_armors` View aktualisieren
- [ ] Trigger für Validierung erstellen
- [ ] Migration in `migrations.rs` integrieren

**Abhängigkeiten:** Keine  
**Geschätzte Zeit:** 2-3 Stunden

#### 1.3 Zauber-Klassen-Mapping-Schema
- [ ] Migration `006_add_spell_class_mappings.sql` erstellen
- [ ] `spell_class_mappings` Tabelle erstellen
- [ ] Trigger für Validierung erstellen
- [ ] `all_spells_legacy` View erstellen (optional, für Rückwärtskompatibilität)
- [ ] Migration in `migrations.rs` integrieren

**Abhängigkeiten:** Keine  
**Geschätzte Zeit:** 1-2 Stunden

**Gesamt Phase 1:** ~5-8 Stunden

---

### Phase 2: Backend-Implementierung (Rust)

**Priorität: HOCH** - Muss parallel zu Phase 1 oder direkt danach kommen.

#### 2.1 Type Definitions aktualisieren
- [ ] `src-tauri/src/types/weapons.rs`:
  - `weapon_type` entfernen
  - `mastery_id` hinzufügen
  - `WeaponProperty`, `WeaponMastery` structs hinzufügen
- [ ] `src-tauri/src/types/compendium.rs`:
  - `Armor` struct erweitern (neue Felder, `ArmorProperty`)
  - `CustomArmor` struct erweitern
- [ ] `src-tauri/src/types/spell.rs`:
  - `SpellClass`, `SpellTag` structs hinzufügen
  - `Spell` struct erweitern (optional `classes_details`, `tags`)

**Abhängigkeiten:** Phase 1.1, 1.2, 1.3  
**Geschätzte Zeit:** 1-2 Stunden

#### 2.2 Commands aktualisieren
- [ ] `get_all_weapons` überarbeiten:
  - JOINs mit `weapon_property_mappings`
  - JOINs mit `weapon_masteries`
  - Properties und Mastery laden
- [ ] `get_all_armor` überarbeiten:
  - Neue Felder aus View laden
  - JOINs mit `armor_property_mappings`
  - Properties laden
- [ ] `get_all_spells_with_classes` neu erstellen:
  - JOINs mit `spell_class_mappings`
  - Optional: JOINs mit `spell_tag_mappings`
  - Arrays zurückgeben

**Abhängigkeiten:** Phase 2.1  
**Geschätzte Zeit:** 3-4 Stunden

#### 2.3 Views in migrations.rs aktualisieren
- [ ] `all_weapons_unified` View aktualisieren
- [ ] `all_armors` View aktualisieren
- [ ] Tests schreiben (optional)

**Abhängigkeiten:** Phase 1.1, 1.2  
**Geschätzte Zeit:** 1 Stunde

**Gesamt Phase 2:** ~5-7 Stunden

---

### Phase 3: Daten-Import (TypeScript)

**Priorität: HOCH** - Kann parallel zu Phase 2 laufen, aber braucht Phase 1.

#### 3.1 Waffen-Import
- [ ] `scripts/import-weapon-properties.ts` erstellen
- [ ] `scripts/import-weapon-masteries.ts` erstellen
- [ ] `scripts/import-all-weapons.ts` erstellen:
  - PDF-Parsing (Seiten 213-215)
  - Waffen parsen (alle Kategorien)
  - Properties zuordnen
  - Masteries zuordnen
  - In Datenbank importieren
- [ ] `scripts/validate-weapon-import.ts` erstellen
- [ ] Import ausführen und validieren

**Abhängigkeiten:** Phase 1.1, Phase 2.1 (Types)  
**Geschätzte Zeit:** 4-6 Stunden

#### 3.2 Rüstungen-Import
- [ ] `scripts/import-armor-properties.ts` erstellen
- [ ] `scripts/migrate-armor-properties.ts` erstellen (bestehende Daten)
- [ ] `scripts/import-armors.ts` erstellen:
  - PDF-Parsing (Seite 219)
  - Rüstungen parsen (13 Rüstungen + 1 Schild)
  - AC-Formeln korrekt setzen
  - Properties zuordnen
  - In Datenbank importieren
- [ ] `scripts/validate-armor-properties.ts` erstellen
- [ ] Import ausführen und validieren

**Abhängigkeiten:** Phase 1.2, Phase 2.1 (Types)  
**Geschätzte Zeit:** 3-4 Stunden

#### 3.3 Zauber-Klassen-Migration
- [ ] `scripts/migrate-spell-classes.ts` erstellen:
  - Bestehende `core_spells.classes` parsen
  - `spell_class_mappings` befüllen
  - Core + Custom via `all_spells`
- [ ] `scripts/validate-spell-classes.ts` erstellen
- [ ] Migration ausführen und validieren

**Abhängigkeiten:** Phase 1.3, Phase 2.1 (Types)  
**Geschätzte Zeit:** 2-3 Stunden

**Gesamt Phase 3:** ~9-13 Stunden

---

### Phase 4: Frontend-Implementierung (TypeScript/React)

**Priorität: HOCH** - Braucht Phase 2 (Backend muss fertig sein).

#### 4.1 Type Definitions aktualisieren
- [ ] `src/lib/types.ts`:
  - `Weapon` Type anpassen
  - `Armor` Type anpassen
  - `Spell` Type erweitern
- [ ] `src/lib/types/weapons.ts` aktualisieren
- [ ] `src/lib/types/armors.ts` aktualisieren

**Abhängigkeiten:** Phase 2.1  
**Geschätzte Zeit:** 1 Stunde

#### 4.2 API Layer erweitern
- [ ] `src/lib/api.ts`:
  - `getSpellsWithClasses()` hinzufügen
  - Bestehende Methoden prüfen (sollten automatisch funktionieren)

**Abhängigkeiten:** Phase 2.2  
**Geschätzte Zeit:** 30 Minuten

#### 4.3 Komponenten anpassen
- [ ] `src/components/Compendium.tsx`:
  - Waffen-Anzeige: `weapon_type` → `properties`
  - Rüstungen-Anzeige: AC-Formel, neue Felder
  - Zauber-Anzeige: `classes_details` Array
- [ ] `src/components/character/CombatStats.tsx`:
  - Properties aus Weapon-Objekt nutzen
  - AC-Berechnung anpassen (Formeln parsen)

**Abhängigkeiten:** Phase 4.1, Phase 4.2  
**Geschätzte Zeit:** 3-4 Stunden

**Gesamt Phase 4:** ~4.5-5.5 Stunden

---

### Phase 5: Optional - Zauber-Tags-Mapping

**Priorität: NIEDRIG** - Nur wenn nötig.

#### 5.1 Schema
- [ ] Migration `00Y_add_spell_tag_mappings.sql` erstellen
- [ ] `spell_tags` Tabelle erstellen
- [ ] `spell_tag_mappings` Tabelle erstellen
- [ ] Trigger für Validierung erstellen

#### 5.2 Backend
- [ ] `SpellTag` struct hinzufügen
- [ ] `get_all_spells_with_classes` erweitern (Tags laden)

#### 5.3 Frontend
- [ ] `SpellTag` Type hinzufügen
- [ ] Komponenten anpassen (Tags anzeigen)

**Abhängigkeiten:** Phase 1.3, Phase 2, Phase 4  
**Geschätzte Zeit:** 2-3 Stunden

---

## Empfohlene Start-Reihenfolge

### Option A: Sequenziell (Sicher, aber langsamer)

1. **Phase 1 komplett** (Schema für alle 3)
2. **Phase 2 komplett** (Backend für alle 3)
3. **Phase 3 komplett** (Import für alle 3)
4. **Phase 4 komplett** (Frontend)

**Vorteil:** Klare Abhängigkeiten, weniger Risiko  
**Nachteil:** Länger bis erste Ergebnisse sichtbar

### Option B: Parallel (Schneller, aber komplexer)

1. **Phase 1.1 + 1.2 parallel** (Waffen + Rüstungen Schema)
2. **Phase 2.1 + 2.2 parallel** (Types + Commands für Waffen + Rüstungen)
3. **Phase 3.1 + 3.2 parallel** (Waffen + Rüstungen Import)
4. **Phase 4.1 + 4.2 + 4.3** (Frontend für Waffen + Rüstungen)
5. **Phase 1.3 + 2.1 (Spell) + 3.3 + 4.3 (Spell)** (Zauber-Klassen)

**Vorteil:** Schneller, erste Ergebnisse früher sichtbar  
**Nachteil:** Mehr Kontext-Switching

### Option C: Feature-basiert (Empfohlen)

**Feature 1: Waffen (komplett)**
1. Phase 1.1 (Schema)
2. Phase 2.1 + 2.2 (Backend)
3. Phase 3.1 (Import)
4. Phase 4.1 + 4.2 + 4.3 (Frontend - Waffen)

**Feature 2: Rüstungen (komplett)**
1. Phase 1.2 (Schema)
2. Phase 2.1 + 2.2 (Backend - Rüstungen)
3. Phase 3.2 (Import)
4. Phase 4.1 + 4.2 + 4.3 (Frontend - Rüstungen)

**Feature 3: Zauber-Klassen (komplett)**
1. Phase 1.3 (Schema)
2. Phase 2.1 + 2.2 (Backend - Zauber)
3. Phase 3.3 (Migration)
4. Phase 4.1 + 4.2 + 4.3 (Frontend - Zauber)

**Vorteil:** Jedes Feature ist vollständig, kann getestet werden  
**Nachteil:** Etwas mehr Overhead durch wiederholte Type-Updates

---

## Empfehlung: Option C (Feature-basiert)

**Beginnen mit Waffen:**
1. ✅ Wichtigste Feature laut Checkliste
2. ✅ Vollständiges Feature von Anfang bis Ende
3. ✅ Kann als Template für Rüstungen dienen
4. ✅ Erste Ergebnisse schnell sichtbar

**Dann Rüstungen:**
1. ✅ Ähnliche Struktur wie Waffen
2. ✅ Kann von Waffen-Erfahrung profitieren

**Dann Zauber-Klassen:**
1. ✅ Einfacher (nur Mapping, kein Import)
2. ✅ Kann parallel zu Frontend-Tests laufen

---

## Konkreter Start-Plan

### Schritt 1: Waffen-Schema (Phase 1.1)
- Migration `005_add_weapon_property_mappings.sql` erstellen
- In `migrations.rs` integrieren
- Testen (App starten, Schema prüfen)

### Schritt 2: Waffen-Backend (Phase 2.1 + 2.2)
- Types aktualisieren
- `get_all_weapons` Command überarbeiten
- Testen (Command aufrufen, JSON prüfen)

### Schritt 3: Waffen-Import (Phase 3.1)
- Properties importieren
- Masteries importieren
- Waffen importieren
- Validieren

### Schritt 4: Waffen-Frontend (Phase 4.1 + 4.2 + 4.3)
- Types aktualisieren
- API prüfen
- Komponenten anpassen
- Testen (UI prüfen)

**Dann wiederholen für Rüstungen und Zauber-Klassen.**

---

## Zeit-Schätzung Gesamt

- **Phase 1:** 5-8 Stunden
- **Phase 2:** 5-7 Stunden
- **Phase 3:** 9-13 Stunden
- **Phase 4:** 4.5-5.5 Stunden
- **Phase 5 (optional):** 2-3 Stunden

**Gesamt:** ~23.5-33.5 Stunden (ohne Phase 5)

**Mit Feature-basiertem Ansatz:** Etwa gleich, aber bessere Testbarkeit.

---

## Nächste Schritte

1. ✅ Roadmap erstellt
2. ⏭️ **Beginnen mit Phase 1.1: Waffen-Schema**
3. ⏭️ Migration `005_add_weapon_property_mappings.sql` erstellen
