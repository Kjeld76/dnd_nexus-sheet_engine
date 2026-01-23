# SQLite Database Schema Analysis & Optimization Report
## D&D Nexus Sheet Engine - Full-Stack Impact Analysis

**Erstellt am**: 2025-01-15  
**Datenbank**: `/daten/projects/dnd_nexus-sheet_engine/dnd-nexus.db`  
**Projekt**: D&D Nexus Sheet Engine (Tauri 2 + React 19 + TypeScript)

---

## 1. Executive Summary

**Gesamtbewertung**: Die Schema-Qualität ist **solide (MEDIUM–HIGH)** mit klarer Trennung zwischen `core_*` / `custom_*` Tabellen und starken `all_*` Views als stabile API-Schicht für Frontend und Tauri-Commands.

**Kritische Punkte (CRITICAL/HIGH)**:
- Starke **JSON-Zentralisierung** (`data TEXT/JSON`, `facts_json`, `characters.data`) führt zu eingeschränkter Querbarkeit, schwächeren Constraints und höherer Komplexität für Feature-System/Charakterberechnung
- Einige Mapping-Tabellen haben **unvollständige Foreign Keys** (z.B. `armor_property_mappings.armor_id` nur via Trigger validiert, kein echter FK)

**Wichtige Diskrepanzen (MEDIUM)**:
- Uneinheitliche Verwendung von `TEXT` vs `JSON` für semantisch gleichartige "data"-Payloads
- Optionale vs. non-optionale Felder zwischen DB ↔ Rust-Types ↔ TS-Types (z.B. `Weapon.mastery_id` Pflicht in Rust, optional in TS, verschieden in Views)
- Inkonsistente Normalisierung bei Ausrüstungs-/Feature-Beziehungen

**Performance**: Für den typischen **read-heavy** Desktop-Workload sind die vorhandenen Indizes auf Namen, `updated_at`, FK-Spalten und Mapping-Tabellen gut; Haupt-Potenzial liegt in besseren **kompakten Projektionen** und **gezielten Indexen** für Feature- und Klassen-bezogene Queries.

**Frontend-Refactoring-Aufwand**:
- **Kurzfristige Verbesserungen** (zusätzliche Indizes, Views, stabilere Constraints): **Low** bis **Low-Medium**
- Tiefere Normalisierung von Charakter- und Feature-Daten: **Medium–High**

**Empfohlene Migrationsstrategie**: Klare **3-Phasen-Strategie mit Gradual Migration**:
- **Phase 1**: Nur zusätzliche Indizes/Views + kleine, rückwärtskompatible Spalten (keine TS-/UI-Änderungen nötig)
- **Phase 2**: Neue normalisierte Tabellen + kompatible Views/Commands (Frontend schrittweise auf neue Commands/Types umstellen)
- **Phase 3**: Aufräumen von Legacy-Spalten/Views nach stabiler Nutzung der neuen API

---

## 2. Discrepancy Matrix

