# Rüstungen-Import & Eigenschaften-Mapping: Konzept

## Übersicht

**KRITISCH:** Schema-Anpassungen für RK-Formeln und An-/Ablegezeiten + **Mapping-Tabelle erforderlich** (magische/verzauberte Rüstungen, künftige Sonder-Eigenschaften).

**Quelle:** PHB 2024, Kapitel 6, Seite 219

---

## Problemstellung

### Aktueller Zustand

```sql
-- Rüstungen mit direkten Feldern
SELECT * FROM core_armors 
WHERE strength_requirement IS NOT NULL 
  AND stealth_disadvantage = 1;
```

**Aktuelle Struktur:**
- ⚠️ `base_ac INTEGER NOT NULL` - **PROBLEM:** Passt nicht für "11 + GES" oder "+2"
- ✅ `strength_requirement` (INTEGER) - Direktes Feld
- ✅ `stealth_disadvantage` (BOOLEAN) - Direktes Feld
- ✅ `category` (TEXT) - "Leichte Rüstung", "Mittelschwere Rüstung", etc.
- ✅ `data.dex_bonus` (JSON) - DEX-Bonus-Regeln
- ❌ `don_time_minutes` - **FEHLT**
- ❌ `doff_time_minutes` - **FEHLT**
- ❌ `ac_bonus` - **FEHLT** (für Schilde)
- ❌ `ac_formula` - **FEHLT** (für Formeln)

**KRITISCHE Probleme:**
- ❌ `base_ac` als INTEGER passt nicht für Formeln ("11 + GES", "12 + GES (max. 2)")
- ❌ Schilde haben "+2" als Bonus, nicht als base_ac
- ❌ An-/Ablegezeiten fehlen komplett
- ⚠️ Zukünftige Eigenschaften schwer hinzufügbar
- ⚠️ Keine Typsicherheit für neue Eigenschaften

### Zielzustand (NOTWENDIG für magische Rüstungen)

```sql
-- Flexiblere Abfragen mit Mapping-Tabelle
SELECT a.* FROM all_armors a
JOIN armor_property_mappings apm ON a.id = apm.armor_id
WHERE apm.property_id IN ('schwer', 'magisch');
```

**Vorteile:**
- ✅ Flexibilität für magische Rüstungen
- ✅ Typsicherheit durch FOREIGN KEYs
- ✅ Einfache Erweiterung
- ✅ **NOTWENDIG** für magische/verzauberte Rüstungen

**Hinweis:**
- ✅ Mapping-Tabelle ist **NOTWENDIG**, da magische Rüstungen geplant sind
- ✅ Ermöglicht komplexe Eigenschaften (z.B. "+1 Rüstung", "Rüstung des Widerstands")

---

## Datenbank-Schema

### 1. Rüstungen-Tabellen (ANPASSUNG NÖTIG)

```sql
-- ANPASSUNG: Schema erweitern für RK-Formeln und An-/Ablegezeiten
CREATE TABLE core_armors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN (
        'leichte_ruestung',
        'mittelschwere_ruestung',
        'schwere_ruestung',
        'schild'
    )),
    base_ac INTEGER,  -- NULL für Formeln (z.B. "11 + GES")
    ac_bonus INTEGER DEFAULT 0,  -- NEU: Für Schilde ("+2")
    ac_formula TEXT,  -- NEU: z.B. "11 + DEX", "12 + DEX (max. 2)", "14"
    strength_requirement INTEGER,  -- STÄ 13 oder STÄ 15
    stealth_disadvantage BOOLEAN NOT NULL DEFAULT 0,
    don_time_minutes INTEGER,  -- NEU: Anlegezeit in Minuten
    doff_time_minutes INTEGER,  -- NEU: Ablegezeit in Minuten
    weight_kg REAL NOT NULL,
    cost_gp REAL NOT NULL,
    data JSON NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
);
```

