use rusqlite::Connection;
use std::sync::Mutex;
use tauri::AppHandle;
use tauri::Manager;

pub mod migrations;
pub mod queries;
pub mod seed;

pub struct Database(pub Mutex<Connection>);

pub fn init_database(app: &AppHandle) -> Result<Database, String> {
    let app_dir = app.path().app_data_dir().map_err(|e: tauri::Error| e.to_string())?;
    
    // Sicherstellen, dass das Verzeichnis existiert
    if !app_dir.exists() {
        std::fs::create_dir_all(&app_dir).map_err(|e: std::io::Error| e.to_string())?;
    }
    
    let db_path = app_dir.join("dnd-nexus.db");
    println!("App Database Path: {:?}", db_path);
    let conn = Connection::open(db_path).map_err(|e: rusqlite::Error| e.to_string())?;
    
    // Migrations ausführen
    migrations::run_migrations(&conn)?;

    // DEBUG: Force re-seed in dev mode if requested via env or just to be sure
    let mut conn = conn;
    let force_reseed = std::env::var("FORCE_RESEED").is_ok();
    
    let spell_count: i32 = conn.query_row("SELECT COUNT(*) FROM core_spells", [], |r| r.get(0)).unwrap_or(0);
    let class_count: i32 = conn.query_row("SELECT COUNT(*) FROM core_classes", [], |r| r.get(0)).unwrap_or(0);
    
    if spell_count == 0 || class_count == 0 || force_reseed {
        println!("Database empty, incomplete or forced. Starting auto-seed...");
        if let Err(e) = seed::seed_core_data(&mut conn) {
            println!("Auto-seed failed: {}", e);
        }
    }
    
    Ok(Database(Mutex::new(conn)))
}

