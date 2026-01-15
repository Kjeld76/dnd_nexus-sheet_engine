# Datenbank-Normalisierung & Frontend-Synchronisation

## 1. Status Quo: Identifizierte Probleme

### 1.1 Verstöße gegen die 1. Normalform (1NF)

#### Problem 1: JSON-Arrays in `core_equipment` (Kritisch)
**Tabelle:** `core_equipment`
- **Feld:** `items` (JSON-Array)
- **Feld:** `tools` (JSON-Array)
- **Problem:** Wiederholungsgruppen verletzen 1NF
- **Beispiel:**
  ```json
  {
    "items": [
      {"item_id": "laterne", "quantity": 1},
      {"item_id": "seil", "quantity": 1}
    ]
  }
  ```

**Impact:** 
- Schwer zu queryen (keine JOINs möglich)
- Keine Foreign Key Constraints
- Ineffiziente Suche nach Equipment-Paketen mit bestimmten Items

#### Problem 2: JSON-Felder für flexible Daten (Akzeptabel)
**Tabellen:** `core_spells.data`, `core_weapons.data`, `core_armors.data`, etc.
- **Status:** ⚠️ Technisch 1NF-Verstoß, aber **bewusst so designed**
- **Begründung:** Flexible, erweiterbare Datenstrukturen für regeltechnische Details
- **Empfehlung:** **NICHT ändern** - JSON ist hier die richtige Wahl für polymorphic data

### 1.2 Verstöße gegen die 2. Normalform (2NF)

#### Problem: `background_starting_equipment` (Niedrige Priorität)
**Tabelle:** `background_starting_equipment`
- **Aktueller PK:** `id` (AUTOINCREMENT)
- **Problem:** `option_label` ist Teil der logischen Gruppierung, aber nicht im PK
- **Beispiel:** Mehrere Einträge mit gleichem `background_id` und `option_label` sollten als Gruppe behandelt werden

**Impact:** Niedrig - funktioniert aktuell, aber könnte zu Duplikaten führen

### 1.3 Verstöße gegen die 3. Normalform (3NF)

#### Problem 1: `core_armors.ac_formula` (Potenzielle transitive Abhängigkeit)
**Tabelle:** `core_armors`
- **Problem:** `ac_formula` könnte von `category` abhängen (z.B. "11 + DEX" für leichte Rüstung)
- **Status:** ⚠️ Unklar - könnte auch item-spezifisch sein

#### Problem 2: `core_weapons.mastery_id` (Deprecated)
**Tabelle:** `core_weapons`
- **Problem:** `mastery_id` könnte transitiv von `weapon_type` abhängen
- **Status:** ✅ Bereits gelöst - `weapon_type` ist deprecated, `mastery_id` ist direkt referenziert

---

## 2. Schema-Update: Optimierter SQL-Code

### 2.1 Normalisierung von `core_equipment`

**Neue Tabellen:**
```sql
-- Equipment-Item-Relationen
CREATE TABLE IF NOT EXISTS core_equipment_items (
    equipment_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (equipment_id, item_id),
    FOREIGN KEY (equipment_id) REFERENCES core_equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES core_items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS custom_equipment_items (
    equipment_id TEXT NOT NULL,
    item_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (equipment_id, item_id),
    FOREIGN KEY (equipment_id) REFERENCES custom_equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES core_items(id) ON DELETE CASCADE
);

-- Equipment-Tool-Relationen
CREATE TABLE IF NOT EXISTS core_equipment_tools (
    equipment_id TEXT NOT NULL,
    tool_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    source_table TEXT NOT NULL CHECK(source_table IN ('core_tools', 'custom_tools')),
    PRIMARY KEY (equipment_id, tool_id, source_table),
    FOREIGN KEY (equipment_id) REFERENCES core_equipment(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS custom_equipment_tools (
    equipment_id TEXT NOT NULL,
    tool_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    source_table TEXT NOT NULL CHECK(source_table IN ('core_tools', 'custom_tools')),
    PRIMARY KEY (equipment_id, tool_id, source_table),
    FOREIGN KEY (equipment_id) REFERENCES custom_equipment(id) ON DELETE CASCADE
);

-- Indizes
CREATE INDEX IF NOT EXISTS idx_equipment_items_equipment ON core_equipment_items(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_items_item ON core_equipment_items(item_id);
CREATE INDEX IF NOT EXISTS idx_equipment_tools_equipment ON core_equipment_tools(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_tools_tool ON core_equipment_tools(tool_id);
```

