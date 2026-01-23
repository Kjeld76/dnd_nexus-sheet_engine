use serde::{Deserialize, Serialize};
use tauri::State;
use crate::db::Database;
use crate::error::{AppResult, map_lock_error};
use rusqlite::params;

#[derive(Debug, Serialize, Deserialize)]
pub struct SubclassData {
    pub id: String,
    pub name: String,
    pub class_id: String,
}

#[tauri::command]
pub async fn get_subclasses(
    state: State<'_, Database>,
    class_id: String,
) -> Result<Vec<SubclassData>, String> {
    let result: AppResult<Vec<SubclassData>> = (|| {
        let conn = map_lock_error(state.0.lock())?;
        
        let mut stmt = conn.prepare(
            "SELECT id, name, class_id FROM all_subclasses WHERE class_id = ? ORDER BY name"
        )?;
        
        let rows = stmt.query_map(
            params![&class_id],
            |row| {
                Ok(SubclassData {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    class_id: row.get(2)?,
                })
            }
        )?;
        
        let mut result = Vec::new();
        for row in rows {
            result.push(row?);
        }
        
        Ok(result)
    })();
    
    result.map_err(|e| e.to_string())
}
