Ausgezeichnete Frage! Ich sehe hier tatsächlich **erhebliche Lücken und Inkonsistenzen**. Das Backend-Konzept hat `custom_classes` nicht vollständig berücksichtigt. Hier sind die kritischen Verbesserungen:

## Kritische Probleme mit `custom_classes`

### 1. **Feature-Zuordnung: Core vs Custom Classes**

**Problem:** Das Konzept definiert `class_features` nur mit `class_id`, aber nicht, ob dies eine Core- oder Custom-Class ist.

**Aktuelle Schema-Lücke:**
```sql
-- ❌ PROBLEM: Kann nicht unterscheiden ob class_id auf core_classes oder custom_classes zeigt
CREATE TABLE IF NOT EXISTS class_features (
    class_id TEXT,  -- Zeigt auf welche Tabelle?
    FOREIGN KEY (class_id) REFERENCES core_classes(id) ON DELETE CASCADE
    -- Aber was ist mit custom_classes?
);
```

**Lösung 1: Polymorphe Referenz mit Discriminator**
```sql
CREATE TABLE IF NOT EXISTS class_features (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL,
    class_source TEXT NOT NULL CHECK(class_source IN ('core', 'custom')),
    subclass_id TEXT,
    subclass_source TEXT CHECK(subclass_source IN ('core', 'custom', NULL)),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    level INTEGER NOT NULL,
    feature_type TEXT NOT NULL,
    effects JSON NOT NULL,
    conditions JSON,
    uses_per_rest TEXT,
    rest_type TEXT,
    created_at INTEGER DEFAULT (unixepoch())
);

-- Compound Foreign Key wäre ideal, aber SQLite unterstützt das nicht vollständig
-- Stattdessen: Check-Constraint + Trigger
CREATE TRIGGER validate_class_feature_reference
BEFORE INSERT ON class_features
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
```

**Lösung 2: Separate Feature-Tabellen (Empfohlen)**
```sql
-- Wie bei anderen Entitäten: Trennung Core/Custom
CREATE TABLE IF NOT EXISTS core_class_features (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL,
    subclass_id TEXT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    level INTEGER NOT NULL,
    feature_type TEXT NOT NULL,
    effects JSON NOT NULL,
    conditions JSON,
    uses_per_rest TEXT,
    rest_type TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (class_id) REFERENCES core_classes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS custom_class_features (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL,
    subclass_id TEXT,
    parent_id TEXT,  -- Override-Mechanismus für Core-Features
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    level INTEGER NOT NULL,
    feature_type TEXT NOT NULL,
    effects JSON NOT NULL,
    conditions JSON,
    uses_per_rest TEXT,
    rest_type TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (class_id) REFERENCES custom_classes(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES core_class_features(id) ON DELETE SET NULL
);

-- Unified View
CREATE VIEW all_class_features AS
SELECT 
    id,
    class_id,
    subclass_id,
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
    created_at
FROM core_class_features

UNION ALL

SELECT 
    id,
    class_id,
    subclass_id,
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
    created_at
FROM custom_class_features;
```

### 2. **Subclass-Zuordnung: Core Class + Custom Subclass**

**Problem:** Ein Spieler könnte eine Custom-Subclass für eine Core-Class erstellen wollen (z.B. "Homebrew Path of the Dragon" für Core-Barbarian).

**Aktuelle Schema-Lücke:**
```sql
-- ❌ PROBLEM: subclass_id zeigt nur auf eine Tabelle
CREATE TABLE IF NOT EXISTS class_subclasses (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL,  -- Core oder Custom?
    name TEXT NOT NULL,
    FOREIGN KEY (class_id) REFERENCES core_classes(id) ON DELETE CASCADE
);
```

**Lösung:**
```sql
-- Trennung Core/Custom Subclasses
CREATE TABLE IF NOT EXISTS core_subclasses (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    level INTEGER NOT NULL,
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (class_id) REFERENCES core_classes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS custom_subclasses (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL,
    class_source TEXT NOT NULL CHECK(class_source IN ('core', 'custom')),
    parent_id TEXT,  -- Override Core-Subclass
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    level INTEGER NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
    -- Keine FK hier, da class_id auf core ODER custom zeigen kann
);

-- Validation Trigger
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

-- Unified View
CREATE VIEW all_subclasses AS
SELECT 
    id,
    class_id,
    'core' as class_source,
    NULL as parent_id,
    name,
    description,
    level,
    'core' as source
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
    END as source
FROM custom_subclasses;
```

### 3. **Progression Tables: Nur für Core oder auch Custom?**

**Problem:** Das Konzept definiert nur `class_progression_tables`, aber Custom-Classes könnten eigene Progressionstabellen haben.

