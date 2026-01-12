use tauri::State;
use crate::db::Database;
use crate::types::spell::Spell;
use crate::types::compendium::{Species, Class, Gear, Tool, Feat, Armor, Skill, Background, Item, Equipment};
use crate::types::weapons::Weapon;
use serde_json::from_str;

#[tauri::command]
pub async fn get_all_spells(db: State<'_, Database>) -> Result<Vec<Spell>, String> {
    println!("[get_all_spells] Command called");
    let conn = db.0.lock().map_err(|e| {
        println!("[get_all_spells] Lock error: {}", e);
        format!("Lock error: {}", e)
    })?;
    println!("[get_all_spells] Database locked, preparing query");
    let mut stmt = conn.prepare("SELECT id, name, level, school, casting_time, range, components, material_components, duration, concentration, ritual, description, higher_levels, classes, data, source FROM all_spells ORDER BY level, name")
        .map_err(|e: rusqlite::Error| {
            println!("[get_all_spells] Prepare error: {}", e);
            e.to_string()
        })?;
    println!("[get_all_spells] Query prepared, executing");

    let iter = stmt.query_map([], |row: &rusqlite::Row| {
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
    }).map_err(|e: rusqlite::Error| e.to_string())?;

    let mut results = Vec::new();
    for spell in iter {
        results.push(spell.map_err(|e: rusqlite::Error| e.to_string())?);
    }
    println!("[get_all_spells] Returning {} spells", results.len());
    Ok(results)
}

#[tauri::command]
pub async fn get_all_species(db: State<'_, Database>) -> Result<Vec<Species>, String> {
    let conn = db.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    let mut stmt = conn.prepare("SELECT id, name, data, source FROM all_species ORDER BY name")
        .map_err(|e: rusqlite::Error| e.to_string())?;

    let iter = stmt.query_map([], |row: &rusqlite::Row| {
        let data_str: String = row.get(2)?;
        Ok(Species {
            id: row.get(0)?,
            name: row.get(1)?,
            data: from_str(&data_str).unwrap_or_default(),
            source: row.get(3)?,
        })
    }).map_err(|e: rusqlite::Error| e.to_string())?;

    let mut results = Vec::new();
    for species in iter {
        results.push(species.map_err(|e: rusqlite::Error| e.to_string())?);
    }
    Ok(results)
}

#[tauri::command]
pub async fn get_all_classes(db: State<'_, Database>) -> Result<Vec<Class>, String> {
    let conn = db.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    let mut stmt = conn.prepare("SELECT id, name, data, source FROM all_classes ORDER BY name")
        .map_err(|e: rusqlite::Error| e.to_string())?;

    let iter = stmt.query_map([], |row: &rusqlite::Row| {
        let data_str: String = row.get(2)?;
        Ok(Class {
            id: row.get(0)?,
            name: row.get(1)?,
            data: from_str(&data_str).unwrap_or_default(),
            source: row.get(3)?,
        })
    }).map_err(|e: rusqlite::Error| e.to_string())?;

    let mut results = Vec::new();
    for class in iter {
        results.push(class.map_err(|e: rusqlite::Error| e.to_string())?);
    }
    Ok(results)
}

#[tauri::command]
pub async fn get_all_gear(db: State<'_, Database>) -> Result<Vec<Gear>, String> {
    let conn = db.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    let mut stmt = conn.prepare("SELECT id, name, description, cost_gp, weight_kg, data, source FROM all_gear ORDER BY name")
        .map_err(|e: rusqlite::Error| e.to_string())?;

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
    }).map_err(|e: rusqlite::Error| e.to_string())?;

    let mut results = Vec::new();
    for gear in iter {
        results.push(gear.map_err(|e: rusqlite::Error| e.to_string())?);
    }
    Ok(results)
}

