use tauri::State;
use crate::db::Database;
use crate::types::character::Character;
use crate::error::{AppError, AppResult, map_lock_error};
use uuid::Uuid;
use crate::db::queries;
use rusqlite::params;

/// Creates a new character in the database.
///
/// # Arguments
/// * `db` - Database connection state
/// * `character` - Character to create (ID will be generated if nil)
///
/// # Returns
/// The created character with its ID
///
/// # Errors
/// Returns `AppError` if database operation fails or serialization fails
#[tauri::command]
pub async fn create_character(
    db: State<'_, Database>,
    mut character: Character,
) -> Result<Character, String> {
    let result: AppResult<Character> = (|| {
        let conn = map_lock_error(db.0.lock())?;
        
        if character.id == Uuid::nil() {
            character.id = Uuid::new_v4();
        }
        
        let data = serde_json::to_string(&character)?;
        
        conn.execute(
            queries::INSERT_CHARACTER,
            params![character.id.to_string(), data],
        )?;
        
        Ok(character)
    })();
    
    result.map_err(|e| e.to_string())
}

/// Retrieves a character from the database by ID.
///
/// # Arguments
/// * `db` - Database connection state
/// * `id` - Character UUID as string
///
/// # Returns
/// The character if found
///
/// # Errors
/// Returns `AppError::CharacterNotFound` if character doesn't exist
#[tauri::command]
pub async fn get_character(
    db: State<'_, Database>,
    id: String,
) -> Result<Character, String> {
    let result: AppResult<Character> = (|| {
        let conn = map_lock_error(db.0.lock())?;
        
        let mut stmt = conn.prepare("SELECT data FROM characters WHERE id = ?")?;
        
        let data: String = stmt.query_row(params![id.clone()], |row: &rusqlite::Row| row.get(0))
            .map_err(|_| AppError::CharacterNotFound(id.clone()))?;
        
        let character: Character = serde_json::from_str(&data)?;
        Ok(character)
    })();
    
    result.map_err(|e| e.to_string())
}

/// Updates an existing character in the database.
///
/// # Arguments
/// * `db` - Database connection state
/// * `id` - Character UUID as string
/// * `character` - Updated character data
///
/// # Errors
/// Returns `AppError` if character not found or database operation fails
#[tauri::command]
pub async fn update_character(
    db: State<'_, Database>,
    id: String,
    character: Character,
) -> Result<(), String> {
    let result: AppResult<()> = (|| {
        let conn = map_lock_error(db.0.lock())?;
        let data = serde_json::to_string(&character)?;
        
        let rows_affected = conn.execute(
            queries::UPDATE_CHARACTER,
            params![data, id.clone()],
        )?;
        
        if rows_affected == 0 {
            return Err(AppError::CharacterNotFound(id));
        }
        
        Ok(())
    })();
    
    result.map_err(|e| e.to_string())
}

/// Deletes a character from the database.
///
/// # Arguments
/// * `db` - Database connection state
/// * `id` - Character UUID as string
///
/// # Errors
/// Returns `AppError` if database operation fails
#[tauri::command]
pub async fn delete_character(
    db: State<'_, Database>,
    id: String,
) -> Result<(), String> {
    let result: AppResult<()> = (|| {
        let conn = map_lock_error(db.0.lock())?;
        conn.execute(queries::DELETE_CHARACTER, params![id])?;
        Ok(())
    })();
    
    result.map_err(|e| e.to_string())
}

/// Lists all characters in the database.
///
/// # Arguments
/// * `db` - Database connection state
///
/// # Returns
/// Vector of all characters
///
/// # Errors
/// Returns `AppError` if database operation fails
#[tauri::command]
pub async fn list_characters(
    db: State<'_, Database>,
) -> Result<Vec<Character>, String> {
    let result: AppResult<Vec<Character>> = (|| {
        let conn = map_lock_error(db.0.lock())?;
        
        let mut stmt = conn.prepare(queries::SELECT_ALL_CHARACTERS)?;
        
        let character_iter = stmt.query_map([], |row: &rusqlite::Row| {
            let data: String = row.get(1)?;
            Ok(data)
        })?;
        
        let mut characters = Vec::new();
        for data_result in character_iter {
            let data = data_result?;
            let character: Character = serde_json::from_str(&data)?;
            characters.push(character);
        }
        
        Ok(characters)
    })();
    
    result.map_err(|e| e.to_string())
}


