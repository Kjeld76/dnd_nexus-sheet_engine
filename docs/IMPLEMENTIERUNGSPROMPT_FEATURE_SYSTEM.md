# Implementierungs-Prompt: Feature-System vollumfänglich umsetzen

## Kontext

Basierend auf der `VERBESSERUNGSANALYSE.md` muss das Feature-System vollständig implementiert werden. Die Analyse hat kritische Architektur-Lücken identifiziert, die behoben werden müssen, bevor das System funktionsfähig ist.

**Referenzdokumente:**
- `docs/VERBESSERUNGSANALYSE.md` - Gesamtbeurteilung
- `docs/IMPLEMENTIERUNGSKONZEPT_FEATURE_SYSTEM.md` - Detailliertes Konzept
- `docs/CLASS_MIGRATION_AND_FEATURES_CONCEPT.md` - Original-Konzept
- `docs/FRONTEND_FEATURE_DOCUMENTATION_CONCEPT.md` - Frontend-Konzept
- `custom_classes verbesserung.md` - Kritische Schema-Verbesserungen
- `verbesserungen_konzept.md` - Weitere Verbesserungen

---

## Aufgabe

Implementiere das Feature-System vollständig gemäß dem `IMPLEMENTIERUNGSKONZEPT_FEATURE_SYSTEM.md`. Beginne mit Phase 0 (Schema-Korrekturen) und arbeite dich systematisch durch alle Phasen.

**WICHTIG:** 
- Alle Änderungen müssen dem bestehenden Projekt-Pattern folgen (`core_*` / `custom_*` Trennung)
- Konsistenz mit bestehenden Views, Indizes und Triggern
- Type-Safety zwischen Frontend und Backend
- Vollständige Validierung auf DB- und Runtime-Ebene

---

## Phase 0: Schema-Korrekturen (SOFORT) 🔴

### Schritt 1: Neue Tabellen in `migrations.rs` hinzufügen

**Datei:** `src-tauri/src/db/migrations.rs`

1. **Finde die Stelle nach `class_starting_equipment` (ca. Zeile 1062)**
2. **Füge die neuen Tabellen hinzu:**

```sql
-- Core Class Features
CREATE TABLE IF NOT EXISTS core_class_features (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL,
    subclass_id TEXT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    level INTEGER NOT NULL,
    feature_type TEXT NOT NULL CHECK(feature_type IN (
        'passive', 'active', 'progression', 'choice', 'reaction', 'bonus_action'
    )),
    effects JSON NOT NULL,
    conditions JSON,
    uses_per_rest TEXT,
    rest_type TEXT CHECK(rest_type IN ('short', 'long', NULL)),
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (class_id) REFERENCES core_classes(id) ON DELETE CASCADE
);

-- Custom Class Features
CREATE TABLE IF NOT EXISTS custom_class_features (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL,
    class_source TEXT NOT NULL CHECK(class_source IN ('core', 'custom')),
    subclass_id TEXT,
    subclass_source TEXT CHECK(subclass_source IN ('core', 'custom', NULL)),
    parent_id TEXT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    level INTEGER NOT NULL,
    feature_type TEXT NOT NULL CHECK(feature_type IN (
        'passive', 'active', 'progression', 'choice', 'reaction', 'bonus_action'
    )),
    effects JSON NOT NULL,
    conditions JSON,
    uses_per_rest TEXT,
    rest_type TEXT CHECK(rest_type IN ('short', 'long', NULL)),
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (parent_id) REFERENCES core_class_features(id) ON DELETE SET NULL
);

-- Core Subclasses
CREATE TABLE IF NOT EXISTS core_subclasses (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    level INTEGER NOT NULL,
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (class_id) REFERENCES core_classes(id) ON DELETE CASCADE
);

-- Custom Subclasses
CREATE TABLE IF NOT EXISTS custom_subclasses (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL,
    class_source TEXT NOT NULL CHECK(class_source IN ('core', 'custom')),
    parent_id TEXT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    level INTEGER NOT NULL,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (parent_id) REFERENCES core_subclasses(id) ON DELETE SET NULL
);

-- Core Progression Tables
CREATE TABLE IF NOT EXISTS core_progression_tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id TEXT NOT NULL,
    level INTEGER NOT NULL,
    proficiency_bonus INTEGER NOT NULL,
    feature_names TEXT,
    class_specific_data JSON,
    created_at INTEGER DEFAULT (unixepoch()),
    UNIQUE(class_id, level),
    FOREIGN KEY (class_id) REFERENCES core_classes(id) ON DELETE CASCADE
);

-- Custom Progression Tables
CREATE TABLE IF NOT EXISTS custom_progression_tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id TEXT NOT NULL,
    level INTEGER NOT NULL,
    proficiency_bonus INTEGER NOT NULL,
    feature_names TEXT,
    class_specific_data JSON,
    created_at INTEGER DEFAULT (unixepoch()),
    UNIQUE(class_id, level),
    FOREIGN KEY (class_id) REFERENCES custom_classes(id) ON DELETE CASCADE
);
```

