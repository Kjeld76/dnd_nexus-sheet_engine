use tauri::State;
use crate::db::Database;
use crate::error::{AppResult, map_lock_error};
use rusqlite::params;

/// Retrieves a setting value from the database.
///
/// # Arguments
/// * `db` - Database connection state
/// * `key` - Setting key
///
/// # Returns
/// The setting value, or empty string if not found
///
/// # Errors
/// Returns `AppError` if database operation fails
#[tauri::command]
pub async fn get_setting(db: State<'_, Database>, key: String) -> Result<String, String> {
    let result: AppResult<String> = (|| {
        let conn = map_lock_error(db.0.lock())?;
        
        let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = ?")?;
        
        let value: Result<String, _> = stmt.query_row(params![key], |row: &rusqlite::Row| row.get(0));
        
        match value {
            Ok(v) => Ok(v),
            Err(_) => Ok("".into()), // Default empty
        }
    })();
    
    result.map_err(|e| e.to_string())
}

/// Sets a setting value in the database.
///
/// # Arguments
/// * `db` - Database connection state
/// * `key` - Setting key
/// * `value` - Setting value
///
/// # Errors
/// Returns `AppError` if database operation fails
#[tauri::command]
pub async fn set_setting(db: State<'_, Database>, key: String, value: String) -> Result<(), String> {
    let result: AppResult<()> = (|| {
        let conn = map_lock_error(db.0.lock())?;
        
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
            params![key, value],
        )?;
        
        Ok(())
    })();
    
    result.map_err(|e| e.to_string())
}











