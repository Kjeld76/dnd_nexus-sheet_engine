#![allow(dead_code)]

use std::fs::OpenOptions;
use std::io::Write;
use tauri::{AppHandle, Manager};

#[tauri::command]
pub fn write_log(app: AppHandle, log_entry: String) -> Result<(), String> {
    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data dir: {}", e))?;
    
    let log_file_path = app_data_dir.join("dnd-nexus.log");
    
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_file_path)
        .map_err(|e| format!("Failed to open log file: {}", e))?;
    
    writeln!(file, "{}", log_entry)
        .map_err(|e| format!("Failed to write to log file: {}", e))?;
    
    Ok(())
}

#[tauri::command]
pub fn export_logs(app: AppHandle, logs: String) -> Result<String, String> {
    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data dir: {}", e))?;
    
    let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
    let export_file_path = app_data_dir.join(format!("dnd-nexus-logs_{}.json", timestamp));
    
    std::fs::write(&export_file_path, logs)
        .map_err(|e| format!("Failed to write export file: {}", e))?;
    
    Ok(export_file_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn read_logs(app: AppHandle) -> Result<String, String> {
    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    
    let log_file_path = app_data_dir.join("dnd-nexus.log");
    
    if !log_file_path.exists() {
        return Ok(String::new());
    }
    
    std::fs::read_to_string(&log_file_path)
        .map_err(|e| format!("Failed to read log file: {}", e))
}