**Kategorien:**
- `leichte_ruestung` → "Leichte Rüstung" (1 Min. An/Ablegen)
- `mittelschwere_ruestung` → "Mittelschwere Rüstung" (5 Min. An / 1 Min. Ab)
- `schwere_ruestung` → "Schwere Rüstung" (10 Min. An / 5 Min. Ab)
- `schild` → "Schild" (1 Aktion An/Ablegen)

**RK-Formeln (PHB 2024):**
- **Leicht**: `11 + GES` oder `12 + GES` (kein Limit)
- **Mittel**: `12 + GES (max. 2)` bis `15 + GES (max. 2)`
- **Schwer**: Feste Werte (`14`, `16`, `17`, `18`) - KEIN DEX-Bonus
- **Schild**: `+2` (Bonus, nicht base_ac!)

**An-/Ablegezeiten:**
- **Leicht**: 1 Min (An und Ab)
- **Mittel**: 5 Min (An) / 1 Min (Ab)
- **Schwer**: 10 Min (An) / 5 Min (Ab)
- **Schild**: 1 Aktion (An und Ab)

### 2. Eigenschaften-Tabelle (NEU - NOTWENDIG)

```sql
-- NEU: Rüstungen-Eigenschaften Definition
-- NOTWENDIG für magische Rüstungen und zukünftige Erweiterungen
CREATE TABLE armor_properties (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    affects_field TEXT,  -- z.B. "strength_requirement", "stealth_disadvantage", "ac_bonus"
    data JSON,
    created_at INTEGER DEFAULT (unixepoch())
);
```

**Beispiel-Eigenschaften:**

| ID | Name | affects_field | Beschreibung |
|---|---|---|---|
| `schwer` | Schwer | `strength_requirement` | Erfordert Stärke-Wert (STÄ 13 oder STÄ 15) |
| `stealth_nachteil` | Stealth Nachteil | `stealth_disadvantage` | Nachteil bei Heimlichkeitswürfen |
| `magisch` | Magisch | `ac_bonus` | Magische Rüstung mit AC-Bonus |
| `verzaubert` | Verzaubert | `ac_bonus` | Verzauberte Rüstung mit speziellen Eigenschaften |
| `widerstand` | Widerstand | `damage_resistance` | Rüstung des Widerstands (Schadenstyp im parameter_value) |
| `immunitaet` | Immunität | `damage_immunity` | Rüstung der Immunität (Schadenstyp im parameter_value) |

**Hinweis:** `schild` ist eine Kategorie, keine Eigenschaft. Schilde werden über `category = 'schild'` identifiziert.

**Magische Rüstungen:**
- `+1 Rüstung`: `ac_bonus: 1` im parameter_value
- `+2 Rüstung`: `ac_bonus: 2` im parameter_value
- `+3 Rüstung`: `ac_bonus: 3` im parameter_value
- `Rüstung des Widerstands`: `damage_type: "Feuer"` im parameter_value

### 3. Mapping-Tabelle (NEU - NOTWENDIG)

```sql
-- NEU: Verknüpfung Rüstungen ↔ Eigenschaften
-- NOTWENDIG für magische Rüstungen und zukünftige Erweiterungen
-- Unterstützt sowohl core_armors als auch custom_armors via all_armors View

-- View: Alle Rüstungen (core + custom) vereint (bereits vorhanden in migrations.rs)
-- Die bestehende all_armors View wird genutzt:
-- CREATE VIEW all_armors AS 
-- SELECT COALESCE(c.id, core.id) as id, ...
-- FROM core_armors core LEFT JOIN custom_armors c ON c.parent_id = core.id 
-- UNION 
-- SELECT id, ... FROM custom_armors WHERE parent_id IS NULL;

-- Mapping-Tabelle mit vereinfachter Referenzierung
CREATE TABLE armor_property_mappings (
    armor_id TEXT NOT NULL,
    property_id TEXT NOT NULL,
    parameter_value TEXT,  -- JSON für komplexe Parameter (z.B. Stärke-Wert, AC-Bonus)
    
    PRIMARY KEY (armor_id, property_id),
    FOREIGN KEY (property_id) REFERENCES armor_properties(id),
    -- FOREIGN KEY wird über View validiert (armor_id muss in all_armors existieren)
    CHECK (EXISTS (SELECT 1 FROM all_armors WHERE id = armor_id))
);

CREATE INDEX idx_armor_property_armor ON armor_property_mappings(armor_id);
CREATE INDEX idx_armor_property_property ON armor_property_mappings(property_id);
```