| Category | Location | Issue Description | Impact | Severity | Frontend Impact | Recommendation |
|----------|----------|-------------------|--------|----------|-----------------|----------------|
| Data Types | `core_spells.data` (JSON), `core_species.data` (TEXT), `core_classes.data` (TEXT), `core_items.data` (JSON) | Uneinheitliche Verwendung von `TEXT` vs `JSON` für semantisch gleichartige "data"-Payloads | Wartbarkeit, Abfragen | MEDIUM | TS-Types (`ClassData`, `SpeciesData`, `Item.data`) erwarten strukturierte Objekte; Backend muss aktuell je nach Tabelle unterschiedlich parsen | Langfristig alle `data`-Spalten auf `JSON` standardisieren und in Migrations-View/Layer konvertieren; Rust-Types beibehalten, DB-Schema vereinheitlichen |
| Data Types | `characters.data TEXT`, Frontend `Character` voll typisiert | Kompletter Charakterzustand als undurchsichtiges JSON in einer Spalte | Datenintegrität, Reporting | HIGH | Alle Charakter-Funktionen in React hängen an diesem JSON-Vertrag; jede Schemaänderung erfolgt rein logisch in TS/Rust, DB kann nicht mitvalidieren | Mittelfristig schrittweise Normalisierung kritischer Bereiche (z.B. HP/Attributes/Proficiencies/Inventory) in eigene Tabellen mit Views, die weiter `id, data` liefern; Frontend später optional auf neue Commands migrieren |
| Constraints | `armor_property_mappings(armor_id)` FK nur auf `armor_properties.property_id`, kein FK auf `core_armors`/`custom_armors` (nur Trigger gegen `all_armors`) | Integrität hängt von Trigger + View ab, nicht von echten FKs | Datenintegrität | MEDIUM | React nutzt `Armor.properties` aus `get_all_armor`; fehlerhafte Mappings könnten zu "Geister"-Properties führen | Optional FK-Layout ergänzen (`armor_id` → `core_armors` / `custom_armors`) über zwei Spalten (`armor_id`, `armor_source`) oder separate Mapping-Tabellen; Frontend unverändert, nur robustere Daten |
| Constraints | `class_starting_equipment.class_id` ohne FK, nur Trigger `validate_class_id_exists` | Klassenreferenzen sind nur logisch abgesichert | Datenintegrität | MEDIUM | Hintergrund-/Klassenausrüstung-UI verlässt sich auf saubere Verknüpfung; kaputte IDs führen zu fehlender Anzeige | Langfristig: Soft-FK-Struktur beibehalten (wegen `core`/`custom`), aber zusätzliche Validierungs-Queries und Admin-Tools im Backend; kein Breaking Change für Frontend |
| Relationships | `characters.inventory` via `CharacterItem` in Rust/TS, aber DB hält nur `characters.data` | Keine DB-seitigen FKs zwischen Charakter-Inventar und `all_items`/`core_items` | Datenintegrität | HIGH | Items/Weapons/Armor können im Kompendium geändert/gelöscht werden ohne DB-seitige Kaskaden; UI muss alles selbst abfangen | Neue Tabellen `character_items`, `character_weapons`, `character_armor` einführen (mit FKs auf `core_*`/`custom_*`) + kompatible View, die beim Laden wieder JSON in `Character.meta`/`Character.inventory` projiziert; Frontend-Migration optional, aber empfohlen |
| Normalization | `core_equipment.items JSON` + normalisierte `core_equipment_items` / `custom_equipment_items` parallel | Legacy-JSON-Felder existieren zusätzlich zu Mapping-Tabellen | Wartbarkeit | MEDIUM | Frontend `Equipment`-Typ nutzt bereits normalisierte `items`,`tools`; JSON-Felder werden im neuen Code nicht mehr benötigt | Im Schema klar zwischen Legacy-JSON und Normalform trennen; JSON-Felder perspektivisch als deprecated markieren und schließlich entfernen, sobald alle alten Importpfade umgestellt sind |
| Naming | `core_mag_items_base.facts_json` vs anderen `data JSON`-Spalten | Uneinheitlicher Name für "strukturierte Zusatzdaten" | Klarheit, Query-Konsistenz | LOW | TS-Typ `MagicItem` spiegelt beides: `facts_json` (string) + `data` (parsed Record). Frontend-Code kippt JSON jedes Mal um | Optional neue Spalte `data JSON` direkt in DB und `facts_json` nur noch als Legacy-String für Export/Debug; Frontend auf `data` als primäre Quelle umstellen (nicht-breaking durch Füllen beider Felder) |
| Indexes | `class_starting_equipment` / `background_starting_equipment` nur mit Basisindizes (class_id/background_id) | Gute Basis, aber keine zusammengesetzten Indizes für häufige Filter (z.B. `class_id, option_label, is_custom`) | Performance | MEDIUM | Betroffen sind Klassenerstellung/Background-Workflows (Dropdowns, Auto-Equip), aktuell ausreichend, aber bei vielen Homebrew-Daten potenziell langsam | Zusätzliche zusammengesetzte Indizes (z.B. `(class_id, is_custom)`, `(background_id, option_label)`) hinzufügen – reines Performance-Upgrade, kein Frontend-Change |
| Naming | `weapon_type` (deprecated), `mastery_id`, `weapon_subtype` | Historisch gewachsen, teils deprecated, teils neu | Wartbarkeit | MEDIUM | TS-`Weapon` enthält noch `weapon_type` (deprecated) und optionale `mastery_id`, `weapon_subtype`; UI könnte noch alte Felder referenzieren | In TS-Komponenten schrittweise auf `mastery_id`/`weapon_subtype` umstellen; `weapon_type` in Views/Types nur read-only Legacy-Feld lassen; kein DB-Umbenennen nötig |