**Migration-Script:**
```sql
-- Migriere bestehende JSON-Daten
-- Für core_equipment
INSERT INTO core_equipment_items (equipment_id, item_id, quantity)
SELECT 
    e.id as equipment_id,
    json_extract(ei.value, '$.item_id') as item_id,
    COALESCE(json_extract(ei.value, '$.quantity'), 1) as quantity
FROM core_equipment e
CROSS JOIN json_each(e.items) as ei
WHERE e.items IS NOT NULL AND e.items != '[]';

INSERT INTO core_equipment_tools (equipment_id, tool_id, quantity, source_table)
SELECT 
    e.id as equipment_id,
    json_extract(et.value, '$.tool_id') as tool_id,
    COALESCE(json_extract(et.value, '$.quantity'), 1) as quantity,
    COALESCE(json_extract(et.value, '$.source_table'), 'core_tools') as source_table
FROM core_equipment e
CROSS JOIN json_each(e.tools) as et
WHERE e.tools IS NOT NULL AND e.tools != '[]';

-- Gleiche Migration für custom_equipment
INSERT INTO custom_equipment_items (equipment_id, item_id, quantity)
SELECT 
    e.id as equipment_id,
    json_extract(ei.value, '$.item_id') as item_id,
    COALESCE(json_extract(ei.value, '$.quantity'), 1) as quantity
FROM custom_equipment e
CROSS JOIN json_each(e.items) as ei
WHERE e.items IS NOT NULL AND e.items != '[]';

INSERT INTO custom_equipment_tools (equipment_id, tool_id, quantity, source_table)
SELECT 
    e.id as equipment_id,
    json_extract(et.value, '$.tool_id') as tool_id,
    COALESCE(json_extract(et.value, '$.quantity'), 1) as quantity,
    COALESCE(json_extract(et.value, '$.source_table'), 'core_tools') as source_table
FROM custom_equipment e
CROSS JOIN json_each(e.tools) as et
WHERE e.tools IS NOT NULL AND e.tools != '[]';
```

**Optionale Bereinigung (nach erfolgreicher Migration):**
```sql
-- Entferne JSON-Felder (optional - nur wenn sicher, dass alles migriert wurde)
-- ALTER TABLE core_equipment DROP COLUMN items;
-- ALTER TABLE core_equipment DROP COLUMN tools;
-- ALTER TABLE custom_equipment DROP COLUMN items;
-- ALTER TABLE custom_equipment DROP COLUMN tools;
```

### 2.2 Verbesserung von `background_starting_equipment`

**Neuer Composite Index:**
```sql
-- Verbesserter Index für logische Gruppierung
CREATE INDEX IF NOT EXISTS idx_bg_equipment_group 
ON background_starting_equipment(background_id, option_label, id);
```

**Optional: Composite Key (Breaking Change - nur wenn nötig):**
```sql
-- WICHTIG: Nur wenn Duplikate ein Problem sind
-- ALTER TABLE background_starting_equipment 
-- DROP PRIMARY KEY,
-- ADD PRIMARY KEY (background_id, option_label, id);
```

### 2.3 View-Update für `all_equipment`

**Neue View mit JOINs:**
```sql
DROP VIEW IF EXISTS all_equipment;

CREATE VIEW all_equipment AS 
SELECT 
    COALESCE(c.id, core.id) as id,
    COALESCE(c.name, core.name) as name,
    COALESCE(c.description, core.description) as description,
    COALESCE(c.total_cost_gp, core.total_cost_gp) as total_cost_gp,
    COALESCE(c.total_weight_kg, core.total_weight_kg) as total_weight_kg,
    COALESCE(c.data, core.data) as data,
    CASE 
        WHEN c.parent_id IS NOT NULL THEN 'override' 
        WHEN c.is_homebrew = 1 THEN 'homebrew' 
        ELSE 'core' 
    END as source
FROM core_equipment core 
LEFT JOIN custom_equipment c ON c.parent_id = core.id 
UNION 
SELECT 
    id, name, description, total_cost_gp, total_weight_kg, data,
    CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
FROM custom_equipment 
WHERE parent_id IS NULL;
```