**Hinweis:** Die bestehende `all_armors` View (aus `migrations.rs`) wird genutzt, um sowohl `core_armors` als auch `custom_armors` zu unterstützen. Die Mapping-Tabelle funktioniert mit beiden.

**parameter_value Strukturen:**

```json
// Schwer (mit Stärke-Wert)
{
    "strength_requirement": 13
}

// Magisch (mit AC-Bonus)
{
    "ac_bonus": 1,
    "enchantment_level": 1
}

// +2 Rüstung
{
    "ac_bonus": 2,
    "enchantment_level": 2
}

// Rüstung des Widerstands (Feuer)
{
    "damage_type": "Feuer",
    "resistance_type": "Schaden"
}

// Rüstung der Immunität (Blitz)
{
    "damage_type": "Blitz",
    "immunity_type": "Schaden"
}
```

**Hinweis:** Die Mapping-Tabelle ist **NOTWENDIG**, da magische Rüstungen verschiedene Eigenschaften haben können (AC-Bonus, Widerstand, Immunität, etc.).

---

## Abfrage-Beispiele

### 1. Alle schweren Rüstungen

```sql
SELECT 
    a.id,
    a.name,
    a.category,
    a.base_ac,
    json_extract(apm.parameter_value, '$.strength_requirement') as strength_req
FROM all_armors a
JOIN armor_property_mappings apm ON a.id = apm.armor_id
WHERE apm.property_id = 'schwer'
ORDER BY a.base_ac DESC;
```

### 2. Rüstungen mit Stealth-Nachteil (Core + Custom)

```sql
SELECT 
    a.id,
    a.name,
    a.category,
    a.base_ac,
    a.source
FROM all_armors a
JOIN armor_property_mappings apm ON a.id = apm.armor_id
WHERE apm.property_id = 'stealth_nachteil'
ORDER BY a.source, a.category, a.name;
```

### 3. Magische Rüstungen (Core + Custom)

```sql
SELECT 
    a.id,
    a.name,
    a.base_ac,
    a.ac_formula,
    a.source,
    json_extract(apm.parameter_value, '$.ac_bonus') as ac_bonus,
    json_extract(apm.parameter_value, '$.enchantment_level') as enchantment_level
FROM all_armors a
JOIN armor_property_mappings apm ON a.id = apm.armor_id
WHERE apm.property_id IN ('magisch', 'verzaubert')
ORDER BY a.source, ac_bonus DESC, a.base_ac DESC;
```

### 3a. Rüstungen mit Widerstand (Core + Custom)

```sql
SELECT 
    a.id,
    a.name,
    a.source,
    json_extract(apm.parameter_value, '$.damage_type') as damage_type
FROM all_armors a
JOIN armor_property_mappings apm ON a.id = apm.armor_id
WHERE apm.property_id = 'widerstand'
ORDER BY a.source, damage_type, a.name;
```

### 4. Alle Rüstungen (Core + Custom) mit Eigenschaften

```sql
SELECT 
    a.id,
    a.name,
    a.category,
    a.source,
    json_group_array(ap.name) as properties
FROM all_armors a
LEFT JOIN armor_property_mappings apm ON a.id = apm.armor_id
LEFT JOIN armor_properties ap ON apm.property_id = ap.id
GROUP BY a.id, a.name, a.category, a.source
ORDER BY a.source, a.category, a.name;
```

### 4. Rüstungen für bestimmte Stärke-Anforderung