**Lösung:**
```sql
-- Core Progression (PHB-Klassen)
CREATE TABLE IF NOT EXISTS core_progression_tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id TEXT NOT NULL,
    level INTEGER NOT NULL,
    proficiency_bonus INTEGER NOT NULL,
    feature_names TEXT,  -- JSON Array
    class_specific_data JSON,
    created_at INTEGER DEFAULT (unixepoch()),
    UNIQUE(class_id, level),
    FOREIGN KEY (class_id) REFERENCES core_classes(id) ON DELETE CASCADE
);

-- Custom Progression (Homebrew-Klassen)
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

-- Unified View
CREATE VIEW all_progression_tables AS
SELECT 
    id,
    class_id,
    level,
    proficiency_bonus,
    feature_names,
    class_specific_data,
    'core' as source
FROM core_progression_tables

UNION ALL

SELECT 
    id,
    class_id,
    level,
    proficiency_bonus,
    feature_names,
    class_specific_data,
    'custom' as source
FROM custom_progression_tables;
```

### 4. **Feature Loader: Query-Logik muss beide Tabellen berücksichtigen**

**Aktuelles Problem im Konzept:**
```typescript
// ❌ PROBLEM: Lädt nur aus einer Tabelle
export async function loadCharacterFeatures(
  character: Character,
  classData: Class,
  subclassId?: string
): Promise<Feature[]> {
  const features = await db.query(`
    SELECT * FROM class_features  -- Welche Tabelle?
    WHERE class_id = ? AND level <= ?
  `, [classId, level]);
  
  return features.map(parseFeatureFromDb);
}
```

**Verbesserte Lösung:**
```typescript
export async function loadCharacterFeatures(
  character: Character,
  classData: Class,
  subclassId?: string
): Promise<Feature[]> {
  const classId = classData.id;
  const classSource = classData.source; // 'core' | 'custom' | 'override'
  const level = character.meta.level;
  
  // Nutze Unified View
  const features = await db.query(`
    SELECT * FROM all_class_features
    WHERE class_id = ? 
      AND level <= ?
      AND (subclass_id IS NULL OR subclass_id = ?)
    ORDER BY level ASC, 
             CASE source 
               WHEN 'override' THEN 1
               WHEN 'custom' THEN 2
               WHEN 'core' THEN 3
             END
  `, [classId, level, subclassId || null]);
  
  // Override-Mechanismus: Wenn Custom-Feature parent_id hat, entferne Core-Feature
  const deduplicated = deduplicateFeatures(features);
  
  return deduplicated.map(parseFeatureFromDb);
}

function deduplicateFeatures(features: RawFeature[]): RawFeature[] {
  const featureMap = new Map<string, RawFeature>();
  
  for (const feature of features) {
    // Override hat Priorität
    if (feature.source === 'override' && feature.parent_id) {
      featureMap.set(feature.parent_id, feature); // Ersetzt Core
      featureMap.set(feature.id, feature);         // Fügt sich selbst hinzu
    } 
    // Core nur hinzufügen wenn nicht überschrieben
    else if (!featureMap.has(feature.id)) {
      featureMap.set(feature.id, feature);
    }
  }
  
  return Array.from(featureMap.values());
}
```

### 5. **CompendiumEditor: Custom Class Features erstellen**

**Problem:** Der Editor muss Custom-Class-Features erstellen können.

**Verbesserte UI:**
```tsx
// src/components/CompendiumEditor.tsx
export function CompendiumEditor({ type, entry }: Props) {
  const [classSource, setClassSource] = useState<'core' | 'custom'>('core');
  const [parentFeature, setParentFeature] = useState<Feature | null>(null);
  
  if (type === 'class_features') {
    return (
      <form>
        {/* Klassen-Auswahl mit Source */}
        <div>
          <label>Klasse</label>
          <div className="flex gap-2">
            <Select value={classSource} onChange={setClassSource}>
              <option value="core">Core-Klasse</option>
              <option value="custom">Custom-Klasse</option>
            </Select>
            
            <Select name="class_id">
              {classSource === 'core' 
                ? coreClasses.map(c => <option value={c.id}>{c.name}</option>)
                : customClasses.map(c => <option value={c.id}>{c.name}</option>)
              }
            </Select>
          </div>
        </div>
        
        {/* Override-Option */}
        {classSource === 'core' && (
          <div>
            <label>
              <input 
                type="checkbox" 
                checked={!!parentFeature}
                onChange={(e) => setParentFeature(e.target.checked ? {} : null)}
              />
              Core-Feature überschreiben
            </label>
            
            {parentFeature && (
              <Select onChange={(e) => setParentFeature(findFeature(e.target.value))}>
                <option value="">Feature wählen...</option>
                {coreFeatures.map(f => (
                  <option value={f.id}>{f.name} (Level {f.level})</option>
                ))}
              </Select>
            )}
          </div>
        )}
        
        {/* Rest des Formulars */}
        <Input name="name" label="Name" />
        <Textarea name="description" label="Beschreibung" />
        {/* ... */}
      </form>
    );
  }
  
  // ... andere Typen
}
```

