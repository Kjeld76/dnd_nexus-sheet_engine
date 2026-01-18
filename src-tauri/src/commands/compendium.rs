use tauri::State;
use crate::db::Database;
use crate::error::{AppResult, map_lock_error};
use crate::types::spell::Spell;
use crate::types::compendium::{Species, Class, Gear, Tool, Feat, Armor, ArmorProperty, Skill, Background, Item, Equipment, MagicItem};
use crate::types::weapons::{Weapon, WeaponProperty, WeaponMastery};
use serde_json::{from_str, json, Value};
use rusqlite::params;

/// Retrieves all spells from the database with optional pagination.
///
/// # Arguments
/// * `db` - Database connection state
/// * `limit` - Maximum number of spells to return (default: 1000)
/// * `offset` - Number of spells to skip (default: 0)
///
/// # Returns
/// Vector of spells ordered by level and name
///
/// # Errors
/// Returns `AppError` if database operation fails
#[tauri::command]
pub async fn get_all_spells(
    db: State<'_, Database>,
    limit: Option<usize>,
    offset: Option<usize>,
) -> Result<Vec<Spell>, String> {
    let result: AppResult<Vec<Spell>> = (|| {
        let conn = map_lock_error(db.0.lock())?;
        
        let limit = limit.unwrap_or(1000);
        let offset = offset.unwrap_or(0);
        
        let mut stmt = conn.prepare(
            "SELECT id, name, level, school, casting_time, range, components, material_components, duration, concentration, ritual, description, higher_levels, classes, data, source 
             FROM all_spells 
             ORDER BY level, name 
             LIMIT ? OFFSET ?"
        )?;

        let iter = stmt.query_map(params![limit, offset], |row: &rusqlite::Row| {
            let data_str: String = row.get(14)?;
            Ok(Spell {
                id: row.get(0)?,
                name: row.get(1)?,
                level: row.get(2)?,
                school: row.get(3)?,
                casting_time: row.get(4)?,
                range: row.get(5)?,
                components: row.get(6)?,
                material_components: row.get(7)?,
                duration: row.get(8)?,
                concentration: row.get::<_, i32>(9)? != 0,
                ritual: row.get::<_, i32>(10)? != 0,
                description: row.get(11)?,
                higher_levels: row.get(12)?,
                classes: row.get(13)?,
                data: from_str(&data_str).unwrap_or_default(),
                source: row.get(15)?,
            })
        })?;

        let mut results = Vec::new();
        for spell in iter {
            results.push(spell?);
        }
        Ok(results)
    })();
    
    result.map_err(|e| e.to_string())
}