```sql
SELECT 
    a.id,
    a.name,
    a.base_ac,
    json_extract(apm.parameter_value, '$.strength_requirement') as strength_req
FROM all_armors a
JOIN armor_property_mappings apm ON a.id = apm.armor_id
WHERE apm.property_id = 'schwer'
  AND json_extract(apm.parameter_value, '$.strength_requirement') <= 13
ORDER BY strength_req, a.base_ac DESC;
```

---

## Schema-Anpassungen (KRITISCH)

### Problem: base_ac als INTEGER

**Aktuell:**
```sql
base_ac INTEGER NOT NULL  -- ❌ Passt nicht für "11 + GES" oder "+2"
```

**Lösung:**
```sql
base_ac INTEGER,  -- NULL für Formeln
ac_bonus INTEGER DEFAULT 0,  -- Für Schilde ("+2")
ac_formula TEXT,  -- "11 + DEX", "12 + DEX (max. 2)", "14"
```

### Problem: An-/Ablegezeiten fehlen

**Lösung:**
```sql
don_time_minutes INTEGER,  -- Anlegezeit
doff_time_minutes INTEGER,  -- Ablegezeit
```

### Migration: Schema erweitern

**File:** `migrations/007_update_armor_schema.sql`

```sql
-- Migration: Rüstungen-Schema erweitern
-- Datum: 2025-01-12

-- 1. Neue Felder hinzufügen
ALTER TABLE core_armors ADD COLUMN ac_bonus INTEGER DEFAULT 0;
ALTER TABLE core_armors ADD COLUMN ac_formula TEXT;
ALTER TABLE core_armors ADD COLUMN don_time_minutes INTEGER;
ALTER TABLE core_armors ADD COLUMN doff_time_minutes INTEGER;

-- 2. base_ac NULL erlauben (für Formeln)
-- SQLite unterstützt kein ALTER COLUMN, daher:
-- - Alte Daten migrieren
-- - Neue Struktur verwenden

-- 3. Bestehende Daten migrieren
UPDATE core_armors 
SET ac_formula = CASE
    WHEN category = 'leichte_ruestung' THEN '11 + DEX'
    WHEN category = 'mittelschwere_ruestung' THEN '12 + DEX (max. 2)'
    WHEN category = 'schwere_ruestung' THEN CAST(base_ac AS TEXT)
    WHEN category = 'schild' THEN '+2'
END,
don_time_minutes = CASE
    WHEN category = 'leichte_ruestung' THEN 1
    WHEN category = 'mittelschwere_ruestung' THEN 5
    WHEN category = 'schwere_ruestung' THEN 10
    WHEN category = 'schild' THEN 0  -- 1 Aktion (nicht in Minuten)
END,
doff_time_minutes = CASE
    WHEN category = 'leichte_ruestung' THEN 1
    WHEN category = 'mittelschwere_ruestung' THEN 1
    WHEN category = 'schwere_ruestung' THEN 5
    WHEN category = 'schild' THEN 0  -- 1 Aktion
END,
ac_bonus = CASE
    WHEN category = 'schild' THEN 2
    ELSE 0
END;

-- 4. base_ac für Formeln auf NULL setzen
UPDATE core_armors 
SET base_ac = NULL 
WHERE category IN ('leichte_ruestung', 'mittelschwere_ruestung', 'schild');

-- 5. base_ac für schwere Rüstungen beibehalten (feste Werte)
-- base_ac bleibt für schwere Rüstungen (14, 16, 17, 18)
```

---

## Migration-Strategie

### Phase 1: Schema erweitern

Siehe oben: `migrations/007_update_armor_schema.sql`

### Phase 2: Eigenschaften-Tabelle und Mapping-Tabelle erstellen

**Migration:** `migrations/008_add_armor_property_mappings.sql`

