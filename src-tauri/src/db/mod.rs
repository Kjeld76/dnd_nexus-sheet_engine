use rusqlite::Connection;
use std::sync::Mutex;
use tauri::AppHandle;

pub mod migrations;
pub mod queries;
pub mod seed;

pub struct Database(pub Mutex<Connection>);

pub fn init_database(_app: &AppHandle) -> Result<Database, String> {
    // Verwende die Projekt-DB direkt (dnd-nexus.db im Projektverzeichnis)
    // Alle Daten (Regelwerks-Daten UND Charaktere) werden in EINER DB gespeichert
    
    // Bestimme das Projekt-Root-Verzeichnis
    // In Tauri: Das Projekt-Root ist das Verzeichnis, das die tauri.conf.json enthält
    // Versuche mehrere Pfade relativ zum aktuellen Working Directory
    let current_dir = std::env::current_dir().unwrap_or_default();
    println!("Current working directory: {:?}", current_dir);
    
    let db_paths = [
        current_dir.join("dnd-nexus.db"),
        current_dir.join("..").join("dnd-nexus.db"),
        current_dir.join("../..").join("dnd-nexus.db"),
        std::path::Path::new("dnd-nexus.db").to_path_buf(),
        std::path::Path::new("../dnd-nexus.db").to_path_buf(),
        std::path::Path::new("../../dnd-nexus.db").to_path_buf(),
    ];
    
    let db_path = db_paths.iter()
        .find(|p| p.exists())
        .ok_or_else(|| {
            format!("dnd-nexus.db not found. Current dir: {:?}. Tried paths: {:?}", current_dir, db_paths.iter().map(|p| p.to_string_lossy().to_string()).collect::<Vec<_>>())
        })?;
    
    let db_path_str = db_path.to_string_lossy().to_string();
    let abs_path = db_path.canonicalize().unwrap_or(db_path.clone());
    println!("Using project database: {} (absolute: {:?}, exists: {})", db_path_str, abs_path, db_path.exists());
    
    let conn = Connection::open(db_path).map_err(|e: rusqlite::Error| format!("Failed to open database at {}: {}", db_path_str, e))?;
    
    // Migrations ausführen (stellt sicher, dass alle Tabellen existieren)
    println!("Running migrations...");
    migrations::run_migrations(&conn).map_err(|e| {
        eprintln!("Migration error: {}", e);
        format!("Migration failed: {}", e)
    })?;
    println!("Migrations completed successfully");
    
    // Kein Seeding mehr nötig - die Projekt-DB enthält bereits alle Regelwerks-Daten
    // und wird direkt für Charaktere verwendet
    
    Ok(Database(Mutex::new(conn)))
}

