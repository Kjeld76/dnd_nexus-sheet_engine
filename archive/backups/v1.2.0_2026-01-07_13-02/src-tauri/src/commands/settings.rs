use tauri::State;
use crate::db::Database;
use rusqlite::params;

#[tauri::command]
pub async fn get_setting(db: State<'_, Database>, key: String) -> Result<String, String> {
    let conn = db.0.lock().unwrap();
    
    let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = ?")
        .map_err(|e: rusqlite::Error| e.to_string())?;
    
    let value: Result<String, _> = stmt.query_row(params![key], |row: &rusqlite::Row| row.get(0));
    
    match value {
        Ok(v) => Ok(v),
        Err(_) => Ok("".into()), // Default empty
    }
}

#[tauri::command]
pub async fn set_setting(db: State<'_, Database>, key: String, value: String) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
        params![key, value],
    ).map_err(|e: rusqlite::Error| e.to_string())?;
    
    Ok(())
}