```sql
-- Migration: Rüstungen-Eigenschaften-Mapping
-- Datum: 2025-01-12
-- Erweitert: Unterstützung für custom_armors via all_armors View

-- 1. Eigenschaften-Tabelle erstellen
CREATE TABLE IF NOT EXISTS armor_properties (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    affects_field TEXT,
    data JSON,
    created_at INTEGER DEFAULT (unixepoch())
);

-- 2. Mapping-Tabelle erstellen (unterstützt core + custom via all_armors View)
-- Hinweis: all_armors View ist bereits in migrations.rs vorhanden
CREATE TABLE IF NOT EXISTS armor_property_mappings (
    armor_id TEXT NOT NULL,
    property_id TEXT NOT NULL,
    parameter_value TEXT,
    
    PRIMARY KEY (armor_id, property_id),
    FOREIGN KEY (property_id) REFERENCES armor_properties(id)
);

-- 3. Trigger: Validiere armor_id existiert in all_armors (core oder custom)
CREATE TRIGGER IF NOT EXISTS validate_armor_id
BEFORE INSERT ON armor_property_mappings
BEGIN
    SELECT CASE
        WHEN NOT EXISTS (SELECT 1 FROM all_armors WHERE id = NEW.armor_id)
        THEN RAISE(ABORT, 'armor_id must exist in all_armors (core_armors or custom_armors)')
    END;
END;

-- 4. Trigger: Validiere parameter_value JSON
CREATE TRIGGER IF NOT EXISTS validate_armor_property_parameter
BEFORE INSERT ON armor_property_mappings
WHEN json_valid(parameter_value) = 0 AND parameter_value IS NOT NULL
BEGIN
    SELECT RAISE(ABORT, 'parameter_value must be valid JSON or NULL');
END;

-- 5. Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_armor_property_armor ON armor_property_mappings(armor_id);
CREATE INDEX IF NOT EXISTS idx_armor_property_property ON armor_property_mappings(property_id);
```
<｜tool▁calls▁begin｜><｜tool▁call▁begin｜>
read_file

### Phase 3: Eigenschaften importieren

**Script:** `scripts/import-armor-properties.ts`

```typescript
const properties = [
    {
        id: 'schwer',
        name: 'Schwer',
        description: 'Erfordert einen bestimmten Stärke-Wert, um effektiv getragen zu werden.',
        affects_field: 'strength_requirement'
    },
    {
        id: 'stealth_nachteil',
        name: 'Stealth Nachteil',
        description: 'Nachteil bei Heimlichkeitswürfen.',
        affects_field: 'stealth_disadvantage'
    },
    {
        id: 'magisch',
        name: 'Magisch',
        description: 'Magische Rüstung mit zusätzlichen Boni (z.B. +1, +2, +3).',
        affects_field: 'ac_bonus'
    },
    {
        id: 'verzaubert',
        name: 'Verzaubert',
        description: 'Verzauberte Rüstung mit speziellen Eigenschaften.',
        affects_field: 'ac_bonus'
    },
    {
        id: 'widerstand',
        name: 'Widerstand',
        description: 'Rüstung des Widerstands gegen bestimmte Schadenstypen.',
        affects_field: 'damage_resistance'
    },
    {
        id: 'immunitaet',
        name: 'Immunität',
        description: 'Rüstung der Immunität gegen bestimmte Schadenstypen.',
        affects_field: 'damage_immunity'
    }
];

async function importArmorProperties() {
    const db = new Database();
    
    for (const prop of properties) {
        await db.insert('armor_properties', {
            id: prop.id,
            name: prop.name,
            description: prop.description,
            affects_field: prop.affects_field,
            data: JSON.stringify({})
        });
    }
    
    console.log(`✅ ${properties.length} Eigenschaften importiert`);
}
```

### Phase 4: Bestehende Daten migrieren

**Script:** `scripts/migrate-armor-properties.ts`

