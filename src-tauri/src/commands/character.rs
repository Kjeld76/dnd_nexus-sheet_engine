use tauri::State;
use crate::db::Database;
use crate::types::character::{Character, CharacterInventoryEntry};
use crate::db::inventory::StartingEquipmentOption;
use serde_json::Value;
use crate::error::{AppError, AppResult, map_lock_error};
use uuid::Uuid;
use crate::db::queries;
use rusqlite::params;

#[tauri::command]
pub async fn get_class_starting_equipment_options(
    db: State<'_, Database>,
    class_id: String,
) -> Result<Vec<StartingEquipmentOption>, String> {
    let result: AppResult<Vec<StartingEquipmentOption>> = (|| {
        let conn = map_lock_error(db.0.lock())?;
        crate::db::inventory::get_class_starting_equipment_options(&conn, &class_id)
    })();
    result.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_starting_equipment(
    db: State<'_, Database>,
    character_id: String,
    class_id: String,
    option_label: String,
) -> Result<(), String> {
    let result: AppResult<()> = (|| {
        let conn = map_lock_error(db.0.lock())?;
        crate::db::inventory::get_starting_equipment(&conn, &character_id, &class_id, &option_label)
    })();
    result.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn clear_starting_equipment(
    db: State<'_, Database>,
    character_id: String,
    source: String,
) -> Result<(), String> {
    let result: AppResult<()> = (|| {
        let conn = map_lock_error(db.0.lock())?;
        crate::db::inventory::clear_starting_equipment(&conn, &character_id, &source)
    })();
    result.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn apply_background_starting_equipment(
    db: State<'_, Database>,
    character_id: String,
    items: Vec<crate::db::inventory::BackgroundItemInput>,
    gold: i32,
) -> Result<(), String> {
    let result: AppResult<()> = (|| {
        let conn = map_lock_error(db.0.lock())?;
        crate::db::inventory::apply_background_starting_equipment(&conn, &character_id, items, gold)
    })();
    result.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_character_inventory(
    db: State<'_, Database>,
    character_id: String,
) -> Result<Vec<CharacterInventoryEntry>, String> {
    let result: AppResult<Vec<CharacterInventoryEntry>> = (|| {
        let conn = map_lock_error(db.0.lock())?;
        
        let mut stmt = conn.prepare(
            "SELECT id, character_id, item_id, item_type, quantity, is_equipped, is_attuned,
                    container_id, custom_name, custom_description, data, created_at, updated_at,
                    location, source, is_starting_equipment
             FROM character_inventory 
             WHERE character_id = ?"
        )?;
        
        let iter = stmt.query_map(params![character_id], |row| {
             let data: Option<String> = row.get(10)?;
             let data_value: Option<Value> = data.and_then(|s| serde_json::from_str(&s).ok());
             Ok(CharacterInventoryEntry {
                 id: row.get(0)?,
                 character_id: row.get(1)?,
                 item_id: row.get(2)?,
                 item_type: row.get(3)?,
                 quantity: row.get(4)?,
                 is_equipped: row.get::<_, i32>(5)? != 0,
                 is_attuned: row.get::<_, i32>(6)? != 0,
                 container_id: row.get(7)?,
                 custom_name: row.get(8)?,
                 custom_description: row.get(9)?,
                 data: data_value,
                 created_at: row.get(11)?,
                 updated_at: row.get(12)?,
                 location: row.get(13)?,
                 source: row.get(14)?,
                 is_starting_equipment: row.get::<_, i32>(15)? != 0,
             })
        })?;
        
        let mut items = Vec::new();
        for item in iter {
            items.push(item?);
        }
        Ok(items)
    })();
    
    result.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_inventory_item(
    db: State<'_, Database>,
    item: CharacterInventoryEntry,
) -> Result<(), String> {
    let result: AppResult<()> = (|| {
        let conn = map_lock_error(db.0.lock())?;
        
        conn.execute(
            "UPDATE character_inventory SET 
                quantity = ?, is_equipped = ?, container_id = ?, 
                custom_name = ?, custom_description = ?, data = ?, 
                location = ?, source = ?, is_starting_equipment = ?,
                updated_at = (unixepoch())
             WHERE id = ?",
            params![
                item.quantity,
                if item.is_equipped { 1 } else { 0 },
                item.container_id,
                item.custom_name,
                item.custom_description,
                serde_json::to_string(&item.data).unwrap_or_else(|_| "{}".to_string()),
                item.location,
                item.source,
                if item.is_starting_equipment { 1 } else { 0 },
                item.id
            ],
        )?;
        
        Ok(())
    })();
    
    result.map_err(|e| e.to_string())
}

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

        // Sync normalized inventory
        crate::db::inventory::sync_inventory(&conn, &character)?;
        // Sync normalized spells
        crate::db::spells::sync_spells(&conn, &character)?;
        // Sync normalized stats (attributes & health)
        crate::db::stats::sync_stats(&conn, &character)?;
        // Sync normalized features & proficiencies
        crate::db::features::sync_features(&conn, &character)?;
        // Sync normalized modifiers
        crate::db::modifiers::sync_modifiers(&conn, &character)?;
        
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
        
        let mut character: Character = serde_json::from_str(&data)?;
        
        // SYNC INVENTORY FROM SQL (SOURCE OF TRUTH)
        // This overrides the stale/empty inventory list from the JSON blob
        // and ensures we have item_type and other fields correctly populated.
        let sql_inventory = crate::db::inventory::get_all_inventory_entries(&conn, &id)?;
        
        character.inventory = sql_inventory.into_iter().map(|entry| crate::types::character::CharacterItem {
             id: entry.id,
             item_id: entry.item_id,
             item_type: Some(entry.item_type), // New field
             quantity: entry.quantity,
             is_equipped: entry.is_equipped,
             is_attuned: entry.is_attuned,
             location: entry.location,
             source: entry.source,
             is_starting_equipment: entry.is_starting_equipment,
             custom_data: entry.data,
        }).collect();

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

        // Sync normalized inventory
        crate::db::inventory::sync_inventory(&conn, &character)?;
        // Sync normalized spells
        crate::db::spells::sync_spells(&conn, &character)?;
        // Sync normalized stats (attributes & health)
        crate::db::stats::sync_stats(&conn, &character)?;
        // Sync normalized features & proficiencies
        crate::db::features::sync_features(&conn, &character)?;
        // Sync normalized modifiers
        crate::db::modifiers::sync_modifiers(&conn, &character)?;
        
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


#[tauri::command]
pub async fn get_character_spells(
    db: State<'_, Database>,
    character_id: String,
) -> Result<Vec<crate::types::character::CharacterSpell>, String> {
    let result: AppResult<Vec<crate::types::character::CharacterSpell>> = (|| {
        let conn = map_lock_error(db.0.lock())?;
        
        let mut stmt = conn.prepare(
            "SELECT id, spell_id, is_prepared, is_always_prepared, source 
             FROM character_spells 
             WHERE character_id = ?"
        )?;
        
        let iter = stmt.query_map(params![character_id], |row| {
             Ok(crate::types::character::CharacterSpell {
                 id: row.get(0)?,
                 spell_id: row.get(1)?,
                 is_prepared: row.get::<_, i32>(2)? != 0,
                 is_always_prepared: row.get::<_, i32>(3)? != 0,
                 source: row.get(4)?,
             })
        })?;
        
        let mut spells = Vec::new();
        for spell in iter {
            spells.push(spell?);
        }
        Ok(spells)
    })();
    
    result.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_spell_preparation(
    db: State<'_, Database>,
    id: String,
    is_prepared: bool,
) -> Result<(), String> {
    let result: AppResult<()> = (|| {
        let conn = map_lock_error(db.0.lock())?;
        
        conn.execute(
            "UPDATE character_spells SET is_prepared = ?, updated_at = (unixepoch()) WHERE id = ?",
            params![if is_prepared { 1 } else { 0 }, id],
        )?;
        
        Ok(())
    })();
    
    result.map_err(|e| e.to_string())
}