---

## 3. Frontend-Guide: Anpassungen in der UI-Logik

### 3.1 Backend-Commands (`src-tauri/src/commands/compendium.rs`)

#### Änderung: `get_all_equipment()`

**Vorher:**
```rust
// JSON wurde direkt aus Spalte gelesen
let items_str: Option<String> = row.get(5)?;
items: from_str(items_str.as_deref().unwrap_or("[]")).unwrap_or_default(),
```

**Nachher:**
```rust
#[tauri::command]
pub async fn get_all_equipment(db: State<'_, Database>) -> Result<Vec<Equipment>, String> {
    let result: AppResult<Vec<Equipment>> = (|| {
        let conn = map_lock_error(db.0.lock())?;
        
        // 1. Basis-Equipment laden
        let mut stmt = conn.prepare(
            "SELECT id, name, description, total_cost_gp, total_weight_kg, data, source 
             FROM all_equipment ORDER BY name"
        )?;

        let equipment_iter = stmt.query_map([], |row: &rusqlite::Row| {
            let data_str: Option<String> = row.get(5)?;
            Ok((
                row.get::<_, String>(0)?,  // id
                row.get::<_, String>(1)?,  // name
                row.get::<_, String>(2)?,  // description
                row.get::<_, Option<f64>>(3)?,  // total_cost_gp
                row.get::<_, Option<f64>>(4)?,  // total_weight_kg
                from_str(data_str.as_deref().unwrap_or("{}")).unwrap_or_default(), // data
                row.get::<_, String>(6)?,  // source
            ))
        })?;

        let mut equipment_list = Vec::new();
        for eq_row in equipment_iter {
            let (id, name, description, total_cost_gp, total_weight_kg, data, source) = eq_row?;
            
            // 2. Items via JOIN laden
            let mut items_stmt = conn.prepare(
                "SELECT item_id, quantity 
                 FROM core_equipment_items 
                 WHERE equipment_id = ?
                 UNION ALL
                 SELECT item_id, quantity 
                 FROM custom_equipment_items 
                 WHERE equipment_id = ?"
            )?;
            
            let items_iter = items_stmt.query_map([&id, &id], |row: &rusqlite::Row| {
                Ok(serde_json::json!({
                    "item_id": row.get::<_, String>(0)?,
                    "quantity": row.get::<_, i32>(1)?
                }))
            })?;
            
            let mut items = Vec::new();
            for item in items_iter {
                items.push(item?);
            }
            
            // 3. Tools via JOIN laden
            let mut tools_stmt = conn.prepare(
                "SELECT tool_id, quantity, source_table 
                 FROM core_equipment_tools 
                 WHERE equipment_id = ?
                 UNION ALL
                 SELECT tool_id, quantity, source_table 
                 FROM custom_equipment_tools 
                 WHERE equipment_id = ?"
            )?;
            
            let tools_iter = tools_stmt.query_map([&id, &id], |row: &rusqlite::Row| {
                Ok(serde_json::json!({
                    "tool_id": row.get::<_, String>(0)?,
                    "quantity": row.get::<_, i32>(1)?,
                    "source_table": row.get::<_, String>(2)?
                }))
            })?;
            
            let mut tools = Vec::new();
            for tool in tools_iter {
                tools.push(tool?);
            }
            
            equipment_list.push(Equipment {
                id,
                name,
                description,
                total_cost_gp,
                total_weight_kg,
                items: serde_json::from_value(serde_json::Value::Array(items)).unwrap_or_default(),
                tools: serde_json::from_value(serde_json::Value::Array(tools)).unwrap_or_default(),
                data,
                source,
            });
        }
        
        Ok(equipment_list)
    })();
    
    result.map_err(|e| e.to_string())
}
```

### 3.2 TypeScript-Types (`src/lib/types.ts`)

**Keine Änderungen nötig** - Die `Equipment`-Interface bleibt gleich:
```typescript
export interface Equipment {
  id: string;
  name: string;
  description: string;
  total_cost_gp?: number;
  total_weight_kg?: number;
  items: Array<{ item_id: string; quantity: number }>;
  tools: Array<{ tool_id: string; quantity: number; source_table?: string }>;
  data: Record<string, unknown>;
  source: "core" | "override" | "homebrew";
}
```

### 3.3 Frontend-Komponenten