```typescript
async function migrateArmorProperties() {
    const db = new Database();
    
    // 1. Alle Rüstungen abrufen (core + custom via all_armors View)
    const armors = await db.query(`
        SELECT id, name, category, strength_requirement, stealth_disadvantage, source
        FROM all_armors
    `);
    
    console.log(`Migrating ${armors.length} armors (core + custom)...`);
    
    let migrated = 0;
    
    for (const armor of armors) {
        // 2. "Schwer" Eigenschaft (wenn strength_requirement vorhanden)
        // Nur bei schweren Rüstungen: STÄ 13 oder STÄ 15
        if (armor.strength_requirement !== null && 
            armor.category === 'schwere_ruestung') {
            await db.insert('armor_property_mappings', {
                armor_id: armor.id,
                property_id: 'schwer',
                parameter_value: JSON.stringify({
                    strength_requirement: armor.strength_requirement
                })
            });
        }
        
        // 3. "Stealth Nachteil" Eigenschaft
        if (armor.stealth_disadvantage) {
            await db.insert('armor_property_mappings', {
                armor_id: armor.id,
                property_id: 'stealth_nachteil',
                parameter_value: null
            });
        }
        
        // HINWEIS: "Schild" ist eine Kategorie, keine Eigenschaft!
        // Schilde werden über category = 'schild' identifiziert
        
        migrated++;
        process.stdout.write(`\r  Fortschritt: ${migrated}/${armors.length} (${armor.source})`);
    }
    
    console.log(`\n✅ ${migrated} Rüstungen migriert (core + custom)`);
}
```

---

## Validierung

**Script:** `scripts/validate-armor-properties.ts`

```typescript
async function validateArmorPropertyMappings() {
    const errors = [];
    
    // 1. Alle property_ids existieren
    const invalidProperties = await db.query(`
        SELECT apm.armor_id, apm.property_id
        FROM armor_property_mappings apm
        LEFT JOIN armor_properties ap ON apm.property_id = ap.id
        WHERE ap.id IS NULL
    `);
    
    if (invalidProperties.length > 0) {
        errors.push({
            type: 'invalid_property',
            count: invalidProperties.length,
            items: invalidProperties
        });
    }
    
    // 2. Alle armor_ids existieren
    const invalidArmors = await db.query(`
        SELECT apm.armor_id, apm.property_id
        FROM armor_property_mappings apm
        LEFT JOIN core_armors a ON apm.armor_id = a.id
        WHERE a.id IS NULL
    `);
    
    if (invalidArmors.length > 0) {
        errors.push({
            type: 'invalid_armor',
            count: invalidArmors.length,
            items: invalidArmors
        });
    }
    
    // 3. Konsistenz: "Schwer" sollte parameter_value haben
    const missingStrength = await db.query(`
        SELECT apm.armor_id, apm.property_id
        FROM armor_property_mappings apm
        WHERE apm.property_id = 'schwer'
          AND (apm.parameter_value IS NULL
               OR json_extract(apm.parameter_value, '$.strength_requirement') IS NULL)
    `);
    
    if (missingStrength.length > 0) {
        errors.push({
            type: 'missing_strength_requirement',
            count: missingStrength.length,
            items: missingStrength
        });
    }
    
    // Ergebnis
    if (errors.length > 0) {
        console.error('❌ Validierung fehlgeschlagen:');
        errors.forEach(error => {
            console.error(`  - ${error.type}: ${error.count} Fehler`);
        });
        throw new Error('Armor property validation failed');
    }
    
    console.log('✅ Validierung erfolgreich!');
}
```

---

## Frontend-Integration

### TypeScript Types

```typescript
// src/lib/types/armors.ts
export interface Armor {
    id: string;
    name: string;
    category: string;
    base_ac: number;
    strength_requirement: number | null;  // BEHALTEN (Legacy)
    stealth_disadvantage: boolean;  // BEHALTEN (Legacy)
    weight_kg: number;
    cost_gp: number;
    properties?: ArmorProperty[];  // NEU (optional)
    data: ArmorData;
    source: 'core' | 'homebrew' | 'override';
}

export interface ArmorProperty {
    id: string;
    name: string;
    description: string;
    parameter?: {
        strength_requirement?: number;
        ac_bonus?: number;
        enchantment_level?: number;
    };
}
```

---