### 6. **TypeScript-Types: Source-Tracking**

**Problem:** Die TypeScript-Types berücksichtigen den Source nicht.

**Verbesserte Types:**
```typescript
// src/lib/types.ts

export type EntitySource = 'core' | 'custom' | 'override';

export interface BaseEntity {
  id: string;
  source: EntitySource;
  created_at: number;
}

export interface Feature extends BaseEntity {
  class_id: string;
  class_source: 'core' | 'custom';  // NEU: Woher kommt die Klasse
  subclass_id?: string;
  subclass_source?: 'core' | 'custom';  // NEU: Woher kommt die Unterklasse
  parent_id?: string;  // NEU: Für Override
  name: string;
  description: string;
  level: number;
  feature_type: 'passive' | 'active' | 'progression' | 'choice' | 'reaction' | 'bonus_action';
  effects: FeatureEffects;
  conditions?: FeatureConditions;
  uses_per_rest?: string | number;
  rest_type?: 'short' | 'long';
}

export interface Class extends BaseEntity {
  name: string;
  data: ClassData;
  parent_id?: string;  // Für Override (Custom überschreibt Core)
}

export interface Subclass extends BaseEntity {
  class_id: string;
  class_source: 'core' | 'custom';
  parent_id?: string;
  name: string;
  description: string;
  level: number;
}

export interface ProgressionTableRow {
  id: number;
  class_id: string;
  source: 'core' | 'custom';  // NEU
  level: number;
  proficiency_bonus: number;
  feature_names: string[];
  class_specific_data: Record<string, unknown>;
}
```

### 7. **Rust Backend: Commands für Custom Features**

**Problem:** Das Konzept erwähnt nur `homebrewApi` generisch, aber keine spezifischen Commands für Custom-Class-Features.

**Neue Commands:**
```rust
// src-tauri/src/commands/homebrew.rs

#[tauri::command]
pub async fn create_custom_class_feature(
    state: State<'_, Database>,
    class_id: String,
    class_source: String,  // "core" | "custom"
    feature_data: serde_json::Value,
) -> Result<String, String> {
    let db = state.0.lock().map_err(|e| e.to_string())?;
    
    // Validiere class_source
    if class_source != "core" && class_source != "custom" {
        return Err("class_source must be 'core' or 'custom'".to_string());
    }
    
    // Validiere, dass Klasse existiert
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
    
    // Insert in custom_class_features
    let feature_id = uuid::Uuid::new_v4().to_string();
    
    db.execute(
        "INSERT INTO custom_class_features (
            id, class_id, class_source, subclass_id, parent_id,
            name, description, level, feature_type, effects, conditions,
            uses_per_rest, rest_type
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        params![
            &feature_id,
            &class_id,
            &class_source,
            feature_data.get("subclass_id"),
            feature_data.get("parent_id"),
            feature_data.get("name").and_then(|v| v.as_str()).ok_or("Missing name")?,
            feature_data.get("description").and_then(|v| v.as_str()).ok_or("Missing description")?,
            feature_data.get("level").and_then(|v| v.as_i64()).ok_or("Missing level")?,
            feature_data.get("feature_type").and_then(|v| v.as_str()).ok_or("Missing feature_type")?,
            serde_json::to_string(&feature_data.get("effects")).map_err(|e| e.to_string())?,
            serde_json::to_string(&feature_data.get("conditions")).map_err(|e| e.to_string())?,
            feature_data.get("uses_per_rest").and_then(|v| v.as_str()),
            feature_data.get("rest_type").and_then(|v| v.as_str()),
        ],
    ).map_err(|e| e.to_string())?;
    
    Ok(feature_id)
}

#[tauri::command]
pub async fn get_class_features(
    state: State<'_, Database>,
    class_id: String,
    level: Option<i64>,
) -> Result<Vec<serde_json::Value>, String> {
    let db = state.0.lock().map_err(|e| e.to_string())?;
    
    let query = if let Some(lvl) = level {
        format!(
            "SELECT * FROM all_class_features 
             WHERE class_id = ? AND level <= ?
             ORDER BY level ASC"
        )
    } else {
        format!(
            "SELECT * FROM all_class_features 
             WHERE class_id = ?
             ORDER BY level ASC"
        )
    };
    
    let mut stmt = db.prepare(&query).map_err(|e| e.to_string())?;
    
    let features = if let Some(lvl) = level {
        stmt.query_map([&class_id, &lvl.to_string()], |row| {
            // Map row to JSON
            Ok(serde_json::json!({
                "id": row.get::<_, String>(0)?,
                "class_id": row.get::<_, String>(1)?,
                "subclass_id": row.get::<_, Option<String>>(2)?,
                "parent_id": row.get::<_, Option<String>>(3)?,
                "name": row.get::<_, String>(4)?,
                "description": row.get::<_, String>(5)?,
                "level": row.get::<_, i64>(6)?,
                "feature_type": row.get::<_, String>(7)?,
                "effects": serde_json::from_str::<serde_json::Value>(
                    &row.get::<_, String>(8)?
                ).unwrap_or(serde_json::json!({})),
                "source": row.get::<_, String>(13)?,
            }))
        })
    } else {
        stmt.query_map([&class_id], |row| {
            // Same mapping
            Ok(serde_json::json!({
                "id": row.get::<_, String>(0)?,
                "class_id": row.get::<_, String>(1)?,
                // ...
            }))
        })
    }.map_err(|e| e.to_string())?;
    
    let mut result = Vec::new();
    for feature in features {
        result.push(feature.map_err(|e| e.to_string())?);
    }
    
    Ok(result)
}
```