---

## 3. Frontend Impact Assessment – Hauptänderungskategorien

### Change: Charakterdaten schrittweise normalisieren (Inventar & Spell-Slots)

**Current Frontend Behavior**:
- Charaktere werden über einen Tauri-Command (`get_all_characters` analog zu `SELECT_ALL_CHARACTERS`) geladen, DB-Seite: `characters(id TEXT PRIMARY KEY, data TEXT NOT NULL, created_at, updated_at)`
- `data` wird in Rust in `types::character::Character` und dann in TS-`Character` (`src/lib/types.ts`) deserialisiert, inkl. `inventory`, `meta.currency_*`, `spellcasting.slots`
- Komponenten (Charakterbogen, Inventar-/Spell-Management) greifen direkt auf diese strukturierte JSON-Repräsentation zu

**Proposed Schema Change** (vereinfacht, exemplarisch):

```sql
-- Neue Tabellen (Phase 2, parallel zu characters.data)
CREATE TABLE IF NOT EXISTS character_items (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  is_equipped BOOLEAN NOT NULL DEFAULT 0,
  custom_data JSON,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES core_items(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS character_spell_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  character_id TEXT NOT NULL,
  spell_level INTEGER NOT NULL CHECK (spell_level BETWEEN 0 AND 9),
  total INTEGER NOT NULL DEFAULT 0,
  used INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  UNIQUE(character_id, spell_level)
);
```

**Required Frontend Updates** (Phase 2, optional aber empfohlen):

1. **API Layer**:
   - Neue Tauri-Commands `get_character_with_relations`, `update_character_items`, `update_character_spell_slots` einführen, die diese Tabellen nutzen
   - Bestehenden `get_all_characters` unverändert lassen (liefert weiterhin nur JSON-basierten `Character`)

2. **Components**:
   - Charakterbogen/Inventar-Komponenten auf neue API umstellen, wenn du Normalisierung real nutzen möchtest: statt `character.inventory` aus JSON direkt `characterItems`/`spellSlots` aus neuen Commands beziehen
   - Für eine Übergangsphase kannst du eine Hook-Schicht bauen (`useCharacterWithRelations(id)`), die entweder nur JSON oder JSON+Normalform kombiniert

3. **Type Definitions** (TypeScript – neue optionale Typen):

```typescript
export interface CharacterItemRow {
  id: string;
  character_id: string;
  item_id: string;
  quantity: number;
  is_equipped: boolean;
  custom_data?: Record<string, unknown>;
}

export interface CharacterSpellSlotRow {
  id: number;
  character_id: string;
  spell_level: number;
  total: number;
  used: number;
}
```

4. **Migration Script** (Backend, einmalig, nicht-breaking):

```sql
-- Items aus characters.data nach character_items ziehen (Pseudocode, abhängig von JSON-Struktur)
INSERT INTO character_items (id, character_id, item_id, quantity, is_equipped, custom_data)
SELECT 
  json_extract(ci.value, '$.id') as id,
  c.id as character_id,
  json_extract(ci.value, '$.item_id') as item_id,
  json_extract(ci.value, '$.quantity') as quantity,
  json_extract(ci.value, '$.is_equipped') as is_equipped,
  json_extract(ci.value, '$.custom_data') as custom_data
FROM characters c
CROSS JOIN json_each(c.data, '$.inventory') ci;
```

**Breaking Change**: **NO ✅** (solange `characters.data` unverändert bleibt)  
**Estimated Frontend Effort**: **Medium** (voller Umstieg), **Low** (wenn nur Backend-seitig vorbereitet)  
**Can be done gradually**: **YES ✅**

---

### Change: Vereinheitlichung der `data`-/`facts_json`-Spalten

**Current Frontend Behavior**:
- Viele Entities haben `data: Record<string, unknown>` auf TS-Seite, befüllt aus unterschiedlichen DB-Spalten (`data JSON`, `data TEXT`, `facts_json TEXT`)
- Frontend parst teils im Backend, teils im Frontend (z.B. `MagicItem` hat `facts_json: string` + `data`)

