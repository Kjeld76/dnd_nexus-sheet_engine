use rusqlite::{Connection, Transaction};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::fs;
use std::path::Path;
use uuid::Uuid;

#[derive(Serialize, Deserialize)]
struct SeedSpell {
    name: String,
    level: i32,
    school: String,
    data: String,
}

pub fn seed_core_data(conn: &mut Connection) -> Result<(), String> {
    // Clear old data first
    clear_core_data(conn)?;

    // Try to import from the strict database if it exists
    let db_path = Path::new("../dnd5e_strict.db");
    if db_path.exists() {
        return import_from_strict_db(conn, db_path);
    }

    let tx = conn.transaction().map_err(|e| e.to_string())?;
    
    // Fallback to JSON files if strict DB is not found
    if let Ok(content) = fs::read_to_string("../tools/output/spells.json") {
        let spells: Vec<SeedSpell> = serde_json::from_str(&content).map_err(|e| e.to_string())?;
        for spell in spells {
            tx.execute(
                "INSERT OR REPLACE INTO core_spells (id, name, level, school, data) VALUES (?, ?, ?, ?, ?)",
                (Uuid::new_v4().to_string(), spell.name, spell.level, spell.school, spell.data),
            ).map_err(|e| e.to_string())?;
        }
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

fn import_from_strict_db(target_conn: &mut Connection, source_path: &Path) -> Result<(), String> {
    let source_conn = Connection::open(source_path).map_err(|e| e.to_string())?;
    let tx = target_conn.transaction().map_err(|e| e.to_string())?;

    // 1. Spells import (with class mapping)
    let mut stmt = source_conn
        .prepare("SELECT s.id, s.name, s.level, sc.name as school, s.time, s.range, s.duration, s.description, s.is_concentration, s.is_ritual 
                  FROM spells s JOIN schools sc ON s.school_id = sc.id")
        .map_err(|e| e.to_string())?;

    let spell_iter = stmt
        .query_map([], |row| {
            let source_id: i32 = row.get(0)?;
            let name: String = row.get(1)?;
            let level: i32 = row.get(2)?;
            let school: String = row.get(3)?;
            
            // Get classes for this spell
            let mut class_stmt = source_conn.prepare("
                SELECT c.name FROM classes c
                JOIN spell_classes sc ON c.id = sc.class_id
                WHERE sc.spell_id = ?
            ").unwrap();
            let classes: Vec<String> = class_stmt.query_map([source_id], |c_row| c_row.get(0)).unwrap().map(|c| c.unwrap()).collect();

            let data = json!({
                "time": row.get::<_, Option<String>>(4)?.unwrap_or_default(),
                "range": row.get::<_, Option<String>>(5)?.unwrap_or_default(),
                "duration": row.get::<_, Option<String>>(6)?.unwrap_or_default(),
                "description": row.get::<_, Option<String>>(7)?.unwrap_or_default(),
                "concentration": row.get::<_, Option<bool>>(8)?.unwrap_or(false),
                "ritual": row.get::<_, Option<bool>>(9)?.unwrap_or(false),
                "classes": classes
            });
            Ok((name, level, school, data.to_string()))
        })
        .map_err(|e| e.to_string())?;

    for spell in spell_iter {
        let (name, level, school, data) = spell.map_err(|e| e.to_string())?;
        tx.execute(
            "INSERT INTO core_spells (id, name, level, school, data) VALUES (?, ?, ?, ?, ?)",
            (Uuid::new_v4().to_string(), name, level, school, data),
        )
        .map_err(|e| e.to_string())?;
    }

    // 2. Species import
    let mut stmt = source_conn
        .prepare("SELECT id, name, speed, size FROM species")
        .map_err(|e| e.to_string())?;

    let species_iter = stmt
        .query_map([], |row| {
            let source_id: i32 = row.get(0)?;
            let name: String = row.get(1)?;
            let speed: f64 = row.get(2)?;
            let size: String = row.get(3)?;

            // Get traits for this species
            let mut trait_stmt = source_conn.prepare("SELECT name, description FROM species_traits WHERE species_id = ?").unwrap();
            let traits: Vec<_> = trait_stmt.query_map([source_id], |t_row| {
                Ok(json!({
                    "name": t_row.get::<_, String>(0)?,
                    "description": t_row.get::<_, String>(1)?
                }))
            }).unwrap().map(|t| t.unwrap()).collect();

            let data = json!({
                "speed": speed,
                "size": size,
                "traits": traits
            });

            Ok((name, data.to_string()))
        })
        .map_err(|e| e.to_string())?;

    for species in species_iter {
        let (name, data) = species.map_err(|e| e.to_string())?;
        tx.execute(
            "INSERT INTO core_species (id, name, data) VALUES (?, ?, ?)",
            (Uuid::new_v4().to_string(), name, data),
        )
        .map_err(|e| e.to_string())?;
    }

    // 3. Classes import
    let mut stmt = source_conn
        .prepare("SELECT name FROM classes")
        .map_err(|e| e.to_string())?;

    let class_iter = stmt.query_map([], |row| row.get::<_, String>(0)).map_err(|e| e.to_string())?;

    for class_name in class_iter {
        let name = class_name.map_err(|e| e.to_string())?;
        let data = json!({}).to_string(); // Minimal data for now
        tx.execute(
            "INSERT INTO core_classes (id, name, data) VALUES (?, ?, ?)",
            (Uuid::new_v4().to_string(), name, data),
        )
        .map_err(|e| e.to_string())?;
    }

    // 4. Items import
    let mut stmt = source_conn
        .prepare("SELECT i.name, it.name as category, i.cost_cp, i.weight, 
                         w.damage_dice, dt.name as damage_type,
                         a.ac_base, a.dex_bonus_max, a.strength_requirement, a.stealth_disadvantage,
                         mi.rarity, mi.requires_attunement
                  FROM items i 
                  JOIN item_types it ON i.item_type_id = it.id
                  LEFT JOIN weapons w ON i.id = w.item_id
                  LEFT JOIN damage_types dt ON w.damage_type_id = dt.id
                  LEFT JOIN armor a ON i.id = a.item_id
                  LEFT JOIN magic_items mi ON i.id = mi.item_id")
        .map_err(|e| e.to_string())?;

    let item_iter = stmt
        .query_map([], |row| {
            let name: String = row.get(0)?;
            let category: String = row.get(1)?;
            let mut data_map = serde_json::Map::new();
            let cost: Option<i32> = row.get(2).ok();
            data_map.insert("cost_cp".to_string(), json!(cost.unwrap_or(0)));
            let weight: Option<f64> = row.get(3).ok();
            data_map.insert("weight".to_string(), json!(weight.unwrap_or(0.0)));

            if let Ok(Some(dice)) = row.get::<_, Option<String>>(4) {
                data_map.insert("damage_dice".to_string(), json!(dice));
                data_map.insert("damage_type".to_string(), json!(row.get::<_, Option<String>>(5).unwrap_or(None)));
            }

            if let Ok(Some(ac)) = row.get::<_, Option<i32>>(6) {
                data_map.insert("ac_base".to_string(), json!(ac));
                data_map.insert("dex_bonus_max".to_string(), json!(row.get::<_, Option<i32>>(7).unwrap_or(None)));
                data_map.insert("strength_req".to_string(), json!(row.get::<_, Option<i32>>(8).unwrap_or(None)));
                data_map.insert("stealth_dis".to_string(), json!(row.get::<_, Option<bool>>(9).unwrap_or(None)));
            }

            if let Ok(Some(rarity)) = row.get::<_, Option<String>>(10) {
                data_map.insert("rarity".to_string(), json!(rarity));
                data_map.insert("attunement".to_string(), json!(row.get::<_, Option<bool>>(11).unwrap_or(None)));
            }

            Ok((name, category, json!(data_map).to_string()))
        })
        .map_err(|e| e.to_string())?;

    for item in item_iter {
        let (name, category, data) = item.map_err(|e| e.to_string())?;
        tx.execute(
            "INSERT INTO core_items (id, name, category, data) VALUES (?, ?, ?, ?)",
            (Uuid::new_v4().to_string(), name, category, data),
        )
        .map_err(|e| e.to_string())?;
    }

    // 5. Feats import
    let mut stmt = source_conn
        .prepare("SELECT id, name, description FROM feats")
        .map_err(|e| e.to_string())?;

    let feat_iter = stmt
        .query_map([], |row| {
            let source_id: i32 = row.get(0)?;
            let name: String = row.get(1)?;
            let description: String = row.get(2)?;

            // Get effects for this feat
            let mut effect_stmt = source_conn.prepare("SELECT effect_type, effect_value FROM feat_effects WHERE feat_id = ?").unwrap();
            let effects: Vec<_> = effect_stmt.query_map([source_id], |e_row| {
                Ok(json!({
                    "type": e_row.get::<_, String>(0)?,
                    "value": e_row.get::<_, String>(1)?
                }))
            }).unwrap().map(|e| e.unwrap()).collect();

            let data = json!({
                "description": description,
                "effects": effects
            });

            Ok((name, data.to_string()))
        })
        .map_err(|e| e.to_string())?;

    for feat in feat_iter {
        let (name, data) = feat.map_err(|e| e.to_string())?;
        tx.execute(
            "INSERT INTO core_feats (id, name, data) VALUES (?, ?, ?)",
            (Uuid::new_v4().to_string(), name, data),
        )
        .map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

pub fn clear_core_data(conn: &Connection) -> Result<(), String> {
    conn.execute("DELETE FROM core_spells", []).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM core_species", []).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM core_classes", []).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM core_items", []).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM core_feats", []).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn import_phb_data(db: tauri::State<'_, crate::db::Database>) -> Result<(), String> {
    let mut conn = db.0.lock().unwrap();
    seed_core_data(&mut conn)
}


