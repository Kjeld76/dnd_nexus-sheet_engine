# Mapping-Tabellen: Frontend & Backend Implementierung

## Übersicht

Dieses Konzept dokumentiert alle notwendigen Änderungen am Frontend (TypeScript/React) und Backend (Rust) für die Einführung der Mapping-Tabellen:
- `weapon_property_mappings` (Waffen ↔ Eigenschaften)
- `armor_property_mappings` (Rüstungen ↔ Eigenschaften)
- `spell_class_mappings` (Zauber ↔ Klassen)
- `spell_tag_mappings` (Zauber ↔ Tags, optional)

---

## Problemstellung

### Aktueller Zustand

**Backend:**
- `Weapon` struct hat `weapon_type: String` (wird entfernt)
- `Armor` struct hat nur `base_ac`, `strength_requirement`, `stealth_disadvantage` (fehlen neue Felder)
- `Spell` struct hat `classes: String` (komma-getrennt, bleibt für Rückwärtskompatibilität)
- SQL-Queries nutzen direkte Tabellen, keine JOINs mit Mapping-Tabellen

**Frontend:**
- `Weapon` Type hat `weapon_type: string` (wird entfernt)
- `Armor` Type hat nur `base_ac`, `strength_requirement`, `stealth_disadvantage` (fehlen neue Felder)
- `Spell` Type hat `classes: string` (komma-getrennt, bleibt für Rückwärtskompatibilität)
- Komponenten nutzen `weapon_type` und `classes` String direkt

### Zielzustand

**Backend:**
- `Weapon` struct hat `mastery_id: String` und `properties: Vec<WeaponProperty>`
- `Armor` struct hat `ac_bonus`, `ac_formula`, `don_time_minutes`, `doff_time_minutes` und `properties: Vec<ArmorProperty>`
- `Spell` struct behält `classes: String` (Legacy), neue Methode `get_all_spells_with_classes()` gibt Array
- SQL-Queries nutzen JOINs mit Mapping-Tabellen

**Frontend:**
- `Weapon` Type hat `mastery_id: string` und `properties: WeaponProperty[]`
- `Armor` Type hat neue Felder und `properties: ArmorProperty[]`
- `Spell` Type behält `classes: string` (Legacy), optional `classes_details: Class[]`
- Komponenten nutzen neue Strukturen

---

## Backend-Änderungen (Rust)

### 1. Type Definitions

#### `src-tauri/src/types/weapons.rs`

```rust
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Weapon {
    pub id: String,
    pub name: String,
    pub category: String,
    // ENTFERNT: pub weapon_type: String,
    pub mastery_id: String,  // NEU
    pub damage_dice: String,
    pub damage_type: String,
    pub weight_kg: f64,
    pub cost_gp: f64,
    pub properties: Vec<WeaponProperty>,  // NEU
    pub mastery: Option<WeaponMastery>,  // NEU (optional, wird via JOIN geladen)
    pub data: Value,
    pub source: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeaponProperty {
    pub id: String,
    pub name: String,
    pub description: String,
    pub has_parameter: bool,
    pub parameter_type: Option<String>,  // 'range', 'damage', 'ammo', etc.
    pub parameter_value: Option<Value>,   // JSON für komplexe Parameter
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeaponMastery {
    pub id: String,
    pub name: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomWeapon {
    pub id: Option<String>,
    pub name: String,
    pub category: String,
    // ENTFERNT: pub weapon_type: String,
    pub mastery_id: String,  // NEU
    pub damage_dice: String,
    pub damage_type: String,
    pub weight_kg: f64,
    pub cost_gp: f64,
    pub data: Value,
    pub parent_id: Option<String>,
    pub is_homebrew: Option<bool>,
}
```

#### `src-tauri/src/types/compendium.rs`

