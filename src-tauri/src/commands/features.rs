use serde::{Deserialize, Serialize};
use tauri::State;
use crate::db::Database;
use crate::error::{AppError, AppResult, map_lock_error};
use rusqlite::{params, Row};

#[derive(Debug, Serialize, Deserialize)]
pub struct FeatureData {
    pub id: String,
    pub class_id: String,
    pub class_source: Option<String>,
    pub subclass_id: Option<String>,
    pub subclass_source: Option<String>,
    pub parent_id: Option<String>,
    pub name: String,
    pub description: String,
    pub level: i64,
    pub feature_type: String,
    pub effects: serde_json::Value,
    pub conditions: Option<serde_json::Value>,
    pub uses_per_rest: Option<String>,
    pub rest_type: Option<String>,
    pub source: String,
    pub created_at: i64,
    pub updated_at: Option<i64>,
}

fn row_to_feature(row: &Row) -> rusqlite::Result<FeatureData> {
    Ok(FeatureData {
        id: row.get(0)?,
        class_id: row.get(1)?,
        class_source: row.get(2)?,
        subclass_id: row.get(3)?,
        subclass_source: row.get(4)?,
        parent_id: row.get(5)?,
        name: row.get(6)?,
        description: row.get(7)?,
        level: row.get(8)?,
        feature_type: row.get(9)?,
        effects: serde_json::from_str(&row.get::<_, String>(10)?).unwrap_or_default(),
        conditions: row.get::<_, Option<String>>(11)?
            .map(|s| serde_json::from_str(&s).ok())
            .flatten(),
        uses_per_rest: row.get(12)?,
        rest_type: row.get(13)?,
        source: row.get(14)?,
        created_at: row.get(15)?,
        updated_at: row.get(16)?,
    })
}

#[tauri::command]
pub async fn get_class_features(
    state: State<'_, Database>,
    class_id: String,
    level: Option<i64>,
    subclass_id: Option<String>,
) -> Result<Vec<FeatureData>, String> {
    let result: AppResult<Vec<FeatureData>> = (|| {
        let conn = map_lock_error(state.0.lock())?;
        
        // Konvertiere subclass_id (kann Name oder ID sein) zur ID
        let resolved_subclass_id = if let Some(ref sub_id) = subclass_id {
            // Versuche zuerst als ID zu finden
            let id_found: bool = conn.query_row(
                "SELECT EXISTS(SELECT 1 FROM all_subclasses WHERE id = ? AND class_id = ?)",
                params![sub_id, &class_id],
                |row| row.get(0),
            ).unwrap_or(false);
            
            if id_found {
                Some(sub_id.clone())
            } else {
                // Versuche als Name zu finden
                let name_found: Option<String> = conn.query_row(
                    "SELECT id FROM all_subclasses WHERE name = ? AND class_id = ?",
                    params![sub_id, &class_id],
                    |row| row.get(0),
                ).ok();
                name_found
            }
        } else {
            None
        };
        
        let query = if level.is_some() {
            "SELECT * FROM all_class_features 
             WHERE class_id = ? AND level <= ?
             AND (subclass_id IS NULL OR subclass_id = ?)
             ORDER BY level ASC,
             CASE source 
               WHEN 'override' THEN 1
               WHEN 'custom' THEN 2
               WHEN 'core' THEN 3
             END"
        } else {
            "SELECT * FROM all_class_features 
             WHERE class_id = ?
             AND (subclass_id IS NULL OR subclass_id = ?)
             ORDER BY level ASC,
             CASE source 
               WHEN 'override' THEN 1
               WHEN 'custom' THEN 2
               WHEN 'core' THEN 3
             END"
        };
        
        let mut stmt = conn.prepare(query)?;
        
        let rows = if let Some(lvl) = level {
            stmt.query_map(
                params![&class_id, &lvl, &resolved_subclass_id],
                row_to_feature
            )
        } else {
            stmt.query_map(
                params![&class_id, &resolved_subclass_id],
                row_to_feature
            )
        }?;
        
        let mut result = Vec::new();
        for row in rows {
            result.push(row?);
        }
        
        Ok(result)
    })();
    
    result.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_custom_class_feature(
    state: State<'_, Database>,
    class_id: String,
    class_source: String,
    feature_data: serde_json::Value,
) -> Result<String, String> {
    let result: AppResult<String> = (|| {
        let conn = map_lock_error(state.0.lock())?;
        
        if class_source != "core" && class_source != "custom" {
            return Err(AppError::InvalidInput(
                "class_source must be 'core' or 'custom'".to_string()
            ));
        }
        
        // Validiere Klasse existiert
        let table = if class_source == "core" {
            "core_classes"
        } else {
            "custom_classes"
        };
        
        let class_exists: bool = conn.query_row(
            &format!("SELECT EXISTS(SELECT 1 FROM {} WHERE id = ?)", table),
            [&class_id],
            |row| row.get(0),
        )?;
        
        if !class_exists {
            return Err(AppError::InvalidInput(format!(
                "Class {} not found in {}",
                class_id, table
            )));
        }
        
        let feature_id = feature_data
            .get("id")
            .and_then(|v| v.as_str())
            .ok_or_else(|| AppError::InvalidInput("Missing id".to_string()))?
            .to_string();
        
        let effects_json = serde_json::to_string(
            feature_data.get("effects")
                .ok_or_else(|| AppError::InvalidInput("Missing effects".to_string()))?
        )?;
        
        let conditions_json = feature_data
            .get("conditions")
            .and_then(|c| serde_json::to_string(c).ok());
        
        conn.execute(
            "INSERT INTO custom_class_features (
                id, class_id, class_source, subclass_id, subclass_source, parent_id,
                name, description, level, feature_type, effects, conditions,
                uses_per_rest, rest_type
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
            params![
                &feature_id,
                &class_id,
                &class_source,
                feature_data.get("subclass_id").and_then(|v| v.as_str()),
                feature_data.get("subclass_source").and_then(|v| v.as_str()),
                feature_data.get("parent_id").and_then(|v| v.as_str()),
                feature_data.get("name").and_then(|v| v.as_str())
                    .ok_or_else(|| AppError::InvalidInput("Missing name".to_string()))?,
                feature_data.get("description").and_then(|v| v.as_str())
                    .ok_or_else(|| AppError::InvalidInput("Missing description".to_string()))?,
                feature_data.get("level").and_then(|v| v.as_i64())
                    .ok_or_else(|| AppError::InvalidInput("Missing level".to_string()))?,
                feature_data.get("feature_type").and_then(|v| v.as_str())
                    .ok_or_else(|| AppError::InvalidInput("Missing feature_type".to_string()))?,
                &effects_json,
                conditions_json.as_deref(),
                feature_data.get("uses_per_rest").and_then(|v| v.as_str()),
                feature_data.get("rest_type").and_then(|v| v.as_str()),
            ],
        )?;
        
        Ok(feature_id)
    })();
    
    result.map_err(|e| e.to_string())
}