**Proposed Schema Change**:
- Neue Spalte `data JSON NOT NULL` in `core_mag_items_base`/`custom_mag_items_base`
- Trigger/Batch-Skripte, die bei Migration `facts_json` → `data` kopieren und bei Inserts/Updates beide im Sync halten

**Required Frontend Updates**:
- Kurzfristig keine: Tauri-Command `get_all_magic_items` befüllt `MagicItem.data` bereits aus `facts_json`
- Mittelfristig kann das Frontend statt `facts_json` direkt `data` als alleinige Quelle nutzen; `facts_json` bleibt als Debug-/Export-Feld bestehen

**Breaking Change**: **NO ✅**  
**Estimated Frontend Effort**: **Low**  
**Can be done gradually**: **YES ✅**

---

### Change: Feature-/Subclass-/Progression-System härter typisieren

**Current Frontend Behavior**:
- Feature-System nutzt `all_class_features`, `all_subclasses`, `all_progression_tables`, `all_feature_options`; TS-Seite existieren derzeit noch keine vollständigen, dedizierten Interfaces für alle Views
- Viel Logik steckt noch im `data`-/`effects`-JSON

**Proposed Schema Change**:
- Kein hartes Redesign nötig, aber: klarere CHECK-Constraints, zusätzliche Indizes, eventuell kleinere Zusatzspalten (z.B. `is_choice_feature BOOLEAN`), um häufige Filter zu beschleunigen und JSON-Parsing zu reduzieren

**Required Frontend Updates**:
- Neue Felder werden in Rust-Types ergänzt und als optionale Felder nach TS gespiegelt
- Komponenten können diese optional nutzen (z.B. zur schnelleren Filterung, ohne JSON zu parsen)

**Breaking Change**: **NO ✅**  
**Estimated Frontend Effort**: **Low**  
**Can be done gradually**: **YES ✅**

---

## 4. Strukturelle Schwächen

### Issue: Charakterzustand vollständig als JSON (`characters.data`)

**Affected**:
- Tabelle `characters`, Rust-Typ `types::character::Character`, TS-Typ `Character` in `src/lib/types.ts`

**Problem**:
- DB hat **keine Sicht** auf Einzelbestandteile (HP, Ausrüstung, Zauber, Währung, Proficiencies), keine FKs zu Kompendium-Tabellen, keine CHECKs auf sinnvolle Werte
- Wartung von Migrationen (z.B. neue Felder im Feature-System) erfordert jeweils komplexe JSON-Manipulation in Scripten/Code statt einfacher ALTER/MIGRATIONs

**Impact**:
- **Database**:
  - Schwache Datenintegrität, kein DB-seitiges "Garbage Collection" von referenzierten Items/Spells
  - Schwierigere Analyse-Abfragen (Reports, Aggregate, Balancing)
- **Frontend**:
  - TS-Types sind stark, aber jede Strukturänderung braucht Backend+Frontend-Sync
  - Keine Möglichkeit, nur Teilbereiche (z.B. nur Inventar) effizient zu laden oder zu sperren

**Evidence**:
```sql
CREATE TABLE IF NOT EXISTS characters (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
);
```

**Frontend Compatibility Notes**:
- Aktuell: Komponenten erwarten einen vollständigen `Character` aus einem einzigen JSON-Feld
- Affected features: Charakterbogen (alle Tabs), Inventar, Zauber-Management, HP-Verwaltung
- Vorschlag: Zuerst **parallele Normalisierungs-Tabellen** nur als interne Optimierung einführen und später optional zusätzliche Commands anbieten

---

### Issue: Uneinheitliche `data`/`facts_json`-Nutzung

**Affected**:
- `core_spells`, `core_species`, `core_classes`, `core_items`, `core_mag_items_base`, `custom_*`-Tabellen

**Problem**:
- `data` ist mal `JSON`, mal `TEXT`; bei Magie-Items wird strukturiertes JSON als String (`facts_json`) geführt und zusätzlich im Backend zu `data` geparst; langfristig entsteht hier Doppelpflege

**Impact**:
- **Database**:
  - Inkonsequente Nutzung von JSON-Funktionen, erhöhte Fehlergefahr bei Migrationen
- **Frontend**:
  - TS-Types gehen immer von strukturiertem Objekt aus (`Record<string, unknown>`), Backend muss jedes Mal über `serde_json` anpassen