### Schritt 2: Indizes hinzufügen

**Nach den Tabellen-Erstellungen, vor den Views:**

```sql
-- Class Features Indizes
CREATE INDEX IF NOT EXISTS idx_core_features_class_level ON core_class_features(class_id, level);
CREATE INDEX IF NOT EXISTS idx_core_features_subclass ON core_class_features(subclass_id);
CREATE INDEX IF NOT EXISTS idx_custom_features_class_level ON custom_class_features(class_id, level);
CREATE INDEX IF NOT EXISTS idx_custom_features_subclass ON custom_class_features(subclass_id);
CREATE INDEX IF NOT EXISTS idx_custom_features_parent ON custom_class_features(parent_id);

-- Subclasses Indizes
CREATE INDEX IF NOT EXISTS idx_core_subclasses_class ON core_subclasses(class_id);
CREATE INDEX IF NOT EXISTS idx_custom_subclasses_class ON custom_subclasses(class_id);
CREATE INDEX IF NOT EXISTS idx_custom_subclasses_parent ON custom_subclasses(parent_id);

-- Progression Tables Indizes
CREATE INDEX IF NOT EXISTS idx_core_progression_class_level ON core_progression_tables(class_id, level);
CREATE INDEX IF NOT EXISTS idx_custom_progression_class_level ON custom_progression_tables(class_id, level);
```

### Schritt 3: Views zu DROP-Liste hinzufügen

**Am Anfang der `run_migrations` Funktion, nach Zeile 27:**

```sql
DROP VIEW IF EXISTS all_class_features;
DROP VIEW IF EXISTS all_subclasses;
DROP VIEW IF EXISTS all_progression_tables;
```

### Schritt 4: Unified Views erstellen

**Nach den bestehenden Views (nach Zeile 725):**

```sql
-- View: all_class_features
CREATE VIEW all_class_features AS
SELECT 
    id,
    class_id,
    NULL as class_source,
    subclass_id,
    NULL as subclass_source,
    NULL as parent_id,
    name,
    description,
    level,
    feature_type,
    effects,
    conditions,
    uses_per_rest,
    rest_type,
    'core' as source,
    created_at,
    NULL as updated_at
FROM core_class_features

UNION ALL

SELECT 
    id,
    class_id,
    class_source,
    subclass_id,
    subclass_source,
    parent_id,
    name,
    description,
    level,
    feature_type,
    effects,
    conditions,
    uses_per_rest,
    rest_type,
    CASE 
        WHEN parent_id IS NOT NULL THEN 'override'
        ELSE 'custom'
    END as source,
    created_at,
    updated_at
FROM custom_class_features;

-- View: all_subclasses
CREATE VIEW all_subclasses AS
SELECT 
    id,
    class_id,
    'core' as class_source,
    NULL as parent_id,
    name,
    description,
    level,
    'core' as source,
    created_at,
    NULL as updated_at
FROM core_subclasses

UNION ALL

SELECT 
    id,
    class_id,
    class_source,
    parent_id,
    name,
    description,
    level,
    CASE 
        WHEN parent_id IS NOT NULL THEN 'override'
        ELSE 'custom'
    END as source,
    created_at,
    updated_at
FROM custom_subclasses;

-- View: all_progression_tables
CREATE VIEW all_progression_tables AS
SELECT 
    id,
    class_id,
    level,
    proficiency_bonus,
    feature_names,
    class_specific_data,
    'core' as source,
    created_at
FROM core_progression_tables

UNION ALL

SELECT 
    id,
    class_id,
    level,
    proficiency_bonus,
    feature_names,
    class_specific_data,
    'custom' as source,
    created_at
FROM custom_progression_tables;
```

