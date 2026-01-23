# Konzept: Klassen-Schema-Erweiterung

## 1. Analyse: Aktueller Stand

### 1.1 Datenbank-Schema
```sql
CREATE TABLE IF NOT EXISTS core_classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    data TEXT NOT NULL,  -- JSON-String
    created_at INTEGER DEFAULT (unixepoch())
);
```

**Aktueller Inhalt von `data`:**
- `hit_die?: number` (optional, in einigen Klassen vorhanden)
- `subclasses?: Array<{id: string, name: string}>`
- Weitere Felder unstrukturiert im JSON

### 1.2 TypeScript-Interface (aktuell)
```typescript
export interface ClassData {
  hit_die?: number;
  subclasses?: Array<{ id: string; name: string }>;
  [key: string]: unknown;
}
```

### 1.3 Lücken-Identifikation

**Fehlende Felder:**
- ✅ `hit_die` - teilweise vorhanden, muss strukturiert werden
- ❌ `primary_attributes` - Liste der Hauptattribute (z.B. ["str"], ["dex", "wis"])
- ❌ `saving_throws` - Liste der geübten Rettungswürfe
- ❌ `skill_choices` - Anzahl + verfügbare Fertigkeiten
- ❌ `tool_proficiencies` - Werkzeugvertrautheiten
- ❌ `weapon_proficiencies` - Waffenvertrautheiten (bisher nur im JSON)
- ❌ `armor_proficiencies` - Rüstungsvertrautheiten (bisher nur im JSON)
- ❌ `starting_equipment` - Anfangsausrüstung mit Wahlmöglichkeiten (A/B/C)

## 2. Vorgeschlagenes Schema-Design

### 2.1 Erweiterte ClassData-Struktur (JSON in `data`-Feld)

**Grundprinzip:** Erweiterung des bestehenden JSON-`data`-Felds mit strukturierten Objekten.

```typescript
export interface ClassData {
  // Bestehend (behalten)
  hit_die?: number;
  subclasses?: Array<{ id: string; name: string }>;
  
  // NEU: Hauptattribute
  primary_attributes: string[]; // z.B. ["str"], ["dex", "wis"], ["str", "cha"]
  
  // NEU: Rettungswürfe (geübt)
  saving_throws: string[]; // z.B. ["str", "con"], ["dex", "cha"]
  
  // NEU: Fertigkeits-Optionen
  skill_choices: {
    choose: number; // Anzahl wählbarer Fertigkeiten
    from: string[]; // Liste der verfügbaren Fertigkeiten (Skill-IDs)
  };
  
  // NEU: Werkzeugvertrautheit (hybrid: feste IDs + Kategorien für Wahl)
  tool_proficiencies?: {
    fixed?: string[]; // Feste Werkzeuge (Tool-IDs, z.B. ["diebeswerkzeug"])
    choose?: {
      count: number; // Anzahl wählbarer Werkzeuge
      from_category?: string[]; // Tool-Kategorien (z.B. ["musikinstrument", "handwerkszeug"])
      from?: string[]; // Optionale Einzel-IDs (falls keine Kategorie)
    };
  };
  
  // NEU: Waffenvertrautheit
  weapon_proficiencies: {
    simple_weapons: boolean;
    martial_weapons: boolean;
    additional?: string[]; // Waffen-Eigenschaften (Properties) aus weapon_properties
    // z.B. ["light", "finesse"] → Filter: weapons.filter(w => w.category === 'martial' && w.properties.includes('light'))
  };
  
  // NEU: Rüstungsvertrautheit
  armor_proficiencies: {
    light_armor?: boolean;
    medium_armor?: boolean;
    heavy_armor?: boolean;
    shields?: boolean;
  };
  
  // NEU: Multiclassing-Voraussetzungen (optional)
  multiclassing?: {
    prerequisites: Array<{ attribute: string; value: number }>; // z.B. [{attribute: "dex", value: 13}]
    proficiencies_gained?: {
      armor?: { light_armor?: boolean; medium_armor?: boolean; heavy_armor?: boolean; shields?: boolean };
      weapons?: { simple_weapons?: boolean; martial_weapons?: boolean };
      tools?: string[]; // Tool-IDs oder Kategorien
      skills?: string[]; // Skill-IDs
    };
  };
  
  // Legacy/weitere Felder
  [key: string]: unknown;
}
```

### 2.2 Neue Tabelle: `class_starting_equipment`

**Analogie:** `background_starting_equipment` (Zeilen 977-996 in migrations.rs)

**Design-Entscheidung:** Separate normalisierte Tabelle für Anfangsausrüstung, da:
- Mehrere Wahlmöglichkeiten (A/B/C) pro Klasse
- Items können Waffen, Rüstungen, Werkzeuge, Items oder Gold sein
- Referenzen zu existierenden Tabellen (foreign keys)
- Bessere Query-Performance bei Equipment-Lookup