#[tauri::command]
pub async fn get_all_tools(db: State<'_, Database>) -> Result<Vec<Tool>, String> {
    let conn = db.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    let mut stmt = conn.prepare("SELECT id, name, category, cost_gp, weight_kg, data, source FROM all_tools ORDER BY name")
        .map_err(|e: rusqlite::Error| e.to_string())?;

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
    }).map_err(|e: rusqlite::Error| e.to_string())?;

    let mut results = Vec::new();
    for tool in iter {
        results.push(tool.map_err(|e: rusqlite::Error| e.to_string())?);
    }
    Ok(results)
}

#[tauri::command]
pub async fn get_all_weapons(db: State<'_, Database>) -> Result<Vec<Weapon>, String> {
    let conn = db.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    let mut stmt = conn.prepare("SELECT id, name, category, weapon_type, damage_dice, damage_type, weight_kg, cost_gp, data, source FROM all_weapons ORDER BY name")
        .map_err(|e: rusqlite::Error| e.to_string())?;

    let iter = stmt.query_map([], |row: &rusqlite::Row| {
        let data_str: String = row.get(8)?;
        Ok(Weapon {
            id: row.get(0)?,
            name: row.get(1)?,
            category: row.get(2)?,
            weapon_type: row.get(3)?,
            damage_dice: row.get(4)?,
            damage_type: row.get(5)?,
            weight_kg: row.get(6)?,
            cost_gp: row.get(7)?,
            data: from_str(&data_str).unwrap_or_default(),
            source: row.get(9)?,
        })
    }).map_err(|e: rusqlite::Error| e.to_string())?;

    let mut results = Vec::new();
    for weapon in iter {
        results.push(weapon.map_err(|e: rusqlite::Error| e.to_string())?);
    }
    Ok(results)
}

#[tauri::command]
pub async fn get_all_armor(db: State<'_, Database>) -> Result<Vec<Armor>, String> {
    let conn = db.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    let mut stmt = conn.prepare("SELECT id, name, category, base_ac, strength_requirement, stealth_disadvantage, weight_kg, cost_gp, data, source FROM all_armors ORDER BY name")
        .map_err(|e: rusqlite::Error| e.to_string())?;

    let iter = stmt.query_map([], |row: &rusqlite::Row| {
        let data_str: String = row.get(8)?;
        Ok(Armor {
            id: row.get(0)?,
            name: row.get(1)?,
            category: row.get(2)?,
            base_ac: row.get(3)?,
            strength_requirement: row.get(4)?,
            stealth_disadvantage: row.get::<_, i32>(5)? != 0,
            weight_kg: row.get(6)?,
            cost_gp: row.get(7)?,
            data: from_str(&data_str).unwrap_or_default(),
            source: row.get(9)?,
        })
    }).map_err(|e: rusqlite::Error| e.to_string())?;

    let mut results = Vec::new();
    for armor in iter {
        results.push(armor.map_err(|e: rusqlite::Error| e.to_string())?);
    }
    Ok(results)
}

#[tauri::command]
pub async fn get_all_feats(db: State<'_, Database>) -> Result<Vec<Feat>, String> {
    let conn = db.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    let mut stmt = conn.prepare("SELECT id, name, category, data, source FROM all_feats ORDER BY name")
        .map_err(|e: rusqlite::Error| e.to_string())?;
    
    let iter = stmt.query_map([], |row: &rusqlite::Row| {
        let data_str: String = row.get(3)?;
        Ok(Feat {
            id: row.get(0)?,
            name: row.get(1)?,
            category: row.get(2)?,
            data: from_str(&data_str).unwrap_or_default(),
            source: row.get(4)?,
        })
    }).map_err(|e: rusqlite::Error| e.to_string())?;

    let mut results = Vec::new();
    for item in iter {
        results.push(item.map_err(|e: rusqlite::Error| e.to_string())?);
    }
    Ok(results)
}