### Schritt 5: Validierungs-Trigger hinzufügen

**Nach den bestehenden Triggern (nach Zeile 1061):**

```sql
-- Trigger: Validiere custom_class_features Referenzen
DROP TRIGGER IF EXISTS validate_custom_feature_class_reference;
CREATE TRIGGER validate_custom_feature_class_reference
BEFORE INSERT ON custom_class_features
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN NEW.class_source = 'core' AND 
             (SELECT COUNT(*) FROM core_classes WHERE id = NEW.class_id) = 0
        THEN RAISE(ABORT, 'class_id must exist in core_classes when class_source=core')
        
        WHEN NEW.class_source = 'custom' AND 
             (SELECT COUNT(*) FROM custom_classes WHERE id = NEW.class_id) = 0
        THEN RAISE(ABORT, 'class_id must exist in custom_classes when class_source=custom')
    END;
END;

-- Trigger: Validiere custom_subclasses Referenzen
DROP TRIGGER IF EXISTS validate_custom_subclass_reference;
CREATE TRIGGER validate_custom_subclass_reference
BEFORE INSERT ON custom_subclasses
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN NEW.class_source = 'core' AND 
             (SELECT COUNT(*) FROM core_classes WHERE id = NEW.class_id) = 0
        THEN RAISE(ABORT, 'class_id must exist in core_classes')
        
        WHEN NEW.class_source = 'custom' AND 
             (SELECT COUNT(*) FROM custom_classes WHERE id = NEW.class_id) = 0
        THEN RAISE(ABORT, 'class_id must exist in custom_classes')
    END;
END;

-- Trigger: Validiere Feature-Effekte JSON-Struktur (Core)
DROP TRIGGER IF EXISTS validate_feature_effects;
CREATE TRIGGER validate_feature_effects
BEFORE INSERT ON core_class_features
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN json_type(NEW.effects) != 'object'
        THEN RAISE(ABORT, 'effects must be a JSON object')
        WHEN json_extract(NEW.effects, '$.when_active') IS NOT NULL 
             AND json_type(json_extract(NEW.effects, '$.when_active')) != 'array'
        THEN RAISE(ABORT, 'when_active must be an array')
        WHEN json_extract(NEW.effects, '$.when_passive') IS NOT NULL 
             AND json_type(json_extract(NEW.effects, '$.when_passive')) != 'array'
        THEN RAISE(ABORT, 'when_passive must be an array')
    END;
END;

-- Trigger: Validiere Feature-Effekte JSON-Struktur (Custom)
DROP TRIGGER IF EXISTS validate_feature_effects_custom;
CREATE TRIGGER validate_feature_effects_custom
BEFORE INSERT ON custom_class_features
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN json_type(NEW.effects) != 'object'
        THEN RAISE(ABORT, 'effects must be a JSON object')
        WHEN json_extract(NEW.effects, '$.when_active') IS NOT NULL 
             AND json_type(json_extract(NEW.effects, '$.when_active')) != 'array'
        THEN RAISE(ABORT, 'when_active must be an array')
        WHEN json_extract(NEW.effects, '$.when_passive') IS NOT NULL 
             AND json_type(json_extract(NEW.effects, '$.when_passive')) != 'array'
        THEN RAISE(ABORT, 'when_passive must be an array')
    END;
END;
```

### Schritt 6: TypeScript-Types erweitern

**Datei:** `src/lib/types.ts`

**Am Ende der Datei hinzufügen:**