**Keine Änderungen nötig** - Die Komponenten arbeiten weiterhin mit dem `Equipment`-Interface. Die Datenstruktur bleibt identisch, nur die Datenquelle ändert sich (JOINs statt JSON-Parsing).

### 3.4 Migration-Script für bestehende Daten

**Python-Script:** `scripts/migrate_equipment_normalization.py`

```python
#!/usr/bin/env python3
"""
Migriert core_equipment und custom_equipment von JSON-Arrays zu normalisierten Tabellen.
"""
import sqlite3
import json
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "dnd-nexus.db"

def migrate_equipment():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    
    try:
        # Erstelle neue Tabellen
        conn.executescript("""
            -- (Tabellen-Erstellung aus Abschnitt 2.1 hier einfügen)
        """)
        
        # Migriere core_equipment
        cursor = conn.execute("SELECT id, items, tools FROM core_equipment")
        for row in cursor:
            eq_id, items_str, tools_str = row
            
            # Migriere Items
            if items_str:
                items = json.loads(items_str)
                for item in items:
                    conn.execute("""
                        INSERT OR IGNORE INTO core_equipment_items 
                        (equipment_id, item_id, quantity)
                        VALUES (?, ?, ?)
                    """, (eq_id, item.get('item_id'), item.get('quantity', 1)))
            
            # Migriere Tools
            if tools_str:
                tools = json.loads(tools_str)
                for tool in tools:
                    conn.execute("""
                        INSERT OR IGNORE INTO core_equipment_tools 
                        (equipment_id, tool_id, quantity, source_table)
                        VALUES (?, ?, ?, ?)
                    """, (
                        eq_id, 
                        tool.get('tool_id'), 
                        tool.get('quantity', 1),
                        tool.get('source_table', 'core_tools')
                    ))
        
        # Gleiche Migration für custom_equipment
        cursor = conn.execute("SELECT id, items, tools FROM custom_equipment")
        for row in cursor:
            eq_id, items_str, tools_str = row
            
            if items_str:
                items = json.loads(items_str)
                for item in items:
                    conn.execute("""
                        INSERT OR IGNORE INTO custom_equipment_items 
                        (equipment_id, item_id, quantity)
                        VALUES (?, ?, ?)
                    """, (eq_id, item.get('item_id'), item.get('quantity', 1)))
            
            if tools_str:
                tools = json.loads(tools_str)
                for tool in tools:
                    conn.execute("""
                        INSERT OR IGNORE INTO custom_equipment_tools 
                        (equipment_id, tool_id, quantity, source_table)
                        VALUES (?, ?, ?, ?)
                    """, (
                        eq_id, 
                        tool.get('tool_id'), 
                        tool.get('quantity', 1),
                        tool.get('source_table', 'core_tools')
                    ))
        
        conn.commit()
        print("✅ Migration erfolgreich")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Fehler: {e}")
        raise
    finally:
        conn.close()

if __name__ == '__main__':
    migrate_equipment()
```

---

## 4. Zusammenfassung & Empfehlungen

### ✅ Sollte umgesetzt werden:
1. **Normalisierung von `core_equipment`** (Kritisch)
   - Bessere Query-Performance
   - Foreign Key Constraints
   - Einfacheres Filtern/Suchen

### ⚠️ Optional (niedrige Priorität):
2. **Verbesserung von `background_starting_equipment`**
   - Nur wenn Duplikate ein Problem werden

### ❌ Sollte NICHT geändert werden:
3. **JSON-Felder in anderen Tabellen** (`data`-Spalten)
   - Bewusst so designed für flexible Datenstrukturen
   - Änderung würde zu viel Komplexität einführen

### 📋 Migrations-Reihenfolge:
1. Erstelle neue Tabellen (`core_equipment_items`, `core_equipment_tools`, etc.)
2. Führe Migration-Script aus
3. Update Backend-Command `get_all_equipment()`
4. Teste Frontend
5. Optional: Entferne JSON-Spalten (nur nach erfolgreichem Test)

---

## 5. Sicherheits-Hinweise

**Firewall-Regel (falls nötig):**
```bash
# ufw allow 22
```

**Backup vor Migration:**
```bash
cp dnd-nexus.db dnd-nexus.db.backup_$(date +%Y%m%d_%H%M%S)
```