```rust
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Armor {
    pub id: String,
    pub name: String,
    pub category: String,
    pub base_ac: Option<i32>,  // GEÄNDERT: kann NULL sein (für Formeln)
    pub ac_bonus: i32,         // NEU
    pub ac_formula: Option<String>,  // NEU (z.B. "11 + DEX")
    pub strength_requirement: Option<i32>,
    pub stealth_disadvantage: bool,
    pub don_time_minutes: Option<i32>,  // NEU
    pub doff_time_minutes: Option<i32>, // NEU
    pub properties: Vec<ArmorProperty>,  // NEU
    pub weight_kg: f64,
    pub cost_gp: f64,
    pub data: Value,
    pub source: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArmorProperty {
    pub id: String,
    pub name: String,
    pub description: String,
    pub parameter_value: Option<Value>,  // JSON für komplexe Parameter
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CustomArmor {
    pub id: Option<String>,
    pub name: String,
    pub category: String,
    pub base_ac: Option<i32>,  // GEÄNDERT
    pub ac_bonus: i32,         // NEU
    pub ac_formula: Option<String>,  // NEU
    pub strength_requirement: Option<i32>,
    pub stealth_disadvantage: bool,
    pub don_time_minutes: Option<i32>,  // NEU
    pub doff_time_minutes: Option<i32>, // NEU
    pub weight_kg: f64,
    pub cost_gp: f64,
    pub data: Value,
    pub parent_id: Option<String>,
    pub is_homebrew: Option<bool>,
}
```

#### `src-tauri/src/types/spell.rs`

```rust
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Spell {
    pub id: String,
    pub name: String,
    pub level: i32,
    pub school: String,
    pub casting_time: String,
    pub range: String,
    pub components: String,
    pub material_components: Option<String>,
    pub duration: String,
    pub concentration: bool,
    pub ritual: bool,
    pub description: String,
    pub higher_levels: Option<String>,
    pub classes: String,  // BEHALTEN (für Rückwärtskompatibilität)
    pub classes_details: Option<Vec<SpellClass>>,  // NEU (optional, wird via JOIN geladen)
    pub tags: Option<Vec<SpellTag>>,  // NEU (optional, wird via JOIN geladen)
    pub data: Value,
    pub source: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpellClass {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpellTag {
    pub id: String,
    pub name: String,
    pub category: Option<String>,
}
```

### 2. Command Updates

#### `src-tauri/src/commands/compendium.rs`

**`get_all_weapons` - Komplett überarbeiten:**

```rust
#[tauri::command]
pub async fn get_all_weapons(db: State<'_, Database>) -> Result<Vec<Weapon>, String> {
    let conn = db.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    // 1. Waffen aus all_weapons_unified View laden
    let mut stmt = conn.prepare(
        "SELECT id, name, category, mastery_id, damage_dice, damage_type, weight_kg, cost_gp, data, source 
         FROM all_weapons_unified 
         ORDER BY name"
    ).map_err(|e: rusqlite::Error| e.to_string())?;

    let weapons_iter = stmt.query_map([], |row: &rusqlite::Row| {
        let data_str: String = row.get(8)?;
        Ok((
            row.get::<_, String>(0)?,  // id
            row.get::<_, String>(1)?,  // name
            row.get::<_, String>(2)?,  // category
            row.get::<_, String>(3)?,  // mastery_id
            row.get::<_, String>(4)?,  // damage_dice
            row.get::<_, String>(5)?,  // damage_type
            row.get::<_, f64>(6)?,     // weight_kg
            row.get::<_, f64>(7)?,     // cost_gp
            from_str(&data_str).unwrap_or_default(),  // data
            row.get::<_, String>(9)?,  // source
        ))
    }).map_err(|e: rusqlite::Error| e.to_string())?;

    let mut weapons = Vec::new();
    for weapon_row in weapons_iter {
        let (id, name, category, mastery_id, damage_dice, damage_type, weight_kg, cost_gp, data, source) = weapon_row?;
        
        // 2. Properties via JOIN laden
        let mut prop_stmt = conn.prepare(
            "SELECT wp.id, wp.name, wp.description, wp.has_parameter, wp.parameter_type, wpm.parameter_value
             FROM weapon_property_mappings wpm
             JOIN weapon_properties wp ON wpm.property_id = wp.id
             WHERE wpm.weapon_id = ?
             ORDER BY wp.name"
        ).map_err(|e: rusqlite::Error| e.to_string())?;

        let properties_iter = prop_stmt.query_map([&id], |row: &rusqlite::Row| {
            let param_value_str: Option<String> = row.get(5)?;
            Ok(WeaponProperty {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                has_parameter: row.get::<_, i32>(3)? != 0,
                parameter_type: row.get(4)?,
                parameter_value: param_value_str.and_then(|s| from_str(&s).ok()),
            })
        }).map_err(|e: rusqlite::Error| e.to_string())?;

        let mut properties = Vec::new();
        for prop in properties_iter {
            properties.push(prop?);
        }

        // 3. Mastery via JOIN laden (optional)
        let mastery = if !mastery_id.is_empty() {
            let mut mastery_stmt = conn.prepare(
                "SELECT id, name, description FROM weapon_masteries WHERE id = ?"
            ).map_err(|e: rusqlite::Error| e.to_string())?;
            
            mastery_stmt.query_row([&mastery_id], |row: &rusqlite::Row| {
                Ok(Some(WeaponMastery {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    description: row.get(2)?,
                }))
            }).ok().flatten()
        } else {
            None
        };

        weapons.push(Weapon {
            id,
            name,
            category,
            mastery_id,
            damage_dice,
            damage_type,
            weight_kg,
            cost_gp,
            properties,
            mastery,
            data,
            source,
        });
    }

    Ok(weapons)
}
```