## Rüstungsdaten-Import (PHB 2024, Seite 219)

### Vollständige Rüstungstabelle

**Leichte Rüstung (1 Min. An/Ablegen):**

| Name | RK | Stärke | Heimlichkeit | Gewicht | Kosten |
|---|---|---|---|---|---|
| Gepolsterte Rüstung | 11 + GES | — | Nachteil | 4 kg | 5 GM |
| Lederrüstung | 11 + GES | — | — | 5 kg | 10 GM |
| Beschlagene Lederrüstung | 12 + GES | — | — | 6,5 kg | 45 GM |

**Mittelschwere Rüstung (5 Min. An / 1 Min. Ab):**

| Name | RK | Stärke | Heimlichkeit | Gewicht | Kosten |
|---|---|---|---|---|---|
| Fellrüstung | 12 + GES (max. 2) | — | — | 6 kg | 10 GM |
| Kettenhemd | 13 + GES (max. 2) | — | — | 10 kg | 50 GM |
| Schuppenpanzer | 14 + GES (max. 2) | — | Nachteil | 22,5 kg | 50 GM |
| Brustplatte | 14 + GES (max. 2) | — | — | 10 kg | 400 GM |
| Plattenpanzer | 15 + GES (max. 2) | — | Nachteil | 20 kg | 750 GM |

**Schwere Rüstung (10 Min. An / 5 Min. Ab):**

| Name | RK | Stärke | Heimlichkeit | Gewicht | Kosten |
|---|---|---|---|---|---|
| Ringpanzer | 14 | — | Nachteil | 20 kg | 30 GM |
| Kettenpanzer | 16 | STÄ 13 | Nachteil | 27,5 kg | 75 GM |
| Schienenpanzer | 17 | STÄ 15 | Nachteil | 30 kg | 200 GM |
| Ritterrüstung | 18 | STÄ 15 | Nachteil | 32,5 kg | 1.500 GM |

**Schild (1 Aktion An/Ablegen):**

| Name | RK | Stärke | Heimlichkeit | Gewicht | Kosten |
|---|---|---|---|---|---|
| Schild | +2 | — | — | 3 kg | 10 GM |

### Import-Datenstruktur

```typescript
interface ArmorImport {
    id: string;
    name: string;
    category: 'leichte_ruestung' | 'mittelschwere_ruestung' | 'schwere_ruestung' | 'schild';
    base_ac: number | null;  // NULL für Formeln
    ac_bonus: number;  // Für Schilde
    ac_formula: string;  // "11 + DEX", "12 + DEX (max. 2)", "14", "+2"
    strength_requirement: number | null;  // STÄ 13 oder STÄ 15
    stealth_disadvantage: boolean;
    don_time_minutes: number;  // Anlegezeit
    doff_time_minutes: number;  // Ablegezeit
    weight_kg: number;
    cost_gp: number;
    data: {
        dex_bonus: {
            apply: boolean;
            max: number | null;  // max. 2 für mittelschwere
        };
        source_page: number;
    };
}
```

### Beispiel: Lederrüstung

```typescript
{
    id: 'lederruestung',
    name: 'Lederrüstung',
    category: 'leichte_ruestung',
    base_ac: null,  // Formel verwendet
    ac_bonus: 0,
    ac_formula: '11 + DEX',
    strength_requirement: null,
    stealth_disadvantage: false,
    don_time_minutes: 1,
    doff_time_minutes: 1,
    weight_kg: 5.0,
    cost_gp: 10.0,
    data: {
        dex_bonus: {
            apply: true,
            max: null  // Kein Limit bei leichter Rüstung
        },
        source_page: 219
    }
}
```

### Beispiel: Kettenpanzer