```typescript
export type EntitySource = 'core' | 'custom' | 'override';

export interface BaseEntity {
  id: string;
  source: EntitySource;
  created_at: number;
}

export interface Feature extends BaseEntity {
  class_id: string;
  class_source: 'core' | 'custom';
  subclass_id?: string;
  subclass_source?: 'core' | 'custom';
  parent_id?: string;
  name: string;
  description: string;
  level: number;
  feature_type: 'passive' | 'active' | 'progression' | 'choice' | 'reaction' | 'bonus_action';
  effects: FeatureEffects;
  conditions?: FeatureConditions;
  uses_per_rest?: string | number;
  rest_type?: 'short' | 'long';
  updated_at?: number;
}

export interface Subclass extends BaseEntity {
  class_id: string;
  class_source: 'core' | 'custom';
  parent_id?: string;
  name: string;
  description: string;
  level: number;
  updated_at?: number;
}

export interface ProgressionTableRow {
  id: number;
  class_id: string;
  level: number;
  proficiency_bonus: number;
  feature_names: string[];
  class_specific_data: Record<string, unknown>;
  source: 'core' | 'custom';
  created_at: number;
}

// Erweitere FeatureTracking
export interface FeatureTracking {
  active_features: Record<string, ActiveFeatureState>;
  feature_choices: Record<string, FeatureChoice>;
  feature_history: FeatureHistoryEntry[];
  modifier_trace: ModifierTrace[];
  last_synced: number;
  version: number;
}
```

**WICHTIG:** Stelle sicher, dass `FeatureEffects`, `FeatureConditions`, `ActiveFeatureState`, `FeatureChoice`, `FeatureHistoryEntry` und `ModifierTrace` bereits definiert sind (siehe `FRONTEND_FEATURE_DOCUMENTATION_CONCEPT.md`).

---

## Phase 1: Backend-Funktionalität 🟠

### Schritt 7: Feature Loader implementieren

**Neue Datei:** `src/lib/features/featureLoader.ts`

```typescript
import { Character, Feature } from '../types';
import { invoke } from '@tauri-apps/api/core';

export async function loadCharacterFeatures(
  character: Character,
  classData: { id: string; source: EntitySource },
  subclassId?: string
): Promise<Feature[]> {
  const level = character.meta.level;
  const classId = classData.id;
  
  const features = await invoke<Feature[]>('get_class_features', {
    classId,
    level,
    subclassId: subclassId || null
  });
  
  const deduplicated = deduplicateFeatures(features);
  
  return deduplicated;
}

function deduplicateFeatures(features: Feature[]): Feature[] {
  const featureMap = new Map<string, Feature>();
  const overrideIds = new Set<string>();
  
  // Sammle Override-IDs
  for (const feature of features) {
    if (feature.source === 'override' && feature.parent_id) {
      overrideIds.add(feature.parent_id);
    }
  }
  
  // Dedupliziere
  for (const feature of features) {
    // Überspringe Core-Features, die überschrieben werden
    if (feature.source === 'core' && overrideIds.has(feature.id)) {
      continue;
    }
    
    // Override hat Priorität
    if (feature.source === 'override') {
      featureMap.set(feature.id, feature);
      if (feature.parent_id) {
        featureMap.set(feature.parent_id, feature);
      }
    } 
    // Core/Custom nur hinzufügen wenn nicht überschrieben
    else if (!featureMap.has(feature.id)) {
      featureMap.set(feature.id, feature);
    }
  }
  
  return Array.from(featureMap.values());
}
```

### Schritt 8: Rust Commands implementieren

**Neue Datei:** `src-tauri/src/commands/features.rs`