**Evidence**:
```sql
CREATE TABLE IF NOT EXISTS core_mag_items_base (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    rarity TEXT NOT NULL,
    category TEXT NOT NULL,
    source_book TEXT,
    source_page INTEGER,
    requires_attunement BOOLEAN NOT NULL DEFAULT 0,
    facts_json TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
);
```

**Frontend Compatibility Notes**:
- `MagicItem`-UI nutzt schon jetzt `data` als geparstes Objekt
- Änderung kann Backend-intern erfolgen, ohne TS/React anzupassen; später kann `facts_json` als reines Legacy-Feld dienen

---

### Issue: Trigger-basierte Integrität statt echter FKs (z.B. `armor_property_mappings`, `weapon_property_mappings`)

**Affected**:
- `weapon_property_mappings`, `armor_property_mappings`, `class_starting_equipment`

**Problem**:
- Integrität von Referenzen auf `all_weapons_unified`/`all_armors` wird über Trigger + Views abgesichert; es gibt **keinen direkten FK** auf `core_weapons`/`custom_weapons` bzw. `core_armors`/`custom_armors`
- Views sind mächtig, aber nicht so robust wie FKs bei Massenoperationen und Import-/Migrationsskripten

**Impact**:
- **Database**:
  - Potenzial für inkonsistente Daten, falls Trigger deaktiviert/umgangen werden
- **Frontend**:
  - `Weapon.properties`/`Armor.properties` werden zur Laufzeit berechnet; unvollständige Mappings könnten UI-Fehler verursachen (fehlende Properties)

**Evidence**:
```sql
CREATE TABLE IF NOT EXISTS armor_property_mappings (
    armor_id TEXT NOT NULL,
    property_id TEXT NOT NULL,
    parameter_value TEXT,
    PRIMARY KEY (armor_id, property_id),
    FOREIGN KEY (property_id) REFERENCES armor_properties(id) ON DELETE CASCADE
);

-- Trigger statt FK
DROP TRIGGER IF EXISTS validate_armor_id;
CREATE TRIGGER validate_armor_id
BEFORE INSERT ON armor_property_mappings
BEGIN
    SELECT CASE
        WHEN NOT EXISTS (SELECT 1 FROM all_armors WHERE id = NEW.armor_id)
        THEN RAISE(ABORT, 'armor_id must exist in all_armors (core_armors or custom_armors)')
    END;
END;
```

**Frontend Compatibility Notes**:
- Aktuelle Komponenten erhalten bereits eine "bereinigte" Sicht über die Commands; echte FKs würden Verhalten nicht ändern, nur Daten robuster machen
- Kein direkter Migrationsdruck auf Frontend

---

## 5. Optimierungs-Roadmap mit Frontend-Sync

### Phase 1: Low-Risk Quick Wins (0–2 Wochen)

**Database Changes**:
- Ergänzende **Indizes**:
  - `CREATE INDEX IF NOT EXISTS idx_bg_equipment_bg_option ON background_starting_equipment(background_id, option_label);`
  - `CREATE INDEX IF NOT EXISTS idx_class_equipment_class_custom ON class_starting_equipment(class_id, is_custom);`
- Vereinheitlichung kleiner Datentypen: explizit `BOOLEAN` → integer-checks dokumentieren, aber DB-seitig unverändert lassen
- Zusätzliche **Views** mit schmaler Projektion für Frontend (z.B. `all_weapons_minimal`, `all_items_minimal`) zur schnelleren Listenanzeige

**Frontend Changes**:
- Keine erforderlich; bestehende Commands und Views bleiben unverändert
- Optional: Liste/Tabellen-Views im Frontend auf "minimale" Commands umstellen für bessere Performance

**Deployment**: unabhängig deploybar ✅

---

### Phase 2: Medium-Risk Improvements (1–3 Monate)

**Database Changes**:
- Einführung von **normalisierten Charakter-Relationen** (`character_items`, `character_spell_slots`, ggf. `character_currency`)
- Vereinheitlichung `data`/`facts_json`-Spalten (zunächst Add-on `data JSON`)
- Stärkere Constraints und FKs für Mapping-Tabellen, wo möglich (z.B. zusätzliche Tabellen `custom_weapon_property_mappings` falls nötig)