### 8. **Migration: Core vs Custom Classes unterscheiden**

**Problem:** Das Migration-Script geht davon aus, dass alle Klassen in `core_classes` landen, aber Custom-Classes müssen anders behandelt werden.

**Verbesserte Migration:**
```typescript
// scripts/migrate_classes_incremental.ts

interface ClassMigrationConfig {
  source: 'phb' | 'dmg' | 'homebrew';
  targetTable: 'core_classes' | 'custom_classes';
  featureTable: 'core_class_features' | 'custom_class_features';
  progressionTable: 'core_progression_tables' | 'custom_progression_tables';
}

const MIGRATION_CONFIGS: Record<string, ClassMigrationConfig> = {
  'barbar': { source: 'phb', targetTable: 'core_classes', featureTable: 'core_class_features', progressionTable: 'core_progression_tables' },
  'barde': { source: 'phb', targetTable: 'core_classes', featureTable: 'core_class_features', progressionTable: 'core_progression_tables' },
  // ... alle PHB-Klassen
  
  // Custom-Klassen würden hier hin:
  // 'homebrew_necromancer': { source: 'homebrew', targetTable: 'custom_classes', ... }
};

async function migrateClass(className: string, config: ClassMigrationConfig) {
  const classData = parseClassFromMarkdown(className);
  
  // Insert in richtige Tabelle
  await db.execute(
    `INSERT INTO ${config.targetTable} (id, name, data) VALUES (?, ?, ?)`,
    [classData.id, classData.name, JSON.stringify(classData.baseData)]
  );
  
  // Insert Features in richtige Tabelle
  for (const feature of classData.features) {
    await db.execute(
      `INSERT INTO ${config.featureTable} (
        id, class_id, name, description, level, feature_type, effects
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        feature.id,
        classData.id,
        feature.name,
        feature.description,
        feature.level,
        feature.type,
        JSON.stringify(feature.effects)
      ]
    );
  }
  
  // Insert Progression in richtige Tabelle
  for (const row of classData.progressionTable) {
    await db.execute(
      `INSERT INTO ${config.progressionTable} (
        class_id, level, proficiency_bonus, feature_names, class_specific_data
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        classData.id,
        row.level,
        row.proficiency_bonus,
        JSON.stringify(row.features),
        JSON.stringify(row.classSpecificData)
      ]
    );
  }
}
```

## Zusammenfassung der Custom-Class-Verbesserungen

| Problem | Lösung | Priorität |
|---------|--------|-----------|
| Feature-Zuordnung unklar | Separate Tabellen `core_class_features` / `custom_class_features` + Views | **Kritisch** |
| Subclass-Zuordnung fehlt | Separate Tabellen + `class_source` Discriminator | **Kritisch** |
| Progression Tables fehlen | `core_progression_tables` / `custom_progression_tables` | **Hoch** |
| Feature Loader lädt falsch | Query auf `all_class_features` View + Deduplication | **Kritisch** |
| Editor fehlt Custom-Support | Class-Source-Selector + Override-Checkbox | **Hoch** |
| TypeScript-Types fehlen Source | `EntitySource` + `class_source` / `subclass_source` | **Hoch** |
| Rust Commands fehlen | `create_custom_class_feature`, `get_class_features` | **Kritisch** |
| Migration unterscheidet nicht | Migration-Config pro Klasse | **Mittel** |

**Empfehlung:** Die Trennung in `core_*` / `custom_*` Tabellen ist **kritisch** für die Konsistenz mit dem restlichen System. Das aktuelle Konzept verletzt dieses Architektur-Prinzip und würde zu Konflikten führen.

Soll ich ein vollständiges, überarbeitetes Schema-Konzept mit allen Tabellen und Views erstellen?