```typescript
{
    id: 'kettenpanzer',
    name: 'Kettenpanzer',
    category: 'schwere_ruestung',
    base_ac: 16,  // Fester Wert
    ac_bonus: 0,
    ac_formula: '16',  // Kein DEX-Bonus
    strength_requirement: 13,  // STÄ 13
    stealth_disadvantage: true,
    don_time_minutes: 10,
    doff_time_minutes: 5,
    weight_kg: 27.5,
    cost_gp: 75.0,
    data: {
        dex_bonus: {
            apply: false,  // Schwere Rüstung: kein DEX
            max: null
        },
        source_page: 219
    }
}
```

### Beispiel: Schild

```typescript
{
    id: 'schild',
    name: 'Schild',
    category: 'schild',
    base_ac: null,  // Kein base_ac, sondern Bonus
    ac_bonus: 2,  // +2 Bonus
    ac_formula: '+2',
    strength_requirement: null,
    stealth_disadvantage: false,
    don_time_minutes: 0,  // 1 Aktion (nicht in Minuten)
    doff_time_minutes: 0,  // 1 Aktion
    weight_kg: 3.0,
    cost_gp: 10.0,
    data: {
        dex_bonus: {
            apply: false,
            max: null
        },
        is_action: true,  // 1 Aktion statt Minuten
        source_page: 219
    }
}
```

---

## Zusammenfassung & Checkliste

### ✅ KRITISCHE Schema-Anpassungen (MUSS):

1. **base_ac erweitern**
   - `base_ac INTEGER` → `base_ac INTEGER | NULL`
   - NULL für Formeln ("11 + GES", "12 + GES (max. 2)")

2. **Neue Felder hinzufügen**
   - `ac_bonus INTEGER` (für Schilde: "+2")
   - `ac_formula TEXT` (Formel als String)
   - `don_time_minutes INTEGER` (Anlegezeit)
   - `doff_time_minutes INTEGER` (Ablegezeit)

3. **AC-Berechnung anpassen**
   - Formeln parsen ("11 + DEX", "12 + DEX (max. 2)")
   - Schilde als Bonus behandeln (nicht base_ac)

### ✅ Mapping-Tabelle (JETZT ERFORDERLICH):

**Warum jetzt Pflicht?**
- Magische/verzauberte Rüstungen müssen sauber modelliert werden.
- Zusätzliche Eigenschaften (z.B. Boni, Verzauberungsstufen) sollen ohne Schema-Änderung gepflegt werden.
- Abfragen nach Eigenschaften (magisch, stealth_nachteil, schwer) werden einfacher.

**Vorteile:**
- Flexibilität für zukünftige Eigenschaften
- Typsicherheit durch FOREIGN KEYs
- Erweiterbarkeit (magische Rüstungen) ohne Schema-Änderungen

**Nachteile:**
- Zusätzliche Komplexität (2 Tabellen + Migration)

### 📋 Implementation Checklist:

**HOHE Priorität (MUSS):**
- [ ] Schema erweitern (`ac_bonus`, `ac_formula`, `don_time_minutes`, `doff_time_minutes`)
- [ ] `base_ac` NULL erlauben
- [ ] Mapping-Schema anlegen (`armor_properties`, `armor_property_mappings`)
- [ ] Eigenschaften importieren (magisch, verzaubert, schwer, stealth_nachteil, ggf. schild)
- [ ] Bestehende Daten migrieren (Properties + Stärke/Stealth)
- [ ] AC-Berechnung anpassen (Formeln parsen)
- [ ] Schilde korrekt behandeln (Bonus statt base_ac)
- [ ] Rüstungen aus PHB importieren (13 Rüstungen + 1 Schild)
- [ ] Validierungsskript laufen lassen

### 🎯 Priorität:

**SCHEMA-ANPASSUNGEN + MAPPING: HOCH** - Müssen vor/mit dem Import durchgeführt werden!

---

## Empfehlung

1. **Zuerst:** Schema-Anpassungen durchführen (HOCH)
2. **Dann:** Rüstungen importieren (HOCH)
3. **Später:** Mapping-Tabelle (nur bei Bedarf)

**Schema-Anpassungen sind KRITISCH**, da das aktuelle Schema die RK-Formeln nicht korrekt abbilden kann!