```rust
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::db::Database;
use rusqlite::{params, Row};

#[derive(Debug, Serialize, Deserialize)]
pub struct FeatureData {
    pub id: String,
    pub class_id: String,
    pub class_source: Option<String>,
    pub subclass_id: Option<String>,
    pub subclass_source: Option<String>,
    pub parent_id: Option<String>,
    pub name: String,
    pub description: String,
    pub level: i64,
    pub feature_type: String,
    pub effects: serde_json::Value,
    pub conditions: Option<serde_json::Value>,
    pub uses_per_rest: Option<String>,
    pub rest_type: Option<String>,
    pub source: String,
    pub created_at: i64,
    pub updated_at: Option<i64>,
}

fn row_to_feature(row: &Row) -> rusqlite::Result<FeatureData> {
    Ok(FeatureData {
        id: row.get(0)?,
        class_id: row.get(1)?,
        class_source: row.get(2)?,
        subclass_id: row.get(3)?,
        subclass_source: row.get(4)?,
        parent_id: row.get(5)?,
        name: row.get(6)?,
        description: row.get(7)?,
        level: row.get(8)?,
        feature_type: row.get(9)?,
        effects: serde_json::from_str(&row.get::<_, String>(10)?).unwrap_or_default(),
        conditions: row.get::<_, Option<String>>(11)?
            .map(|s| serde_json::from_str(&s).ok())
            .flatten(),
        uses_per_rest: row.get(12)?,
        rest_type: row.get(13)?,
        source: row.get(14)?,
        created_at: row.get(15)?,
        updated_at: row.get(16)?,
    })
}

#[tauri::command]
pub async fn get_class_features(
    state: State<'_, Database>,
    class_id: String,
    level: Option<i64>,
    subclass_id: Option<String>,
) -> Result<Vec<FeatureData>, String> {
    let db = state.0.lock().map_err(|e| e.to_string())?;
    
    let query = if let Some(lvl) = level {
        "SELECT * FROM all_class_features 
         WHERE class_id = ? AND level <= ?
         AND (subclass_id IS NULL OR subclass_id = ?)
         ORDER BY level ASC,
         CASE source 
           WHEN 'override' THEN 1
           WHEN 'custom' THEN 2
           WHEN 'core' THEN 3
         END"
    } else {
        "SELECT * FROM all_class_features 
         WHERE class_id = ?
         AND (subclass_id IS NULL OR subclass_id = ?)
         ORDER BY level ASC,
         CASE source 
           WHEN 'override' THEN 1
           WHEN 'custom' THEN 2
           WHEN 'core' THEN 3
         END"
    };
    
    let mut stmt = db.prepare(query).map_err(|e| e.to_string())?;
    
    let rows = if let Some(lvl) = level {
        stmt.query_map(
            params![&class_id, &lvl, &subclass_id],
            row_to_feature
        )
    } else {
        stmt.query_map(
            params![&class_id, &subclass_id],
            row_to_feature
        )
    }.map_err(|e| e.to_string())?;
    
    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| e.to_string())?);
    }
    
    Ok(result)
}

#[tauri::command]
pub async fn create_custom_class_feature(
    state: State<'_, Database>,
    class_id: String,
    class_source: String,
    feature_data: serde_json::Value,
) -> Result<String, String> {
    let db = state.0.lock().map_err(|e| e.to_string())?;
    
    if class_source != "core" && class_source != "custom" {
        return Err("class_source must be 'core' or 'custom'".to_string());
    }
    
    // Validiere Klasse existiert
    let table = if class_source == "core" {
        "core_classes"
    } else {
        "custom_classes"
    };
    
    let class_exists: bool = db.query_row(
        &format!("SELECT EXISTS(SELECT 1 FROM {} WHERE id = ?)", table),
        [&class_id],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;
    
    if !class_exists {
        return Err(format!("Class {} not found in {}", class_id, table));
    }
    
    let feature_id = feature_data
        .get("id")
        .and_then(|v| v.as_str())
        .ok_or("Missing id")?
        .to_string();
    
    db.execute(
        "INSERT INTO custom_class_features (
            id, class_id, class_source, subclass_id, subclass_source, parent_id,
            name, description, level, feature_type, effects, conditions,
            uses_per_rest, rest_type
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
        params![
            &feature_id,
            &class_id,
            &class_source,
            feature_data.get("subclass_id").and_then(|v| v.as_str()),
            feature_data.get("subclass_source").and_then(|v| v.as_str()),
            feature_data.get("parent_id").and_then(|v| v.as_str()),
            feature_data.get("name").and_then(|v| v.as_str()).ok_or("Missing name")?,
            feature_data.get("description").and_then(|v| v.as_str()).ok_or("Missing description")?,
            feature_data.get("level").and_then(|v| v.as_i64()).ok_or("Missing level")?,
            feature_data.get("feature_type").and_then(|v| v.as_str()).ok_or("Missing feature_type")?,
            serde_json::to_string(&feature_data.get("effects")).map_err(|e| e.to_string())?,
            feature_data.get("conditions").and_then(|c| serde_json::to_string(c).ok()),
            feature_data.get("uses_per_rest").and_then(|v| v.as_str()),
            feature_data.get("rest_type").and_then(|v| v.as_str()),
        ],
    ).map_err(|e| e.to_string())?;
    
    Ok(feature_id)
}
```