**`get_all_armor` - Komplett überarbeiten:**

```rust
#[tauri::command]
pub async fn get_all_armor(db: State<'_, Database>) -> Result<Vec<Armor>, String> {
    let conn = db.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    // 1. Rüstungen aus all_armors View laden
    let mut stmt = conn.prepare(
        "SELECT id, name, category, base_ac, ac_bonus, ac_formula, strength_requirement, 
                stealth_disadvantage, don_time_minutes, doff_time_minutes, weight_kg, cost_gp, data, source 
         FROM all_armors 
         ORDER BY name"
    ).map_err(|e: rusqlite::Error| e.to_string())?;

    let armors_iter = stmt.query_map([], |row: &rusqlite::Row| {
        let data_str: String = row.get(12)?;
        Ok((
            row.get::<_, String>(0)?,   // id
            row.get::<_, String>(1)?,   // name
            row.get::<_, String>(2)?,   // category
            row.get::<_, Option<i32>>(3)?,  // base_ac
            row.get::<_, i32>(4)?,     // ac_bonus
            row.get::<_, Option<String>>(5)?,  // ac_formula
            row.get::<_, Option<i32>>(6)?,  // strength_requirement
            row.get::<_, i32>(7)? != 0,  // stealth_disadvantage
            row.get::<_, Option<i32>>(8)?,  // don_time_minutes
            row.get::<_, Option<i32>>(9)?,  // doff_time_minutes
            row.get::<_, f64>(10)?,    // weight_kg
            row.get::<_, f64>(11)?,    // cost_gp
            from_str(&data_str).unwrap_or_default(),  // data
            row.get::<_, String>(13)?,  // source
        ))
    }).map_err(|e: rusqlite::Error| e.to_string())?;

    let mut armors = Vec::new();
    for armor_row in armors_iter {
        let (id, name, category, base_ac, ac_bonus, ac_formula, strength_requirement, 
             stealth_disadvantage, don_time_minutes, doff_time_minutes, weight_kg, cost_gp, data, source) = armor_row?;
        
        // 2. Properties via JOIN laden
        let mut prop_stmt = conn.prepare(
            "SELECT ap.id, ap.name, ap.description, apm.parameter_value
             FROM armor_property_mappings apm
             JOIN armor_properties ap ON apm.property_id = ap.id
             WHERE apm.armor_id = ?
             ORDER BY ap.name"
        ).map_err(|e: rusqlite::Error| e.to_string())?;

        let properties_iter = prop_stmt.query_map([&id], |row: &rusqlite::Row| {
            let param_value_str: Option<String> = row.get(3)?;
            Ok(ArmorProperty {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                parameter_value: param_value_str.and_then(|s| from_str(&s).ok()),
            })
        }).map_err(|e: rusqlite::Error| e.to_string())?;

        let mut properties = Vec::new();
        for prop in properties_iter {
            properties.push(prop?);
        }

        armors.push(Armor {
            id,
            name,
            category,
            base_ac,
            ac_bonus,
            ac_formula,
            strength_requirement,
            stealth_disadvantage,
            don_time_minutes,
            doff_time_minutes,
            properties,
            weight_kg,
            cost_gp,
            data,
            source,
        });
    }

    Ok(armors)
}
```