```sql
CREATE TABLE IF NOT EXISTS class_starting_equipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id TEXT NOT NULL,
    option_label TEXT,  -- 'A', 'B', 'C' oder NULL für feste Items
    item_name TEXT NOT NULL,  -- Name des Items (z.B. 'Lederrüstung', 'Zweihandaxt', 'GOLD')
    item_id TEXT,  -- FK zu core_items/custom_items (falls gefunden)
    tool_id TEXT,  -- FK zu core_tools/custom_tools (falls Tool)
    weapon_id TEXT,  -- FK zu core_weapons/custom_weapons (falls Waffe)
    armor_id TEXT,  -- FK zu core_armors/custom_armors (falls Rüstung)
    quantity INTEGER DEFAULT 1,
    is_variant BOOLEAN DEFAULT 0,  -- TRUE für Varianten wie 'Dolch (x5)'
    base_item_name TEXT,  -- Basis-Name ohne Variante
    variant_suffix TEXT,  -- Varianten-Suffix (z.B. '(x5)')
    gold REAL,  -- Gold-Menge (nur wenn item_name = 'GOLD')
    is_gold BOOLEAN DEFAULT 0,  -- TRUE wenn dies ein Gold-Eintrag ist
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (class_id) REFERENCES core_classes(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES core_items(id) ON DELETE SET NULL,
    FOREIGN KEY (tool_id) REFERENCES core_tools(id) ON DELETE SET NULL,
    FOREIGN KEY (weapon_id) REFERENCES core_weapons(id) ON DELETE SET NULL,
    FOREIGN KEY (armor_id) REFERENCES core_armors(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_class_equipment_class ON class_starting_equipment(class_id);
CREATE INDEX IF NOT EXISTS idx_class_equipment_option ON class_starting_equipment(class_id, option_label);
CREATE INDEX IF NOT EXISTS idx_class_equipment_item ON class_starting_equipment(item_id);
CREATE INDEX IF NOT EXISTS idx_class_equipment_weapon ON class_starting_equipment(weapon_id);
CREATE INDEX IF NOT EXISTS idx_class_equipment_armor ON class_starting_equipment(armor_id);
```

### 2.3 Normalisierung vs. JSON: Entscheidung

**Anfangsausrüstung:** → **Separate Tabelle** (`class_starting_equipment`)
- **Vorteile:** Foreign Keys, Query-Performance, konsistent mit Background-Pattern
- **Nachteil:** Zusätzliche JOINs bei Queries

**Alle anderen Felder (Attributes, Saving Throws, Skills, Proficiencies):** → **JSON im `data`-Feld**
- **Vorteile:** Einfache Struktur, keine zusätzlichen Tabellen, ausreichend für statische Daten
- **Grund:** Diese Felder ändern sich selten und werden meist komplett geladen

## 3. Technische Umsetzung

### 3.1 Migration-Strategie

**Schritt 1: Schema-Erweiterung**
- Neue Tabelle `class_starting_equipment` in `migrations.rs` hinzufügen
- View `all_classes` bleibt unverändert (nutzt `data`-Feld)

**Schritt 2: TypeScript-Interfaces aktualisieren**
- `ClassData` in `src/lib/types.ts` erweitern
- Rust-Typen (falls vorhanden) entsprechend anpassen

**Schritt 3: Daten-Mapping**
- Script zur Transformation der Rohdaten in neue Struktur
- Mapping für alle 12 Klassen (Barbar bis Zauberer)

### 3.2 Daten-Mapping-Beispiel

**Beispiel: Barbar**

**Eingabe (Rohdaten):**
```
- Hauptattribut: Stärke
- Trefferpunktewürfel: 1W12
- Rettungswürfe: Stärke und Konstitution
- Fertigkeiten: Wähle zwei aus: Athletik, Einschüchtern, ...
- Anfangsausrüstung: (A) Zweihandaxt, vier Beile, Entdeckerausrüstung und 15 GM
                     (B) 75 GM
```

**Ausgabe (strukturiert):**

**JSON in `core_classes.data`:**
```json
{
  "hit_die": 12,
  "primary_attributes": ["str"],
  "saving_throws": ["str", "con"],
  "skill_choices": {
    "choose": 2,
    "from": ["athletik", "einschuechtern", "mit_tieren_umgehen", "naturkunde", "ueberlebenskunst", "wahrnehmung"]
  },
  "weapon_proficiencies": {
    "simple_weapons": true,
    "martial_weapons": true
  },
  "armor_proficiencies": {
    "light_armor": true,
    "medium_armor": true,
    "shields": true
  },
  "multiclassing": {
    "prerequisites": [
      { "attribute": "str", "value": 13 }
    ]
  }
}
```

**Hinweis:** Anfangsausrüstung wird direkt über `class_starting_equipment` abgefragt:
```sql
SELECT * FROM class_starting_equipment WHERE class_id = 'barbar' ORDER BY option_label;
```