**In `src-tauri/src/main.rs` registrieren:**

```rust
mod commands;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::features::get_class_features,
            commands::features::create_custom_class_feature,
            // ... andere Commands
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Schritt 9: Zod-Schema implementieren

**Neue Datei:** `src/lib/features/featureSchema.ts`

```typescript
import { z } from 'zod';

const FeatureEffectSchema = z.object({
  type: z.enum(['modifier', 'calculation', 'proficiency', 'action', 'condition', 'resistance', 'damage_bonus']),
  target: z.string().optional(),
  value: z.union([z.number(), z.string()]).optional(),
  calculation: z.string().optional(),
  condition: z.string().optional(),
  damage_types: z.array(z.string()).optional(),
});

const FeatureEffectsSchema = z.object({
  when_active: z.array(FeatureEffectSchema).optional(),
  when_passive: z.array(FeatureEffectSchema).optional(),
  on_activation: z.array(FeatureEffectSchema).optional(),
  on_deactivation: z.array(FeatureEffectSchema).optional(),
});

export const FeatureSchema = z.object({
  id: z.string(),
  class_id: z.string(),
  class_source: z.enum(['core', 'custom']),
  subclass_id: z.string().optional(),
  subclass_source: z.enum(['core', 'custom']).optional(),
  parent_id: z.string().optional(),
  name: z.string(),
  description: z.string(),
  level: z.number().int().min(1).max(20),
  feature_type: z.enum(['passive', 'active', 'progression', 'choice', 'reaction', 'bonus_action']),
  effects: FeatureEffectsSchema,
  conditions: z.record(z.unknown()).optional(),
  uses_per_rest: z.union([z.string(), z.number()]).optional(),
  rest_type: z.enum(['short', 'long']).optional(),
  source: z.enum(['core', 'custom', 'override']),
  created_at: z.number(),
  updated_at: z.number().optional(),
});

export function validateFeature(feature: unknown): Feature {
  return FeatureSchema.parse(feature);
}
```

---

## Validierung und Testing

Nach jeder Phase:

1. **SQLite-Schema prüfen:**
   ```bash
   sqlite3 dnd-nexus.db ".schema core_class_features"
   sqlite3 dnd-nexus.db ".schema custom_class_features"
   ```

2. **Views testen:**
   ```sql
   SELECT * FROM all_class_features LIMIT 5;
   SELECT * FROM all_subclasses LIMIT 5;
   SELECT * FROM all_progression_tables LIMIT 5;
   ```

3. **Trigger testen:**
   ```sql
   -- Sollte fehlschlagen
   INSERT INTO custom_class_features (id, class_id, class_source, name, description, level, feature_type, effects)
   VALUES ('test', 'nonexistent', 'core', 'Test', 'Test', 1, 'passive', '{}');
   ```

4. **TypeScript kompilieren:**
   ```bash
   npm run type-check
   ```

5. **Rust kompilieren:**
   ```bash
   cd src-tauri && cargo check
   ```

---

## Hinweise

- **Konsistenz:** Alle neuen Tabellen müssen dem bestehenden `core_*` / `custom_*` Pattern folgen
- **Views:** Die Unified Views müssen das gleiche Pattern wie `all_spells`, `all_classes`, etc. verwenden
- **Indizes:** Alle wichtigen Lookup-Spalten müssen indiziert sein
- **Validierung:** DB-Trigger UND Zod-Schema müssen beide implementiert sein
- **Types:** Frontend und Backend müssen identische Type-Definitionen verwenden

**Nach Abschluss von Phase 0 ist die Architektur konsistent. Phase 1+ können dann sicher implementiert werden.**

---

*Dieser Prompt ist vollständig und kann direkt für die Implementierung verwendet werden.*
