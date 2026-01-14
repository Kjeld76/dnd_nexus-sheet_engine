use tauri::State;
use crate::db::Database;
use crate::error::{AppResult, map_lock_error};
use crate::types::spell::Spell;
use crate::types::compendium::{Species, Class, Gear, Tool, Feat, Armor, ArmorProperty, Skill, Background, Item, Equipment};
use crate::types::weapons::{Weapon, WeaponProperty, WeaponMastery};
use serde_json::from_str;
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
                w.id, w.name, w.category, w.mastery_id, w.damage_dice, w.damage_type, 
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
                row.get::<_, Option<String>>(3)?, // mastery_id
                row.get::<_, String>(4)?,         // damage_dice
                row.get::<_, String>(5)?,         // damage_type
                row.get::<_, f64>(6)?,            // weight_kg
                row.get::<_, f64>(7)?,            // cost_gp
                row.get::<_, String>(8)?,         // data
                row.get::<_, String>(9)?,         // source
                row.get::<_, Option<String>>(10)?, // prop_id
                row.get::<_, Option<String>>(11)?, // prop_name
                row.get::<_, Option<String>>(12)?, // prop_desc
                row.get::<_, Option<i32>>(13)?,    // prop_has_param
                row.get::<_, Option<String>>(14)?, // prop_param_type
                row.get::<_, Option<String>>(15)?, // prop_param_value
                row.get::<_, Option<String>>(16)?, // mastery_id_full
                row.get::<_, Option<String>>(17)?, // mastery_name
                row.get::<_, Option<String>>(18)?, // mastery_desc
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
                let data = from_str(&data_str).unwrap_or_default();

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
                if !weapon.properties.iter().any(|p| p.id == prop_id) {
                    weapon.properties.push(WeaponProperty {
                        id: prop_id,
                        name: prop_name,
                        description: prop_desc,
                        has_parameter: has_param,
                        parameter_type: prop_param_type,
                        parameter_value: param_value,
                    });
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
            "SELECT id, name, category, base_ac, ac_bonus, ac_formula, strength_requirement, stealth_disadvantage, don_time_minutes, doff_time_minutes, weight_kg, cost_gp, data, source 
             FROM all_armors 
             ORDER BY name",
        )?;

        let armors_iter = stmt.query_map([], |row: &rusqlite::Row| {
            let data_str: String = row.get(12)?;
            Ok((
                row.get::<_, String>(0)?,         // id
                row.get::<_, String>(1)?,         // name
                row.get::<_, String>(2)?,         // category
                row.get::<_, Option<i32>>(3)?,    // base_ac
                row.get::<_, i32>(4)?,            // ac_bonus
                row.get::<_, Option<String>>(5)?, // ac_formula
                row.get::<_, Option<i32>>(6)?,    // strength_requirement
                row.get::<_, i32>(7)? != 0,       // stealth_disadvantage
                row.get::<_, Option<i32>>(8)?,    // don_time_minutes
                row.get::<_, Option<i32>>(9)?,    // doff_time_minutes
                row.get::<_, f64>(10)?,           // weight_kg
                row.get::<_, f64>(11)?,           // cost_gp
                from_str(&data_str).unwrap_or_default(), // data
                row.get::<_, String>(13)?,        // source
            ))
        })?;

        let mut armors = Vec::new();
        for armor_row in armors_iter {
            let (
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
        let mut stmt = conn.prepare(
            "SELECT id, name, description, total_cost_gp, total_weight_kg, items, tools, data, source FROM all_equipment ORDER BY name",
        )?;

        let iter = stmt.query_map([], |row: &rusqlite::Row| {
            let total_cost_gp: Option<f64> = row.get(3)?;
            let total_weight_kg: Option<f64> = row.get(4)?;
            let items_str: Option<String> = row.get(5)?;
            let tools_str: Option<String> = row.get(6)?;
            let data_str: Option<String> = row.get(7)?;
            Ok(Equipment {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                total_cost_gp,
                total_weight_kg,
                items: from_str(items_str.as_deref().unwrap_or("[]")).unwrap_or_default(),
                tools: from_str(tools_str.as_deref().unwrap_or("[]")).unwrap_or_default(),
                data: from_str(data_str.as_deref().unwrap_or("{}")).unwrap_or_default(),
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