**Einträge in `class_starting_equipment`:**
```
Option A:
- Zweihandaxt (weapon_id: "zweihandaxt", quantity: 1, option_label: "A")
- Beil (weapon_id: "beil", quantity: 4, option_label: "A")
- Entdeckerausrüstung (item_id: "entdeckerausruestung", quantity: 1, option_label: "A")
- GOLD (gold: 15, is_gold: true, option_label: "A")

Option B:
- GOLD (gold: 75, is_gold: true, option_label: "B")
```

## 4. Abgleich mit bestehenden Daten

### 4.1 Waffen- und Rüstungsvertrautheiten

**Prüfung nötig:** Abgleich mit existierenden Waffen-/Rüstungstabellen:
- `core_weapons.category` → `simple_weapons` vs `martial_weapons`
- `core_armors.category` → `leichte_ruestung`, `mittelschwere_ruestung`, `schwere_ruestung`, `schild`

**Vorgehen:** Referenzierung über `category_label` (bereits vorhanden) oder direkte Kategorien.

### 4.2 Fertigkeiten-Mapping

**Fertigkeiten-Tabelle:** `core_skills` enthält `id`, `name`, `ability`

**Mapping:** Deutsche Namen (z.B. "Athletik") → Skill-IDs (z.B. "athletik")

**Validierung:** Prüfen, ob alle erwähnten Fertigkeiten in `core_skills` existieren.

## 5. Zusammenfassung der Änderungen

### Dateien, die modifiziert werden:

1. **`src-tauri/src/db/migrations.rs`**
   - Neue Tabelle `class_starting_equipment` hinzufügen
   - Indizes hinzufügen

2. **`src/lib/types.ts`**
   - `ClassData`-Interface erweitern

3. **Neue Datei: `src-tauri/src/bin/import_class_data.rs`** (oder ähnlich)
   - Script zur Datentransformation und -import für 12 Klassen

4. **Optional: `src-tauri/src/types/compendium.rs`**
   - Rust-Strukturen erweitern (falls nötig)

### Migration ohne Breaking Changes:

- ✅ Bestehende `core_classes`/`custom_classes` bleiben unverändert
- ✅ `data`-Feld wird erweitert (backward-compatible durch `[key: string]: unknown]`)
- ✅ Neue Tabelle ist optional (keine Foreign Key Constraints auf Klassen-Tabelle)
- ✅ Views bleiben unverändert

## 6. Entscheidungen (beantwortet)

### 6.1 Werkzeugvertrautheit "Wähle X aus"
**✅ Entscheidung:** Hybrides Array mit `fixed` (Tool-IDs) und `choose.from_category` (Kategorien)

**Beispiel (Schurke):**
```typescript
tool_proficiencies: {
  fixed: ["diebeswerkzeug"]
}
```

**Beispiel (Barde):**
```typescript
tool_proficiencies: {
  choose: {
    count: 3,
    from_category: ["musikinstrument"]
  }
}
```

**Vorteil:** UI kann Items mit entsprechender Kategorie filtern, ohne alle ~20 Instrumente zu listen.

### 6.2 Anfangsausrüstung: Referenzierung
**✅ Entscheidung:** Tabelle direkt abfragen (kein `starting_equipment_ref`-Feld nötig)

**Query:**
```sql
SELECT * FROM class_starting_equipment WHERE class_id = ? ORDER BY option_label;
```

**Vorteil:** `class_id` ist bereits Foreign Key, verhindert Inkonsistenzen.

### 6.3 Waffenvertrautheit "mit Eigenschaft X"
**✅ Entscheidung:** `additional`-Array mit Waffen-Properties (aus `weapon_properties`-Tabelle)

**Beispiel (Schurke):**
```typescript
weapon_proficiencies: {
  simple_weapons: true,
  martial_weapons: true,
  additional: ["light", "finesse"] // Nur Kriegswaffen mit diesen Eigenschaften
}
```

**Filter-Logik:**
```typescript
weapons.filter(w => 
  w.category === 'martial' && 
  w.properties.some(p => ['light', 'finesse'].includes(p))
);
```

**Vorteil:** Nutzt existierende Property-Struktur, einfache Filter-Logik im Code.

### 6.4 Gold-Beträge
**✅ Entscheidung:** Separate Einträge in `class_starting_equipment` mit `is_gold: true`

**Vorteil:** Konsistent mit Background-Pattern, ermöglicht "Startgold statt Ausrüstung"-Logiken in UI.

### 6.5 Multiclassing-Voraussetzungen (Ergänzung)
**✅ Entscheidung:** Optionales `multiclassing`-Feld im JSON mit:
- `prerequisites`: Array von Attribut-Anforderungen (z.B. `{attribute: "dex", value: 13}`)
- `proficiencies_gained`: Reduzierte Proficiencies bei Multiclassing (oft weniger als Level 1)

**Beispiel:**
```typescript
multiclassing: {
  prerequisites: [{ attribute: "str", value: 13 }],
  proficiencies_gained: {
    armor: { light_armor: true, medium_armor: true, shields: true },
    weapons: { simple_weapons: true, martial_weapons: true }
  }
}
```

---

**Status:** ✅ Konzept finalisiert → Bereit für Implementierung