**`get_all_spells` - Erweitern (neue Methode):**

```rust
// Bestehende Methode bleibt unverändert (für Rückwärtskompatibilität)
#[tauri::command]
pub async fn get_all_spells(db: State<'_, Database>) -> Result<Vec<Spell>, String> {
    // ... bestehender Code bleibt gleich ...
}

// NEU: Methode mit Klassen-Array
#[tauri::command]
pub async fn get_all_spells_with_classes(db: State<'_, Database>) -> Result<Vec<Spell>, String> {
    let conn = db.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    // 1. Zauber aus all_spells View laden
    let mut stmt = conn.prepare(
        "SELECT id, name, level, school, casting_time, range, components, material_components, 
                duration, concentration, ritual, description, higher_levels, classes, data, source 
         FROM all_spells 
         ORDER BY level, name"
    ).map_err(|e: rusqlite::Error| e.to_string())?;

    let spells_iter = stmt.query_map([], |row: &rusqlite::Row| {
        let data_str: String = row.get(14)?;
        Ok((
            row.get::<_, String>(0)?,   // id
            row.get::<_, String>(1)?,   // name
            row.get::<_, i32>(2)?,       // level
            row.get::<_, String>(3)?,    // school
            row.get::<_, String>(4)?,    // casting_time
            row.get::<_, String>(5)?,    // range
            row.get::<_, String>(6)?,    // components
            row.get::<_, Option<String>>(7)?,  // material_components
            row.get::<_, String>(8)?,    // duration
            row.get::<_, i32>(9)? != 0,  // concentration
            row.get::<_, i32>(10)? != 0, // ritual
            row.get::<_, String>(11)?,   // description
            row.get::<_, Option<String>>(12)?,  // higher_levels
            row.get::<_, String>(13)?,   // classes (Legacy)
            from_str(&data_str).unwrap_or_default(),  // data
            row.get::<_, String>(15)?,   // source
        ))
    }).map_err(|e: rusqlite::Error| e.to_string())?;

    let mut spells = Vec::new();
    for spell_row in spells_iter {
        let (id, name, level, school, casting_time, range, components, material_components,
             duration, concentration, ritual, description, higher_levels, classes, data, source) = spell_row?;
        
        // 2. Klassen via JOIN laden
        let mut class_stmt = conn.prepare(
            "SELECT c.id, c.name
             FROM spell_class_mappings scm
             JOIN core_classes c ON scm.class_id = c.id
             WHERE scm.spell_id = ?
             ORDER BY c.name"
        ).map_err(|e: rusqlite::Error| e.to_string())?;

        let classes_iter = class_stmt.query_map([&id], |row: &rusqlite::Row| {
            Ok(SpellClass {
                id: row.get(0)?,
                name: row.get(1)?,
            })
        }).map_err(|e: rusqlite::Error| e.to_string())?;

        let mut classes_details = Vec::new();
        for class in classes_iter {
            classes_details.push(class?);
        }

        // 3. Tags via JOIN laden (optional)
        let mut tag_stmt = conn.prepare(
            "SELECT st.id, st.name, st.category
             FROM spell_tag_mappings stm
             JOIN spell_tags st ON stm.tag_id = st.id
             WHERE stm.spell_id = ?
             ORDER BY st.name"
        ).map_err(|e: rusqlite::Error| e.to_string())?;

        let tags_iter = tag_stmt.query_map([&id], |row: &rusqlite::Row| {
            Ok(SpellTag {
                id: row.get(0)?,
                name: row.get(1)?,
                category: row.get(2)?,
            })
        }).map_err(|e: rusqlite::Error| e.to_string())?;

        let mut tags = Vec::new();
        for tag in tags_iter {
            tags.push(tag?);
        }

        spells.push(Spell {
            id,
            name,
            level,
            school,
            casting_time,
            range,
            components,
            material_components,
            duration,
            concentration,
            ritual,
            description,
            higher_levels,
            classes,  // Legacy String
            classes_details: Some(classes_details),
            tags: if tags.is_empty() { None } else { Some(tags) },
            data,
            source,
        });
    }

    Ok(spells)
}
```

