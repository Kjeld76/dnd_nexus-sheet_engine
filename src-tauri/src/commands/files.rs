use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;
use crate::error::{AppError, AppResult};
use crate::types::character::Character;
use std::fs;

/// Creates a backup of the database by copying it to a user-selected location.
///
/// # Arguments
/// * `app` - Tauri application handle
///
/// # Returns
/// Path to the backup file
///
/// # Errors
/// Returns `AppError::Other` if user cancels the dialog
/// Returns `AppError::Io` if file operation fails
#[tauri::command]
pub async fn backup_database(app: AppHandle) -> Result<String, String> {
    let result: AppResult<String> = (|| {
        let db_path = std::path::Path::new("dnd-nexus.db");
        
        let file_path = app.dialog()
            .file()
            .set_file_name("dnd-nexus-backup.db")
            .blocking_save_file();

        if let Some(path) = file_path {
            let path_buf = path.into_path().map_err(|e| AppError::Other(e.to_string()))?;
            let path_str = path_buf.to_string_lossy().to_string();
            fs::copy(db_path, &path_str)?;
            return Ok(path_str);
        }
        
        Err(AppError::Other("Backup abgebrochen".into()))
    })();
    
    result.map_err(|e| e.to_string())
}

/// Imports a character from a JSON file selected by the user.
///
/// # Arguments
/// * `app` - Tauri application handle
///
/// # Returns
/// The imported character
///
/// # Errors
/// Returns `AppError::Other` if user cancels the dialog
/// Returns `AppError::Io` if file read fails
/// Returns `AppError::Serialization` if JSON parsing fails
#[tauri::command]
pub async fn import_character(app: AppHandle) -> Result<Character, String> {
    let result: AppResult<Character> = (|| {
        let file_path = app.dialog()
            .file()
            .add_filter("JSON", &["json"])
            .blocking_pick_file();

        if let Some(path) = file_path {
            let path_buf = path.into_path().map_err(|e| AppError::Other(e.to_string()))?;
            let path_str = path_buf.to_string_lossy().to_string();
            let content = fs::read_to_string(&path_str)?;
            let character: Character = serde_json::from_str(&content)?;
            return Ok(character);
        }
        
        Err(AppError::Other("Import abgebrochen".into()))
    })();
    
    result.map_err(|e| e.to_string())
}

/// Exports a character to a JSON file selected by the user.
///
/// # Arguments
/// * `app` - Tauri application handle
/// * `character` - Character to export
///
/// # Returns
/// Path to the exported file
///
/// # Errors
/// Returns `AppError::Other` if user cancels the dialog
/// Returns `AppError::Io` if file write fails
/// Returns `AppError::Serialization` if JSON serialization fails
#[tauri::command]
pub async fn export_character(app: AppHandle, character: Character) -> Result<String, String> {
    let result: AppResult<String> = (|| {
        let file_path = app.dialog()
            .file()
            .set_file_name(format!("{}.json", character.meta.name))
            .blocking_save_file();

        if let Some(path) = file_path {
            let path_buf = path.into_path().map_err(|e| AppError::Other(e.to_string()))?;
            let path_str = path_buf.to_string_lossy().to_string();
            let content = serde_json::to_string_pretty(&character)?;
            fs::write(&path_str, content)?;
            return Ok(path_str);
        }
        
        Err(AppError::Other("Export abgebrochen".into()))
    })();
    
    result.map_err(|e| e.to_string())
}
