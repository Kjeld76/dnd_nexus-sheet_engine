use tauri::State;
use crate::db::Database;
use crate::core::types::{Spell, Species, Class, Gear, Tool, Feat, Weapon, Armor, Skill};
use serde_json::from_str;

#[tauri::command]
pub async fn get_all_spells(db: State<'_, Database>) -> Result<Vec<Spell>, String> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn.prepare("SELECT id, name, level, school, casting_time, range, components, material_components, duration, concentration, ritual, description, higher_levels, classes, data, source FROM all_spells ORDER BY name")
        .map_err(|e: rusqlite::Error| e.to_string())?;
    
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
            concentration: row.get(9)?,
            ritual: row.get(10)?,
            description: row.get(11)?,
            higher_levels: row.get(12)?,
            classes: row.get(13)?,
            data: from_str(&data_str).unwrap_or_default(),
            source: row.get(15)?,
        })
    }).map_err(|e: rusqlite::Error| e.to_string())?;

    let mut results = Vec::new();
    for item in iter {
        results.push(item.map_err(|e: rusqlite::Error| e.to_string())?);
    }
    Ok(results)
}

#[tauri::command]
pub async fn get_all_species(db: State<'_, Database>) -> Result<Vec<Species>, String> {
    let conn = db.0.lock().unwrap();
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
    for item in iter {
        results.push(item.map_err(|e: rusqlite::Error| e.to_string())?);
    }
    Ok(results)
}

#[tauri::command]
pub async fn get_all_classes(db: State<'_, Database>) -> Result<Vec<Class>, String> {
    let conn = db.0.lock().unwrap();
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
    for item in iter {
        results.push(item.map_err(|e: rusqlite::Error| e.to_string())?);
    }
    Ok(results)
}

#[tauri::command]
pub async fn get_all_gear(db: State<'_, Database>) -> Result<Vec<Gear>, String> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn.prepare("SELECT id, name, description, cost_gp, weight_kg, data, source FROM all_gear ORDER BY name")
        .map_err(|e: rusqlite::Error| e.to_string())?;
    
    let iter = stmt.query_map([], |row: &rusqlite::Row| {
        let data_str: Option<String> = row.get(5)?;
        Ok(Gear {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            cost_gp: row.get(3)?,
            weight_kg: row.get(4)?,
            data: from_str(&data_str.unwrap_or_else(|| "{}".to_string())).unwrap_or_default(),
            source: row.get(6)?,
        })
    }).map_err(|e: rusqlite::Error| e.to_string())?;

    let mut results = Vec::new();
    for item in iter {
        results.push(item.map_err(|e: rusqlite::Error| e.to_string())?);
    }
    Ok(results)
}

#[tauri::command]
pub async fn get_all_tools(db: State<'_, Database>) -> Result<Vec<Tool>, String> {
    let conn = db.0.lock().unwrap();
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
    for item in iter {
        results.push(item.map_err(|e: rusqlite::Error| e.to_string())?);
    }
    Ok(results)
}

#[tauri::command]
pub async fn get_all_weapons(db: State<'_, Database>) -> Result<Vec<Weapon>, String> {
    let conn = db.0.lock().unwrap();
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
    for item in iter {
        results.push(item.map_err(|e: rusqlite::Error| e.to_string())?);
    }
    Ok(results)
}

#[tauri::command]
pub async fn get_all_armor(db: State<'_, Database>) -> Result<Vec<Armor>, String> {
    let conn = db.0.lock().unwrap();
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
            stealth_disadvantage: row.get(5)?,
            weight_kg: row.get(6)?,
            cost_gp: row.get(7)?,
            data: from_str(&data_str).unwrap_or_default(),
            source: row.get(9)?,
        })
    }).map_err(|e: rusqlite::Error| e.to_string())?;

    let mut results = Vec::new();
    for item in iter {
        results.push(item.map_err(|e: rusqlite::Error| e.to_string())?);
    }
    Ok(results)
}

#[tauri::command]
pub async fn get_all_feats(db: State<'_, Database>) -> Result<Vec<Feat>, String> {
    let conn = db.0.lock().unwrap();
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
    let conn = db.0.lock().unwrap();
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