#[tauri::command]
pub async fn get_all_skills(db: State<'_, Database>) -> Result<Vec<Skill>, String> {
    let conn = db.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    let mut stmt = conn.prepare("SELECT id, name, ability, description, source FROM all_skills ORDER BY name")
        .map_err(|e: rusqlite::Error| e.to_string())?;
    
    let iter = stmt.query_map([], |row: &rusqlite::Row| {
        Ok(Skill {
            id: row.get(0)?,
            name: row.get(1)?,
            ability: row.get(2)?,
            description: row.get(3)?,
            source: row.get(4)?,
        })
    }).map_err(|e: rusqlite::Error| e.to_string())?;

    let mut results = Vec::new();
    for item in iter {
        results.push(item.map_err(|e: rusqlite::Error| e.to_string())?);
    }
    Ok(results)
}

#[tauri::command]
pub async fn get_all_backgrounds(db: State<'_, Database>) -> Result<Vec<Background>, String> {
    let conn = db.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    let mut stmt = conn.prepare("SELECT id, name, data, source FROM all_backgrounds ORDER BY name")
        .map_err(|e: rusqlite::Error| e.to_string())?;
    
    let iter = stmt.query_map([], |row: &rusqlite::Row| {
        let data_str: String = row.get(2)?;
        Ok(Background {
            id: row.get(0)?,
            name: row.get(1)?,
            data: from_str(&data_str).unwrap_or_default(),
            source: row.get(3)?,
        })
    }).map_err(|e: rusqlite::Error| e.to_string())?;

    let mut results = Vec::new();
    for item in iter {
        results.push(item.map_err(|e: rusqlite::Error| e.to_string())?);
    }
    Ok(results)
}

#[tauri::command]
pub async fn get_all_items(db: State<'_, Database>) -> Result<Vec<Item>, String> {
    println!("[get_all_items] Starting fetch");
    let conn = db.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    let mut stmt = conn.prepare("SELECT id, name, description, cost_gp, weight_kg, category, data, source FROM all_items ORDER BY name")
        .map_err(|e: rusqlite::Error| {
            let err = format!("SQL prepare error: {}", e);
            println!("[get_all_items] Error: {}", err);
            err
        })?;

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
    }).map_err(|e: rusqlite::Error| {
        let err = format!("SQL query error: {}", e);
        println!("[get_all_items] Error: {}", err);
        err
    })?;

    let mut results = Vec::new();
    for item in iter {
        results.push(item.map_err(|e: rusqlite::Error| e.to_string())?);
    }
    println!("[get_all_items] Fetched {} items", results.len());
    Ok(results)
}

#[tauri::command]
pub async fn get_all_equipment(db: State<'_, Database>) -> Result<Vec<Equipment>, String> {
    println!("[get_all_equipment] Starting fetch");
    let conn = db.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    let mut stmt = conn.prepare("SELECT id, name, description, total_cost_gp, total_weight_kg, items, tools, data, source FROM all_equipment ORDER BY name")
        .map_err(|e: rusqlite::Error| {
            let err = format!("SQL prepare error: {}", e);
            println!("[get_all_equipment] Error: {}", err);
            err
        })?;

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
            items: from_str(&items_str.unwrap_or_else(|| "[]".to_string())).unwrap_or_default(),
            tools: from_str(&tools_str.unwrap_or_else(|| "[]".to_string())).unwrap_or_default(),
            data: from_str(&data_str.unwrap_or_else(|| "{}".to_string())).unwrap_or_default(),
            source: row.get(8)?,
        })
    }).map_err(|e: rusqlite::Error| {
        let err = format!("SQL query error: {}", e);
        println!("[get_all_equipment] Error: {}", err);
        err
    })?;

    let mut results = Vec::new();
    for item in iter {
        results.push(item.map_err(|e: rusqlite::Error| e.to_string())?);
    }
    println!("[get_all_equipment] Fetched {} equipment packages", results.len());
    Ok(results)
}
