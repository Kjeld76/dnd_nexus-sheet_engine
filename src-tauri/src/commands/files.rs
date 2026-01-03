use tauri::{AppHandle, Manager};
use tauri_plugin_dialog::DialogExt;
use crate::core::types::Character;
use std::fs;
use std::path::PathBuf;

#[tauri::command]
pub async fn backup_database(app: AppHandle) -> Result<String, String> {
    let db_path = app.path().app_data_dir().unwrap().join("dnd-nexus.db");
    
    let file_path = app.dialog()
        .file()
        .set_file_name("dnd-nexus-backup.db")
        .blocking_save_file();

    if let Some(path) = file_path {
        let path_str = path.to_string();
        fs::copy(&db_path, &path_str).map_err(|e| e.to_string())?;
        return Ok(path_str);
    }
    
    Err("Backup abgebrochen".into())
}

#[tauri::command]
pub async fn import_character(app: AppHandle) -> Result<Character, String> {
    let file_path = app.dialog()
        .file()
        .add_filter("JSON", &["json"])
        .blocking_pick_file();

    if let Some(path) = file_path {
        let path_str = path.to_string();
        let content = fs::read_to_string(&path_str).map_err(|e| e.to_string())?;
        let character: Character = serde_json::from_str(&content).map_err(|e| e.to_string())?;
        return Ok(character);
    }
    
    Err("Import abgebrochen".into())
}

#[tauri::command]
pub async fn export_character(app: AppHandle, character: Character) -> Result<String, String> {
    let file_path = app.dialog()
        .file()
        .set_file_name(&format!("{}.json", character.meta.name))
        .blocking_save_file();

    if let Some(path) = file_path {
        let path_str = path.to_string();
        let content = serde_json::to_string_pretty(&character).map_err(|e| e.to_string())?;
        fs::write(&path_str, content).map_err(|e| e.to_string())?;
        return Ok(path_str);
    }
    
    Err("Export abgebrochen".into())
}
