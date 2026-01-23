use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::db::Database;
use crate::error::map_lock_error;

#[derive(Debug, Serialize, Deserialize)]
pub struct ValidationError {
    pub category: String,
    pub message: String,
}

pub fn validate_schema_integrity(conn: &Connection) -> Vec<ValidationError> {
    let mut errors = Vec::new();
    
    // 1. Check orphaned weapon properties
    let orphaned_weapon_props: i32 = conn.query_row(
        "SELECT COUNT(*) FROM weapon_property_mappings wpm
         WHERE NOT EXISTS (SELECT 1 FROM all_weapons_unified WHERE id = wpm.weapon_id)",
        [],
        |row| row.get(0)
    ).unwrap_or(0);
    
    if orphaned_weapon_props > 0 {
        errors.push(ValidationError {
            category: "FK Integrity".to_string(),
            message: format!("{} orphaned weapon property mappings", orphaned_weapon_props)
        });
    }
    
    // 2. Check orphaned armor properties
    let orphaned_armor_props: i32 = conn.query_row(
        "SELECT COUNT(*) FROM armor_property_mappings apm
         WHERE NOT EXISTS (SELECT 1 FROM all_armors WHERE id = apm.armor_id)",
        [],
        |row| row.get(0)
    ).unwrap_or(0);
    
    if orphaned_armor_props > 0 {
        errors.push(ValidationError {
            category: "FK Integrity".to_string(),
            message: format!("{} orphaned armor property mappings", orphaned_armor_props)
        });
    }
    
    // 3. Check for invalid JSON in characters
    let mut stmt = conn.prepare("SELECT id FROM characters WHERE json_valid(data) = 0").unwrap();
    let invalid_chars = stmt.query_map([], |row| row.get::<_, String>(0)).unwrap();
    for id in invalid_chars {
        if let Ok(char_id) = id {
            errors.push(ValidationError {
                category: "Data Integrity".to_string(),
                message: format!("Character {} has invalid JSON data", char_id)
            });
        }
    }
    
    // 4. Check magic items data consistency
    let inconsistent_mag_items: i32 = conn.query_row(
        "SELECT COUNT(*) FROM core_mag_items_base WHERE facts_json != json(data) AND data IS NOT NULL",
        [],
        |row| row.get(0)
    ).unwrap_or(0);
    
    if inconsistent_mag_items > 0 {
        errors.push(ValidationError {
            category: "Magic Item Sync".to_string(),
            message: format!("{} core magic items have inconsistent facts_json and data", inconsistent_mag_items)
        });
    }

    // 5. Check character inventory synchronization
    let unsynced_inventories: i32 = conn.query_row(
        "SELECT COUNT(*) FROM characters c
         LEFT JOIN character_inventory_legacy_view l ON l.character_id = c.id
         WHERE json(json_extract(c.data, '$.inventory')) != json(COALESCE(l.inventory_json, '[]'))",
        [],
        |row| row.get(0)
    ).unwrap_or(0);

    if unsynced_inventories > 0 {
        errors.push(ValidationError {
            category: "Inventory Sync".to_string(),
            message: format!("{} characters have unsynced legacy/normalized inventory", unsynced_inventories)
        });
    }

    errors
}

#[tauri::command]
pub async fn run_schema_validation(state: State<'_, Database>) -> Result<Vec<ValidationError>, String> {
    let conn = map_lock_error(state.0.lock()).map_err(|e| e.to_string())?;
    Ok(validate_schema_integrity(&conn))
}