**Frontend Changes**:
- Neue Commands im API-Layer; React-Komponenten, die Inventar/Zauber-Slots bearbeiten, können optional auf neue Commands wechseln
- Anpassungen in TS-Types für neue Response-Objekte (zusätzliche Interfaces, bestehende bleiben unangetastet)

**Deployment**: koordinierte Migration (DB + neue Backend-Commands), Frontend kann aber in mehreren Steps migriert werden

**Migration Strategy**:
1. DB: neue Tabellen + Views/Triggers anlegen, ohne alte Felder zu ändern
2. Backend: neue Commands implementieren und in `src/lib/api.ts` verfügbar machen
3. Frontend: Feature-weise auf neue Commands umstellen (z.B. zunächst Inventar, später Spell-Slots)
4. Nach Stabilisierung: Legacy-Felder als deprecated markieren, später ggf. entfernen

---

### Phase 3: High-Impact Schema Redesign (3+ Monate)

**Database Changes**:
- Tiefere Normalisierung von Feature-/Klassen-/Spell-Daten (z.B. Effekte aus JSON in Tabellen, klare Many-to-Many-Tabellen für Feature-Prerequisites)
- Optionales Redesign von `characters` hin zu klarerem relationalen Modell mit mehreren Views, die weiterhin ein "virtuelles" `Character`-Objekt liefern

**Frontend Changes**:
- Größerer Refactor des Datenlayers: Hooks/Stores, die bisher reines JSON erwarten, müssen auf neue APIs umgestellt werden
- State-Management und Berechnungslogik (z.B. Modifier-System) könnten direkt auf normalisierte Daten zugreifen

**Deployment**: eher "Feature-Branch + Feature-Flag"-Ansatz; evtl. Big-Bang für bestimmte Teilbereiche (z.B. Feature-System)

**Risk Mitigation**:
- Neue API-Endpunkte als `v2` parallel zu den alten; Komponenten über Feature-Flags umschalten
- Extensive Tests mit Test-DBs via Rust-Binaries (`run_migrations`, `test_*`)

---

## 6. Konkrete Verbesserungen mit SQL + Frontend-Beispielen

### Beispiel 1: Schnellere Klassenausrüstung über Index

```sql
-- Phase 1: Index auf häufige Filter
CREATE INDEX IF NOT EXISTS idx_class_equipment_class_custom
  ON class_starting_equipment(class_id, is_custom);
```

**Frontend**: Keine Änderung nötig; `Background`-/`Class`-Wizards profitieren nur von schnellerem Laden.

---

### Beispiel 2: Magic-Item-`data` normalisieren

```sql
ALTER TABLE core_mag_items_base ADD COLUMN data JSON;
ALTER TABLE custom_mag_items_base ADD COLUMN data JSON;

-- Initiale Migration
UPDATE core_mag_items_base
SET data = json(facts_json)
WHERE data IS NULL;

UPDATE custom_mag_items_base
SET data = json(facts_json)
WHERE data IS NULL;
```

**Backend (Rust – Pseudocode)**:
```rust
// Beim Laden zuerst `data`, Fallback auf `facts_json`
let facts_json: String = row.get(7)?;
let data_value: Value = row.get::<_, Option<String>>(9)
    .and_then(|s| serde_json::from_str(&s).ok())
    .unwrap_or_else(|| serde_json::from_str(&facts_json).unwrap_or_default());
```

**Frontend (TS – optional später)**:
```typescript
// MagicItem-UI kann langfristig `facts_json` ignorieren
function renderMagicItem(mi: MagicItem) {
  const details = mi.data; // statt JSON.parse(mi.facts_json)
  // ...
}
```

---

### Beispiel 3: Zusätzliche View für "leichte" Waffenliste

```sql
CREATE VIEW IF NOT EXISTS all_weapons_minimal AS
SELECT id, name, category, damage_dice, damage_type, cost_gp
FROM all_weapons_unified;
```

**Frontend**:
```typescript
// api.ts
export async function fetchWeaponsMinimal() {
  return invoke<Weapon[]>(/* tauri command z.B. get_all_weapons_minimal */);
}

// Komponente: Listenansicht nutzt Minimal-View, Detailansicht den vollen Satz
```

---

### Beispiel 4: Feature-Prerequisites gezielter abfragen