### 3. View Updates

**`src-tauri/src/db/migrations.rs`:**

Die Views müssen aktualisiert werden, um die neuen Felder zu enthalten:

```rust
// all_weapons_unified View (NEU oder aktualisiert)
CREATE VIEW all_weapons_unified AS
SELECT 
    COALESCE(c.id, core.id) as id,
    COALESCE(c.name, core.name) as name,
    COALESCE(c.category, core.category) as category,
    COALESCE(c.mastery_id, core.mastery_id) as mastery_id,
    COALESCE(c.damage_dice, core.damage_dice) as damage_dice,
    COALESCE(c.damage_type, core.damage_type) as damage_type,
    COALESCE(c.weight_kg, core.weight_kg) as weight_kg,
    COALESCE(c.cost_gp, core.cost_gp) as cost_gp,
    COALESCE(c.data, core.data) as data,
    CASE 
        WHEN c.parent_id IS NOT NULL THEN 'override' 
        WHEN c.is_homebrew = 1 THEN 'homebrew' 
        ELSE 'core' 
    END as source
FROM core_weapons core 
LEFT JOIN custom_weapons c ON c.parent_id = core.id 
UNION 
SELECT id, name, category, mastery_id, damage_dice, damage_type, weight_kg, cost_gp, data,
       CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
FROM custom_weapons WHERE parent_id IS NULL;

// all_armors View (aktualisiert)
CREATE VIEW all_armors AS
SELECT 
    COALESCE(c.id, core.id) as id,
    COALESCE(c.name, core.name) as name,
    COALESCE(c.category, core.category) as category,
    COALESCE(c.base_ac, core.base_ac) as base_ac,
    COALESCE(c.ac_bonus, core.ac_bonus) as ac_bonus,
    COALESCE(c.ac_formula, core.ac_formula) as ac_formula,
    COALESCE(c.strength_requirement, core.strength_requirement) as strength_requirement,
    COALESCE(c.stealth_disadvantage, core.stealth_disadvantage) as stealth_disadvantage,
    COALESCE(c.don_time_minutes, core.don_time_minutes) as don_time_minutes,
    COALESCE(c.doff_time_minutes, core.doff_time_minutes) as doff_time_minutes,
    COALESCE(c.weight_kg, core.weight_kg) as weight_kg,
    COALESCE(c.cost_gp, core.cost_gp) as cost_gp,
    COALESCE(c.data, core.data) as data,
    CASE 
        WHEN c.parent_id IS NOT NULL THEN 'override' 
        WHEN c.is_homebrew = 1 THEN 'homebrew' 
        ELSE 'core' 
    END as source
FROM core_armors core 
LEFT JOIN custom_armors c ON c.parent_id = core.id 
UNION 
SELECT id, name, category, base_ac, ac_bonus, ac_formula, strength_requirement, 
       stealth_disadvantage, don_time_minutes, doff_time_minutes, weight_kg, cost_gp, data,
       CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
FROM custom_armors WHERE parent_id IS NULL;
```

---

## Frontend-Änderungen (TypeScript/React)

### 1. Type Definitions

#### `src/lib/types.ts`

