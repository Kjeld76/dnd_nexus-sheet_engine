use tauri::State;
use crate::db::Database;
use crate::core::types::{Spell, Species, Class, Item, Feat};
use rusqlite::params;
use serde_json::from_str;

#[tauri::command]
pub async fn get_all_spells(db: State<'_, Database>) -> Result<Vec<Spell>, String> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn.prepare("SELECT id, name, level, school, data, source FROM all_spells ORDER BY name")
        .map_err(|e| e.to_string())?;
    
    let iter = stmt.query_map([], |row| {
        let data_str: String = row.get(4)?;
        Ok(Spell {
            id: row.get(0)?,
            name: row.get(1)?,
            level: row.get(2)?,
            school: row.get(3)?,
            data: from_str(&data_str).unwrap_or_default(),
            source: row.get(5)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut results = Vec::new();
    for item in iter {
        results.push(item.map_err(|e| e.to_string())?);
    }
    Ok(results)
}

#[tauri::command]
pub async fn get_all_species(db: State<'_, Database>) -> Result<Vec<Species>, String> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn.prepare("SELECT id, name, data, source FROM all_species ORDER BY name")
        .map_err(|e| e.to_string())?;
    
    let iter = stmt.query_map([], |row| {
        let data_str: String = row.get(2)?;
        Ok(Species {
            id: row.get(0)?,
            name: row.get(1)?,
            data: from_str(&data_str).unwrap_or_default(),
            source: row.get(3)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut results = Vec::new();
    for item in iter {
        results.push(item.map_err(|e| e.to_string())?);
    }
    Ok(results)
}

#[tauri::command]
pub async fn get_all_classes(db: State<'_, Database>) -> Result<Vec<Class>, String> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn.prepare("SELECT id, name, data, source FROM all_classes ORDER BY name")
        .map_err(|e| e.to_string())?;
    
    let iter = stmt.query_map([], |row| {
        let data_str: String = row.get(2)?;
        Ok(Class {
            id: row.get(0)?,
            name: row.get(1)?,
            data: from_str(&data_str).unwrap_or_default(),
            source: row.get(3)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut results = Vec::new();
    for item in iter {
        results.push(item.map_err(|e| e.to_string())?);
    }
    Ok(results)
}

#[tauri::command]
pub async fn get_all_items(db: State<'_, Database>) -> Result<Vec<Item>, String> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn.prepare("SELECT id, name, category, data, source FROM all_items ORDER BY category, name")
        .map_err(|e| e.to_string())?;
    
    let iter = stmt.query_map([], |row| {
        let data_str: String = row.get(3)?;
        Ok(Item {
            id: row.get(0)?,
            name: row.get(1)?,
            category: row.get(2)?,
            data: from_str(&data_str).unwrap_or_default(),
            source: row.get(4)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut results = Vec::new();
    for item in iter {
        results.push(item.map_err(|e| e.to_string())?);
    }
    Ok(results)
}

#[tauri::command]
pub async fn get_all_feats(db: State<'_, Database>) -> Result<Vec<Feat>, String> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn.prepare("SELECT id, name, data, source FROM all_feats ORDER BY name")
        .map_err(|e| e.to_string())?;
    
    let iter = stmt.query_map([], |row| {
        let data_str: String = row.get(2)?;
        Ok(Feat {
            id: row.get(0)?,
            name: row.get(1)?,
            data: from_str(&data_str).unwrap_or_default(),
            source: row.get(3)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut results = Vec::new();
    for item in iter {
        results.push(item.map_err(|e| e.to_string())?);
    }
    Ok(results)
}


