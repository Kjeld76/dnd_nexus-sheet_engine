use tauri::State;
use crate::db::Database;
use crate::core::types::Character;
use uuid::Uuid;
use crate::db::queries;

#[tauri::command]
pub async fn create_character(
    db: State<'_, Database>,
    mut character: Character,
) -> Result<Character, String> {
    let conn = db.0.lock().unwrap();
    
    if character.id == Uuid::nil() {
        character.id = Uuid::new_v4();
    }
    
    let data = serde_json::to_string(&character).map_err(|e: serde_json::Error| e.to_string())?;
    
    conn.execute(
        queries::INSERT_CHARACTER,
        params![character.id.to_string(), data],
    ).map_err(|e: rusqlite::Error| e.to_string())?;
    
    Ok(character)
}

#[tauri::command]
pub async fn get_character(
    db: State<'_, Database>,
    id: String,
) -> Result<Character, String> {
    let conn = db.0.lock().unwrap();
    
    let mut stmt = conn.prepare("SELECT data FROM characters WHERE id = ?")
        .map_err(|e: rusqlite::Error| e.to_string())?;
    
    let data: String = stmt.query_row(params![id], |row: &rusqlite::Row| row.get(0))
        .map_err(|e: rusqlite::Error| e.to_string())?;
    
    let character: Character = serde_json::from_str(&data).map_err(|e: serde_json::Error| e.to_string())?;
    Ok(character)
}

#[tauri::command]
pub async fn update_character(
    db: State<'_, Database>,
    id: String,
    character: Character,
) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    let data = serde_json::to_string(&character).map_err(|e: serde_json::Error| e.to_string())?;
    
    conn.execute(
        queries::UPDATE_CHARACTER,
        params![data, id],
    ).map_err(|e: rusqlite::Error| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn delete_character(
    db: State<'_, Database>,
    id: String,
) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    
    conn.execute(
        queries::DELETE_CHARACTER,
        params![id],
    ).map_err(|e: rusqlite::Error| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn list_characters(
    db: State<'_, Database>,
) -> Result<Vec<Character>, String> {
    let conn = db.0.lock().unwrap();
    
    let mut stmt = conn.prepare(queries::SELECT_ALL_CHARACTERS)
        .map_err(|e: rusqlite::Error| e.to_string())?;
    
    let character_iter = stmt.query_map([], |row: &rusqlite::Row| {
        let data: String = row.get(1)?;
        Ok(data)
    }).map_err(|e: rusqlite::Error| e.to_string())?;
    
    let mut characters = Vec::new();
    for data_result in character_iter {
        let data = data_result.map_err(|e: rusqlite::Error| e.to_string())?;
        let character: Character = serde_json::from_str(&data).map_err(|e: serde_json::Error| e.to_string())?;
        characters.push(character);
    }
    
    Ok(characters)
}

// Helper for params! macro
use rusqlite::params;