```typescript
// ENTFERNT: weapon_type
// HINZUGEFÜGT: mastery_id, properties, mastery
export interface Weapon {
  id: string;
  name: string;
  category: string;
  mastery_id: string;  // NEU
  damage_dice: string;
  damage_type: string;
  weight_kg: number;
  cost_gp: number;
  properties: WeaponProperty[];  // NEU
  mastery?: WeaponMastery;  // NEU (optional)
  data: WeaponData;
  source: "core" | "override" | "homebrew";
}

export interface WeaponProperty {
  id: string;
  name: string;
  description: string;
  has_parameter: boolean;
  parameter_type?: string;  // 'range', 'damage', 'ammo', etc.
  parameter_value?: any;    // JSON für komplexe Parameter
}

export interface WeaponMastery {
  id: string;
  name: string;
  description: string;
}

// ENTFERNT: weapon_type
export interface CustomWeapon {
  id?: string;
  name: string;
  category: string;
  mastery_id: string;  // NEU
  damage_dice: string;
  damage_type: string;
  weight_kg: number;
  cost_gp: number;
  data: any;
  parent_id?: string;
  is_homebrew?: boolean;
}

// ERWEITERT: Neue Felder, properties
export interface Armor {
  id: string;
  name: string;
  category: string;
  base_ac: number | null;  // GEÄNDERT: kann null sein
  ac_bonus: number;          // NEU
  ac_formula?: string;       // NEU
  strength_requirement: number | null;
  stealth_disadvantage: boolean;
  don_time_minutes?: number | null;  // NEU
  doff_time_minutes?: number | null; // NEU
  properties: ArmorProperty[];  // NEU
  weight_kg: number;
  cost_gp: number;
  data: ArmorData;
  source: "core" | "override" | "homebrew";
}

export interface ArmorProperty {
  id: string;
  name: string;
  description: string;
  parameter_value?: any;  // JSON für komplexe Parameter
}

// ERWEITERT: Neue Felder
export interface CustomArmor {
  id?: string;
  name: string;
  category: string;
  base_ac: number | null;  // GEÄNDERT
  ac_bonus: number;        // NEU
  ac_formula?: string;     // NEU
  strength_requirement: number | null;
  stealth_disadvantage: boolean;
  don_time_minutes?: number | null;  // NEU
  doff_time_minutes?: number | null; // NEU
  weight_kg: number;
  cost_gp: number;
  data: any;
  parent_id?: string;
  is_homebrew?: boolean;
}

// ERWEITERT: Optional classes_details, tags
export interface Spell {
  id: string;
  name: string;
  level: number;
  school: string;
  casting_time: string;
  range: string;
  components: string;
  material_components?: string;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  description: string;
  higher_levels?: string;
  classes: string;  // BEHALTEN (Legacy)
  classes_details?: SpellClass[];  // NEU (optional)
  tags?: SpellTag[];  // NEU (optional)
  data: any;
  source: "core" | "override" | "homebrew";
}

export interface SpellClass {
  id: string;
  name: string;
}

export interface SpellTag {
  id: string;
  name: string;
  category?: string;
}
```

#### `src/lib/types/weapons.ts` (aktualisiert)

```typescript
export interface Weapon {
  id: string;
  name: string;
  category: string;
  mastery_id: string;  // NEU (statt weapon_type)
  damage_dice: string;
  damage_type: string;
  weight_kg: number;
  cost_gp: number;
  properties: WeaponProperty[];  // NEU
  mastery?: WeaponMastery;  // NEU
  data: WeaponData;
  source: 'core' | 'homebrew' | 'override';
}

export interface WeaponData {
  // properties und mastery werden jetzt direkt im Weapon-Objekt gespeichert
  // Diese Felder bleiben für Legacy-Daten oder zusätzliche Metadaten
  range?: WeaponRange;
  thrown_range?: WeaponRange;
  versatile_damage?: string;
  ammunition_type?: string;
  source_page: number;
}

export interface WeaponProperty {
  id: string;
  name: string;
  description: string;
  has_parameter: boolean;
  parameter_type?: string;
  parameter_value?: any;
}

export interface WeaponMastery {
  id: string;
  name: string;
  description: string;
}
```

#### `src/lib/types/armors.ts` (aktualisiert)

