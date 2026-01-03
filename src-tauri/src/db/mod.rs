use rusqlite::Connection;
use std::sync::Mutex;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Manager;

pub mod migrations;
pub mod queries;
pub mod seed;

pub struct Database(pub Mutex<Connection>);

pub fn init_database(app: &AppHandle) -> Result<Database, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    
    // Sicherstellen, dass das Verzeichnis existiert
    if !app_dir.exists() {
        std::fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;
    }
    
    let db_path = app_dir.join("dnd-nexus.db");
    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;
    
    // Migrations ausführen
    migrations::run_migrations(&conn)?;

    // Core-Daten automatisch seeden, falls leer
    let mut conn = conn;
    let count: i32 = conn.query_row("SELECT COUNT(*) FROM core_spells", [], |r| r.get(0)).unwrap_or(0);
    if count == 0 {
        seed::seed_core_data(&mut conn).ok(); // Fehler ignorieren, falls Quelldatei fehlt
    }
    
    Ok(Database(Mutex::new(conn)))
}