/// Retrieves all species from the database.
///
/// # Arguments
/// * `db` - Database connection state
///
/// # Returns
/// Vector of species ordered by name
///
/// # Errors
/// Returns `AppError` if database operation fails
#[tauri::command]
pub async fn get_all_species(db: State<'_, Database>) -> Result<Vec<Species>, String> {
    let result: AppResult<Vec<Species>> = (|| {
        let conn = map_lock_error(db.0.lock())?;
        let mut stmt = conn.prepare("SELECT id, name, data, source FROM all_species ORDER BY name")?;

        let iter = stmt.query_map([], |row: &rusqlite::Row| {
            let data_str: String = row.get(2)?;
            Ok(Species {
                id: row.get(0)?,
                name: row.get(1)?,
                data: from_str(&data_str).unwrap_or_default(),
                source: row.get(3)?,
            })
        })?;

        let mut results = Vec::new();
        for species in iter {
            results.push(species?);
        }
        Ok(results)
    })();
    
    result.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_all_classes(db: State<'_, Database>) -> Result<Vec<Class>, String> {
    let result: AppResult<Vec<Class>> = (|| {
        let conn = map_lock_error(db.0.lock())?;
        let mut stmt = conn.prepare("SELECT id, name, data, source FROM all_classes ORDER BY name")?;

        let iter = stmt.query_map([], |row: &rusqlite::Row| {
            let data_str: String = row.get(2)?;
            Ok(Class {
                id: row.get(0)?,
                name: row.get(1)?,
                data: from_str(&data_str).unwrap_or_default(),
                source: row.get(3)?,
            })
        })?;

        let mut results = Vec::new();
        for class in iter {
            results.push(class?);
        }
        Ok(results)
    })();

    result.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_all_gear(db: State<'_, Database>) -> Result<Vec<Gear>, String> {
    let result: AppResult<Vec<Gear>> = (|| {
        let conn = map_lock_error(db.0.lock())?;
        let mut stmt = conn.prepare(
            "SELECT id, name, description, cost_gp, weight_kg, data, source FROM all_gear ORDER BY name",
        )?;

        let iter = stmt.query_map([], |row: &rusqlite::Row| {
            let data_str: String = row.get(5)?;
            Ok(Gear {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                cost_gp: row.get(3)?,
                weight_kg: row.get(4)?,
                data: from_str(&data_str).unwrap_or_default(),
                source: row.get(6)?,
            })
        })?;

        let mut results = Vec::new();
        for gear in iter {
            results.push(gear?);
        }
        Ok(results)
    })();

    result.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_all_tools(db: State<'_, Database>) -> Result<Vec<Tool>, String> {
    let result: AppResult<Vec<Tool>> = (|| {
        let conn = map_lock_error(db.0.lock())?;
        let mut stmt = conn.prepare(
            "SELECT id, name, category, cost_gp, weight_kg, data, source FROM all_tools ORDER BY name",
        )?;

        let iter = stmt.query_map([], |row: &rusqlite::Row| {
            let data_str: String = row.get(5)?;
            Ok(Tool {
                id: row.get(0)?,
                name: row.get(1)?,
                category: row.get(2)?,
                cost_gp: row.get(3)?,
                weight_kg: row.get(4)?,
                data: from_str(&data_str).unwrap_or_default(),
                source: row.get(6)?,
            })
        })?;

        let mut results = Vec::new();
        for tool in iter {
            results.push(tool?);
        }
        Ok(results)
    })();

    result.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_all_weapons(db: State<'_, Database>) -> Result<Vec<Weapon>, String> {
    let result: AppResult<Vec<Weapon>> = (|| {
        let conn = map_lock_error(db.0.lock())?;

        // Optimiert: Alle Daten in einem Query mit LEFT JOINs
        let mut stmt = conn.prepare(
            "SELECT 
                w.id, w.name, w.category, w.category_label, w.weapon_subtype, w.mastery_id, w.damage_dice, w.damage_type, 
                w.weight_kg, w.cost_gp, w.data, w.source,
                wp.id as prop_id, wp.name as prop_name, wp.description as prop_desc,
                wp.has_parameter as prop_has_param, wp.parameter_type as prop_param_type,
                wpm.parameter_value as prop_param_value,
                wm.id as mastery_id_full, wm.name as mastery_name, wm.description as mastery_desc
             FROM all_weapons_unified w
             LEFT JOIN weapon_property_mappings wpm ON wpm.weapon_id = w.id
             LEFT JOIN weapon_properties wp ON wpm.property_id = wp.id
             LEFT JOIN weapon_masteries wm ON wm.id = w.mastery_id
             ORDER BY w.name, wp.name",
        )?;

        let rows = stmt.query_map([], |row: &rusqlite::Row| {
            Ok((
                row.get::<_, String>(0)?,         // weapon id
                row.get::<_, String>(1)?,         // weapon name
                row.get::<_, String>(2)?,         // category
                row.get::<_, Option<String>>(3)?, // category_label
                row.get::<_, Option<String>>(4)?, // weapon_subtype
                row.get::<_, Option<String>>(5)?, // mastery_id
                row.get::<_, String>(6)?,         // damage_dice
                row.get::<_, String>(7)?,         // damage_type
                row.get::<_, f64>(8)?,            // weight_kg
                row.get::<_, f64>(9)?,            // cost_gp
                row.get::<_, String>(10)?,         // data
                row.get::<_, String>(11)?,        // source
                row.get::<_, Option<String>>(12)?, // prop_id
                row.get::<_, Option<String>>(13)?, // prop_name
                row.get::<_, Option<String>>(14)?, // prop_desc
                row.get::<_, Option<i32>>(15)?,    // prop_has_param
                row.get::<_, Option<String>>(16)?, // prop_param_type
                row.get::<_, Option<String>>(17)?, // prop_param_value
                row.get::<_, Option<String>>(18)?, // mastery_id_full
                row.get::<_, Option<String>>(19)?, // mastery_name
                row.get::<_, Option<String>>(20)?, // mastery_desc
            ))
        })?;

        // Gruppiere Zeilen nach Waffe
        use std::collections::HashMap;
        let mut weapons_map: HashMap<String, Weapon> = HashMap::new();

        for row_result in rows {
            let (
                weapon_id,
                weapon_name,
                category,
                category_label,
                weapon_subtype,
                mastery_id_opt,
                damage_dice,
                damage_type,
                weight_kg,
                cost_gp,
                data_str,
                source,
                prop_id,
                prop_name,
                prop_desc,
                prop_has_param,
                prop_param_type,
                prop_param_value,
                mastery_id_full,
                mastery_name,
                mastery_desc,
            ) = row_result?;

            let weapon = weapons_map.entry(weapon_id.clone()).or_insert_with(|| {
                let mastery_id = mastery_id_opt.clone().unwrap_or_default();
                // Debug: Log data_str für Kurzbogen
                if weapon_name == "Kurzbogen" {
                    eprintln!("DEBUG Kurzbogen data_str: {}", data_str);
                }
                let data = match from_str::<Value>(&data_str) {
                    Ok(v) => v,
                    Err(e) => {
                        eprintln!("ERROR deserializing weapon data for {}: {} | data_str: {}", weapon_name, e, data_str);
                        serde_json::json!({"source_page": 0})
                    }
                };

                let mastery = if let (Some(id), Some(name), Some(desc)) =
                    (mastery_id_full.clone(), mastery_name.clone(), mastery_desc.clone())
                {
                    Some(WeaponMastery {
                        id,
                        name,
                        description: desc,
                    })
                } else {
                    None
                };

                Weapon {
                    id: weapon_id.clone(),
                    name: weapon_name.clone(),
                    category: category.clone(),
                    category_label: category_label.clone(),
                    weapon_subtype: weapon_subtype.clone(),
                    mastery_id,
                    damage_dice: damage_dice.clone(),
                    damage_type: damage_type.clone(),
                    weight_kg,
                    cost_gp,
                    properties: Vec::new(),
                    mastery,
                    data,
                    source: source.clone(),
                }
            });

            // Füge Property hinzu, falls vorhanden
            if let (Some(prop_id), Some(prop_name), Some(prop_desc)) = (prop_id, prop_name, prop_desc)
            {
                let has_param = prop_has_param.map(|v| v != 0).unwrap_or(false);
                let param_value = prop_param_value.and_then(|s| from_str(&s).ok());

                // Prüfe ob Property bereits hinzugefügt wurde (verhindere Duplikate)
                // WICHTIG: Prüfe sowohl auf ID als auch auf Name (normalisiert), um sicherzustellen
                let prop_name_lower = prop_name.to_lowercase().trim().to_string();
                let is_duplicate = weapon.properties.iter().any(|p| {
                    p.id == prop_id || p.name.to_lowercase().trim() == prop_name_lower
                });
                
                if !is_duplicate {
                    weapon.properties.push(WeaponProperty {
                        id: prop_id,
                        name: prop_name,
                        description: prop_desc,
                        has_parameter: has_param,
                        parameter_type: prop_param_type,
                        parameter_value: param_value,
                    });
                } else {
                    // Debug: Log Duplikat
                    eprintln!("WARNING: Duplicate property '{}' detected for weapon '{}' - skipping", prop_id, weapon.name);
                }
            }

            // Setze Mastery, falls noch nicht gesetzt und vorhanden
            if weapon.mastery.is_none() {
                if let (Some(id), Some(name), Some(desc)) = (mastery_id_full, mastery_name, mastery_desc) {
                    weapon.mastery = Some(WeaponMastery {
                        id,
                        name,
                        description: desc,
                    });
                }
            }
        }

        let mut weapons: Vec<Weapon> = weapons_map.into_values().collect();
        weapons.sort_by(|a, b| a.name.cmp(&b.name));
        Ok(weapons)
    })();

    result.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_all_armor(db: State<'_, Database>) -> Result<Vec<Armor>, String> {
    let result: AppResult<Vec<Armor>> = (|| {
        let conn = map_lock_error(db.0.lock())?;

        // 1. Rüstungen aus all_armors View laden
        let mut stmt = conn.prepare(
            "SELECT id, name, category, category_label, base_ac, ac_bonus, ac_formula, strength_requirement, stealth_disadvantage, don_time_minutes, doff_time_minutes, weight_kg, cost_gp, data, source 
             FROM all_armors 
             ORDER BY name",
        )?;

        let armors_iter = stmt.query_map([], |row: &rusqlite::Row| {
            let data_str: String = row.get(13)?;
            Ok((
                row.get::<_, String>(0)?,         // id
                row.get::<_, String>(1)?,         // name
                row.get::<_, String>(2)?,         // category
                row.get::<_, Option<String>>(3)?,  // category_label
                row.get::<_, Option<i32>>(4)?,    // base_ac
                row.get::<_, i32>(5)?,            // ac_bonus
                row.get::<_, Option<String>>(6)?, // ac_formula
                row.get::<_, Option<i32>>(7)?,    // strength_requirement
                row.get::<_, i32>(8)? != 0,       // stealth_disadvantage
                row.get::<_, Option<i32>>(9)?,    // don_time_minutes
                row.get::<_, Option<i32>>(10)?,   // doff_time_minutes
                row.get::<_, f64>(11)?,           // weight_kg
                row.get::<_, f64>(12)?,           // cost_gp
                from_str(&data_str).unwrap_or_default(), // data
                row.get::<_, String>(14)?,        // source
            ))
        })?;

        let mut armors = Vec::new();
        for armor_row in armors_iter {
            let (
                id,
                name,
                category,
                category_label_opt,
                base_ac,
                ac_bonus,
                ac_formula,
                strength_requirement,
                stealth_disadvantage,
                don_time_minutes,
                doff_time_minutes,
                weight_kg,
                cost_gp,
                data,
                source,
            ) = armor_row?;

            // 2. Properties via JOIN laden
            let mut prop_stmt = conn.prepare(
                "SELECT ap.id, ap.name, ap.description, ap.affects_field, apm.parameter_value
                 FROM armor_property_mappings apm
                 JOIN armor_properties ap ON apm.property_id = ap.id
                 WHERE apm.armor_id = ?
                 ORDER BY ap.name",
            )?;

            let properties_iter = prop_stmt.query_map([&id], |row: &rusqlite::Row| {
                let param_value_str: Option<String> = row.get(4)?;
                Ok(ArmorProperty {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    description: row.get(2)?,
                    affects_field: row.get(3)?,
                    parameter_value: param_value_str.and_then(|s| from_str(&s).ok()),
                })
            })?;

            let mut properties = Vec::new();
            for prop in properties_iter {
                properties.push(prop?);
            }

            let category_label = category_label_opt.unwrap_or_else(|| category.clone());
            armors.push(Armor {
                id,
                name,
                category,
                category_label,
                base_ac,
                ac_bonus,
                ac_formula,
                strength_requirement,
                stealth_disadvantage,
                don_time_minutes,
                doff_time_minutes,
                weight_kg,
                cost_gp,
                properties,
                data,
                source,
            });
        }

        println!("[get_all_armor] Returning {} armors", armors.len());
        Ok(armors)
    })();

    result.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_all_feats(db: State<'_, Database>) -> Result<Vec<Feat>, String> {
    let result: AppResult<Vec<Feat>> = (|| {
        let conn = map_lock_error(db.0.lock())?;
        let mut stmt =
            conn.prepare("SELECT id, name, category, data, source FROM all_feats ORDER BY name")?;

        let iter = stmt.query_map([], |row: &rusqlite::Row| {
            let data_str: String = row.get(3)?;
            Ok(Feat {
                id: row.get(0)?,
                name: row.get(1)?,
                category: row.get(2)?,
                data: from_str(&data_str).unwrap_or_default(),
                source: row.get(4)?,
            })
        })?;

        let mut results = Vec::new();
        for item in iter {
            results.push(item?);
        }
        Ok(results)
    })();

    result.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_all_skills(db: State<'_, Database>) -> Result<Vec<Skill>, String> {
    let result: AppResult<Vec<Skill>> = (|| {
        let conn = map_lock_error(db.0.lock())?;
        let mut stmt = conn.prepare(
            "SELECT id, name, ability, description, source FROM all_skills ORDER BY name",
        )?;

        let iter = stmt.query_map([], |row: &rusqlite::Row| {
            Ok(Skill {
                id: row.get(0)?,
                name: row.get(1)?,
                ability: row.get(2)?,
                description: row.get(3)?,
                source: row.get(4)?,
            })
        })?;

        let mut results = Vec::new();
        for item in iter {
            results.push(item?);
        }
        Ok(results)
    })();

    result.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_all_backgrounds(db: State<'_, Database>) -> Result<Vec<Background>, String> {
    let result: AppResult<Vec<Background>> = (|| {
        let conn = map_lock_error(db.0.lock())?;
        let mut stmt =
            conn.prepare("SELECT id, name, data, source FROM all_backgrounds ORDER BY name")?;

        let iter = stmt.query_map([], |row: &rusqlite::Row| {
            let data_str: String = row.get(2)?;
            Ok(Background {
                id: row.get(0)?,
                name: row.get(1)?,
                data: from_str(&data_str).unwrap_or_default(),
                source: row.get(3)?,
            })
        })?;

        let mut results = Vec::new();
        for item in iter {
            results.push(item?);
        }
        Ok(results)
    })();

    result.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_all_items(db: State<'_, Database>) -> Result<Vec<Item>, String> {
    println!("[get_all_items] Starting fetch");
    let result: AppResult<Vec<Item>> = (|| {
        let conn = map_lock_error(db.0.lock())?;
        let mut stmt = conn.prepare(
            "SELECT id, name, description, cost_gp, weight_kg, category, data, source FROM all_items ORDER BY name",
        )?;

        let iter = stmt.query_map([], |row: &rusqlite::Row| {
            let data_str: String = row.get(6)?;
            Ok(Item {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                cost_gp: row.get(3)?,
                weight_kg: row.get(4)?,
                category: row.get(5)?,
                data: from_str(&data_str).unwrap_or_default(),
                source: row.get(7)?,
            })
        })?;

        let mut results = Vec::new();
        for item in iter {
            results.push(item?);
        }
        Ok(results)
    })();

    match result {
        Ok(items) => {
            println!("[get_all_items] Fetched {} items", items.len());
            Ok(items)
        }
        Err(e) => {
            println!("[get_all_items] Error: {}", e);
            Err(e.to_string())
        }
    }
}

#[tauri::command]
pub async fn get_all_equipment(db: State<'_, Database>) -> Result<Vec<Equipment>, String> {
    println!("[get_all_equipment] Starting fetch");
    let result: AppResult<Vec<Equipment>> = (|| {
        let conn = map_lock_error(db.0.lock())?;
        
        // 1. Basis-Equipment aus View laden (ohne items/tools Spalten)
        let mut stmt = conn.prepare(
            "SELECT id, name, description, total_cost_gp, total_weight_kg, data, source 
             FROM all_equipment ORDER BY name",
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
            
            // 2. Items via JOIN aus normalisierten Tabellen laden
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
                Ok(json!({
                    "item_id": row.get::<_, String>(0)?,
                    "quantity": row.get::<_, i32>(1)?
                }))
            })?;
            
            let mut items_vec = Vec::new();
            for item in items_iter {
                items_vec.push(item?);
            }
            let items = Value::Array(items_vec);
            
            // 3. Tools via JOIN aus normalisierten Tabellen laden
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
                Ok(json!({
                    "tool_id": row.get::<_, String>(0)?,
                    "quantity": row.get::<_, i32>(1)?,
                    "source_table": row.get::<_, String>(2)?
                }))
            })?;
            
            let mut tools_vec = Vec::new();
            for tool in tools_iter {
                tools_vec.push(tool?);
            }
            let tools = Value::Array(tools_vec);
            
            equipment_list.push(Equipment {
                id,
                name,
                description,
                total_cost_gp,
                total_weight_kg,
                items,
                tools,
                data,
                source,
            });
        }
        
        Ok(equipment_list)
    })();

    match result {
        Ok(equipment) => {
            println!(
                "[get_all_equipment] Fetched {} equipment packages",
                equipment.len()
            );
            Ok(equipment)
        }
        Err(e) => {
            println!("[get_all_equipment] Error: {}", e);
            Err(e.to_string())
        }
    }
}

#[tauri::command]
pub async fn get_all_magic_items(db: State<'_, Database>) -> Result<Vec<MagicItem>, String> {
    println!("[get_all_magic_items] Starting fetch");
    let result: AppResult<Vec<MagicItem>> = (|| {
        let conn = map_lock_error(db.0.lock())?;
        let mut stmt = conn.prepare(
            "SELECT id, name, rarity, category, source_book, source_page, requires_attunement, facts_json, source 
             FROM all_mag_items_base 
             ORDER BY rarity, name",
        )?;

        let iter = stmt.query_map([], |row: &rusqlite::Row| {
            let facts_json: String = row.get(7)?;
            let facts_data: Value = from_str(&facts_json).unwrap_or_default();
            Ok(MagicItem {
                id: row.get(0)?,
                name: row.get(1)?,
                rarity: row.get(2)?,
                category: row.get(3)?,
                source_book: row.get(4)?,
                source_page: row.get(5)?,
                requires_attunement: row.get::<_, i32>(6)? != 0,
                facts_json,
                data: facts_data,
                source: row.get(8)?,
            })
        })?;

        let mut results = Vec::new();
        for item in iter {
            results.push(item?);
        }
        Ok(results)
    })();

    match result {
        Ok(items) => {
            println!("[get_all_magic_items] Fetched {} items", items.len());
            Ok(items)
        }
        Err(e) => {
            println!("[get_all_magic_items] Error: {}", e);
            Err(e.to_string())
        }
    }
}