```typescript
export interface Armor {
  id: string;
  name: string;
  category: string;
  base_ac: number | null;  // GEÄNDERT
  ac_bonus: number;         // NEU
  ac_formula?: string;      // NEU
  strength_requirement: number | null;
  stealth_disadvantage: boolean;
  don_time_minutes?: number | null;  // NEU
  doff_time_minutes?: number | null; // NEU
  properties: ArmorProperty[];  // NEU
  weight_kg: number;
  cost_gp: number;
  data: ArmorData;
  source: 'core' | 'homebrew' | 'override';
}

export interface ArmorProperty {
  id: string;
  name: string;
  description: string;
  parameter_value?: any;
}

export interface ArmorData {
  dex_bonus: {
    apply: boolean;
    max: number | null;
  };
  ac_formula: string;  // Wird jetzt direkt im Armor-Objekt gespeichert
  source_page: number;
}
```

### 2. API Layer

#### `src/lib/api.ts`

```typescript
export const compendiumApi = {
  // ... bestehende Methoden ...
  
  async getWeapons(): Promise<Weapon[]> {
    return await invoke("get_all_weapons");
  },
  
  async getArmor(): Promise<Armor[]> {
    return await invoke("get_all_armor");
  },
  
  async getSpells(): Promise<Spell[]> {
    return await invoke("get_all_spells");  // Legacy (classes als String)
  },
  
  // NEU: Methode mit Klassen-Array
  async getSpellsWithClasses(): Promise<Spell[]> {
    return await invoke("get_all_spells_with_classes");
  },
};
```

### 3. Komponenten-Updates

#### `src/components/Compendium.tsx`

**Waffen-Anzeige anpassen:**

```typescript
// ALT (Zeile 629):
<StatRow
  label="Eigenschaft"
  value={selectedItem.weapon_type}
  icon={Sword}
/>

// NEU:
<StatRow
  label="Eigenschaften"
  value={selectedItem.properties.map(p => p.name).join(", ")}
  icon={Sword}
/>

// Mastery-Anzeige (bereits vorhanden, aber anpassen):
<StatRow
  label="Meisterung"
  value={selectedItem.mastery?.name || selectedItem.data.mastery || "—"}
  highlight
  icon={Award}
/>
```

**Rüstungen-Anzeige anpassen:**

```typescript
// ALT (Zeile 658):
<StatRow
  label="Rüstungsklasse"
  value={selectedItem.base_ac}
  highlight
  icon={Shield}
/>

// NEU:
<StatRow
  label="Rüstungsklasse"
  value={
    selectedItem.ac_formula 
      ? selectedItem.ac_formula 
      : selectedItem.base_ac 
        ? `${selectedItem.base_ac}${selectedItem.ac_bonus > 0 ? ` + ${selectedItem.ac_bonus}` : ''}`
        : "—"
  }
  highlight
  icon={Shield}
/>

// NEU: An-/Ablegezeiten
{selectedItem.don_time_minutes && (
  <StatRow
    label="Anlegen"
    value={`${selectedItem.don_time_minutes} Min.`}
  />
)}
{selectedItem.doff_time_minutes && (
  <StatRow
    label="Ablegen"
    value={`${selectedItem.doff_time_minutes} Min.`}
  />
)}

// NEU: Eigenschaften
{selectedItem.properties.length > 0 && (
  <ClickableStatRow
    label="Eigenschaften"
    items={selectedItem.properties.map(p => p.name)}
    itemsData={[]}  // TODO: Property-Details laden
    onItemClick={(id) => {/* TODO */}}
  />
)}
```

**Zauber-Anzeige anpassen:**

```typescript
// ALT (Zeile 300-311):
{activeTab === "spells" && (
  <span className={cn(...)}>
    G{item.level}
  </span>
)}

// NEU: Klassen anzeigen (mit classes_details falls verfügbar)
{activeTab === "spells" && (
  <>
    <span className={cn(...)}>
      G{item.level}
    </span>
    {item.classes_details && item.classes_details.length > 0 && (
      <div className="flex flex-wrap gap-1 mt-1">
        {item.classes_details.map(cls => (
          <span key={cls.id} className="text-[8px] font-bold px-1.5 py-0.5 bg-primary/10 text-primary rounded">
            {cls.name}
          </span>
        ))}
      </div>
    )}
  </>
)}
```

#### `src/components/character/CombatStats.tsx`

**Waffen-Angriffe anpassen:**