```sql
CREATE INDEX IF NOT EXISTS idx_feature_prerequisites_feature_type
  ON feature_prerequisites(feature_id, prerequisite_type);
```

**Frontend**: Filterung z.B. nach Level/Feature-Typ wird in Feature-UI schneller, keine Codeänderung nötig.

---

### Beispiel 5: Background-Equipment effizienter gruppieren

```sql
-- Kompatible View, die Optionen je Background gruppiert
CREATE VIEW IF NOT EXISTS background_equipment_grouped AS
SELECT 
  background_id,
  option_label,
  json_group_array(
    json_object(
      'item_name', item_name,
      'item_id', item_id,
      'tool_id', tool_id,
      'weapon_id', weapon_id,
      'quantity', quantity,
      'gold', gold,
      'is_gold', is_gold
    )
  ) AS entries
FROM background_starting_equipment
GROUP BY background_id, option_label;
```

**Frontend (TypeScript-Beispiel)**:
```typescript
interface BackgroundEquipmentOption {
  label: string;
  entries: Array<{
    item_name: string;
    item_id?: string;
    tool_id?: string;
    weapon_id?: string;
    quantity: number;
    gold?: number;
    is_gold: boolean;
  }>;
}

// API-Layer kann diese View nutzen, um Background-Formulare direkt zu speisen
```

---

## 7. Frontend-Migrations-Checkliste

### Charakter-Inventar-Normalisierung – Frontend Migration Checklist

**Database Changes**
- [ ] Tabelle `character_items` anlegen
- [ ] Migrationsskript von `characters.data.inventory` → `character_items` ausführen
- [ ] Optionale View `character_with_items` erstellen, die `characters.data` + Items zusammenführt
- [ ] Datenintegrität mit SELECT-Queries prüfen (Anzahl Items pro Charakter vergleichen)
- [ ] Rollback-Skript vorbereiten (zurückkopieren von `character_items` nach `characters.data`)

**Frontend Changes**
- [ ] Neue Tauri-Commands im Backend erstellen (`get_character_items`, `update_character_items`)
- [ ] API-Layer (`src/lib/api.ts`) um Wrapper für diese Commands ergänzen
- [ ] Optionale neue TS-Interfaces (`CharacterItemRow`) anlegen
- [ ] Inventar-Komponenten so umbauen, dass sie wahlweise JSON-basiert oder tabellenbasiert arbeiten (Feature Flag)
- [ ] Fehlerbehandlung anpassen, falls DB-Constraints (FKs) Verletzungen melden

**Testing**
- [ ] Unit-Tests für neue Backend-Commands (Rust)
- [ ] Integrationstests: Charakter laden, Item hinzufügen/entfernen, Equip/Unequip
- [ ] Manuelle Tests:
  - [ ] Bestehenden Charakter mit Inventar laden
  - [ ] Neuen Charakter anlegen und Inventar füllen
  - [ ] Items im Kompendium löschen/ändern und Verhalten prüfen

**Deployment**
- [ ] DB-Migration ausrollen (Tauri-App startet `run_migrations`)
- [ ] Frontend-Update mit optionaler Flag-Unterstützung ausrollen
- [ ] Logs/Fehler für 48h manuell beobachten (insb. DB-Fehler aus Tauri-Fehler-Logging)
- [ ] Nach Stabilisierung entscheiden, ob die JSON-Inventar-Struktur weiterhin gepflegt werden muss

**Rollback Plan**
1. Frontend auf alte JSON-basierte Inventar-Logik zurückschalten
2. `character_items` nur lesend nutzen oder per Skript wieder in `characters.data` zurückschreiben
3. Bei schwerwiegenden Fehlern: Backup-DB (`dnd-nexus.db.backup_*`) zurückspielen

---

## 8. Naming Convention Style Guide

### Tabellen
- **Core-Regelwerk**: `core_<entity>` (z.B. `core_spells`, `core_weapons`, `core_armors`)
- **Custom/Homebrew**: `custom_<entity>` (z.B. `custom_spells`, `custom_weapons`)
- **Mapping-Tabellen**: `<entity1>_<entity2>_mappings` (z.B. `weapon_property_mappings`, `armor_property_mappings`)
- **Junction-Tabellen**: `<entity1>_<entity2>` (z.B. `core_equipment_items`, `core_equipment_tools`)
- **Views**: `all_<entity>` (vereint `core_*` + `custom_*` mit `source`-Spalte)