```typescript
// ALT (Zeile 85):
<p className="text-[10px] text-muted-foreground italic">
  {atk.properties.join(", ")}
</p>

// NEU: Properties aus Weapon-Objekt nutzen
// (atk sollte bereits Weapon-Objekt sein, nicht nur Name)
// Falls nicht, muss calculateDerivedStats angepasst werden
```

**AC-Berechnung anpassen:**

```typescript
// calculateDerivedStats muss angepasst werden, um:
// - ac_formula zu parsen
// - ac_bonus zu berücksichtigen
// - base_ac kann null sein
```

---

## Migration-Strategie

### Phase 1: Backend-Schema (Rust)
1. ✅ Mapping-Tabellen erstellen (bereits in Konzepten definiert)
2. ✅ Views aktualisieren (`all_weapons_unified`, `all_armors`)
3. ✅ Type Definitions aktualisieren
4. ✅ Commands aktualisieren (JOINs mit Mapping-Tabellen)

### Phase 2: Frontend-Types (TypeScript)
1. ✅ Type Definitions aktualisieren
2. ✅ API Layer erweitern (neue Methoden)
3. ⚠️ Komponenten schrittweise anpassen (Rückwärtskompatibilität)

### Phase 3: Daten-Migration
1. ✅ Waffen-Import (mit Properties & Masteries)
2. ✅ Rüstungen-Import (mit neuen Feldern & Properties)
3. ✅ Zauber-Klassen-Migration (Mapping-Tabelle befüllen)

### Phase 4: Frontend-Komponenten
1. ✅ Komponenten schrittweise anpassen
2. ✅ Legacy-Code entfernen (nach erfolgreicher Migration)

---

## Rückwärtskompatibilität

### Waffen
- **Legacy:** `weapon_type` String
- **Neu:** `mastery_id` + `properties` Array
- **Strategie:** `weapons_legacy` View bereitstellen (falls nötig)

### Rüstungen
- **Legacy:** Nur `base_ac`
- **Neu:** `base_ac` (nullable) + `ac_bonus` + `ac_formula`
- **Strategie:** `base_ac` bleibt, neue Felder optional

### Zauber
- **Legacy:** `classes` String (komma-getrennt)
- **Neu:** `classes` String (bleibt) + `classes_details` Array (optional)
- **Strategie:** Beide Formate parallel, schrittweise Migration

---

## Testing-Strategie

### Backend Tests
- [ ] Unit Tests für neue Commands
- [ ] Integration Tests für JOINs
- [ ] Validierung der Mapping-Tabellen

### Frontend Tests
- [ ] Type-Checks (TypeScript)
- [ ] Komponenten-Tests (React Testing Library)
- [ ] E2E Tests für Kompendium-Anzeige

---

## Checkliste

### Backend
- [ ] Type Definitions aktualisieren (`weapons.rs`, `compendium.rs`, `spell.rs`)
- [ ] Commands aktualisieren (`get_all_weapons`, `get_all_armor`, `get_all_spells_with_classes`)
- [ ] Views aktualisieren (`all_weapons_unified`, `all_armors`)
- [ ] Tests schreiben

### Frontend
- [ ] Type Definitions aktualisieren (`types.ts`, `types/weapons.ts`, `types/armors.ts`)
- [ ] API Layer erweitern (`api.ts`)
- [ ] Komponenten anpassen (`Compendium.tsx`, `CombatStats.tsx`)
- [ ] Legacy-Code entfernen (nach Migration)
- [ ] Tests schreiben

### Daten-Migration
- [ ] Waffen-Import mit Properties & Masteries
- [ ] Rüstungen-Import mit neuen Feldern & Properties
- [ ] Zauber-Klassen-Migration
- [ ] Validierung durchführen

---

## Priorität

**HOCH** - Sollte parallel zu den Mapping-Tabellen implementiert werden:
- ✅ Waffen-Mapping (kritisch für Waffen-Import)
- ✅ Rüstungen-Mapping (kritisch für Rüstungen-Import)
- ✅ Zauber-Klassen-Mapping (häufige Abfrage)

**NIEDRIG** - Kann später implementiert werden:
- ⚠️ Zauber-Tags-Mapping (optional, nur wenn nötig)