### Spalten
- **IDs**: `id TEXT PRIMARY KEY` (für Kompendium-Entities), `id INTEGER PRIMARY KEY AUTOINCREMENT` (für Relationen)
- **Foreign Keys**: `<entity>_id TEXT` (z.B. `character_id`, `weapon_id`, `property_id`)
- **Timestamps**: `created_at INTEGER DEFAULT (unixepoch())`, `updated_at INTEGER DEFAULT (unixepoch())`
- **Booleans**: `BOOLEAN NOT NULL DEFAULT 0` (SQLite speichert als INTEGER 0/1)
- **JSON-Daten**: `data JSON` (wenn strukturiert), `data TEXT` (wenn Legacy/String-basiert)
- **Deutsche Labels**: `category_label TEXT` (für UI-Anzeige, z.B. "Einfache Waffen", "Leichte Rüstung")

### Indizes
- **Namen**: `idx_<table>_<column(s)>` (z.B. `idx_core_spells_name`, `idx_class_equipment_class_custom`)
- **Composite Indizes**: für häufige Filter-Kombinationen (z.B. `(class_id, is_custom)`, `(background_id, option_label)`)

---

## 9. Validierungs-Queries

### Schema-Konsistenz prüfen

```sql
-- Prüfe, ob alle Waffen in weapon_property_mappings existieren
SELECT w.id, w.name
FROM all_weapons_unified w
LEFT JOIN weapon_property_mappings wpm ON wpm.weapon_id = w.id
WHERE wpm.weapon_id IS NULL;

-- Prüfe, ob alle Rüstungen in armor_property_mappings existieren (optional)
SELECT a.id, a.name
FROM all_armors a
LEFT JOIN armor_property_mappings apm ON apm.armor_id = a.id
WHERE apm.armor_id IS NULL;

-- Prüfe, ob class_starting_equipment auf gültige Klassen verweist
SELECT cse.class_id, cse.is_custom
FROM class_starting_equipment cse
WHERE (cse.is_custom = 0 AND NOT EXISTS (SELECT 1 FROM core_classes WHERE id = cse.class_id))
   OR (cse.is_custom = 1 AND NOT EXISTS (SELECT 1 FROM custom_classes WHERE id = cse.class_id));
```

### Performance-Analyse

```sql
-- Prüfe Index-Nutzung (SQLite-spezifisch)
EXPLAIN QUERY PLAN
SELECT * FROM all_weapons_unified w
LEFT JOIN weapon_property_mappings wpm ON wpm.weapon_id = w.id
WHERE w.category = 'simple_melee';

-- Prüfe View-Performance
EXPLAIN QUERY PLAN
SELECT * FROM all_equipment e
LEFT JOIN core_equipment_items cei ON cei.equipment_id = e.id
WHERE e.source = 'core';
```

---

## 10. Zusammenfassung & Nächste Schritte

### Prioritäten

1. **Sofort umsetzbar (Phase 1)**:
   - Zusätzliche Indizes für `class_starting_equipment`, `background_starting_equipment`
   - Minimal-Views für Listenansichten (`all_weapons_minimal`, `all_items_minimal`)
   - Dokumentation der aktuellen Schema-Struktur in diesem Report

2. **Mittelfristig (Phase 2)**:
   - Normalisierung von `characters.inventory` in `character_items`
   - Vereinheitlichung `data`/`facts_json`-Spalten
   - Stärkere Constraints für Mapping-Tabellen

3. **Langfristig (Phase 3)**:
   - Tiefere Normalisierung von Feature-/Klassen-Daten
   - Optionales Redesign von `characters`-Schema

### Empfohlene Vorgehensweise

1. **Dokumentation**: Dieser Report sollte in `docs/` gepflegt und bei Schema-Änderungen aktualisiert werden
2. **Migrations-Tests**: Vor jeder größeren Schema-Änderung Test-DB mit Beispieldaten füllen und Migrationsskripte testen
3. **Frontend-Sync**: Bei jeder DB-Änderung prüfen, ob TS-Types und Tauri-Commands angepasst werden müssen
4. **Graduale Migration**: Immer kompatible Views/Commands parallel zu neuen Strukturen anbieten, um Frontend schrittweise migrieren zu können

---

**Ende des Reports**
