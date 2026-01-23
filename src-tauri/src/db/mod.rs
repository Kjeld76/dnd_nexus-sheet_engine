use rusqlite::Connection;
use std::sync::Mutex;
use tauri::AppHandle;

pub mod migrations;
pub mod queries;
pub mod seed;
pub mod validation;
pub mod inventory;
pub mod spells;
pub mod stats;
pub mod features;
pub mod modifiers;

pub struct Database(pub Mutex<Connection>);

pub fn init_database(_app: &AppHandle) -> Result<Database, String> {
    // NUR Root-Datenbank verwenden - KEINE Runtime-Datenbank mehr
    // Prüfe verschiedene mögliche Pfade zur Root-Datenbank
    let mut project_db_paths: Vec<std::path::PathBuf> = Vec::new();
    
    // Pfad 1: Relativ zum Executable (src-tauri/target/... -> ../dnd-nexus.db)
    if let Ok(exe) = std::env::current_exe() {
        if let Some(exe_dir) = exe.parent() {
            // Versuche Parent-Verzeichnisse (bis zum Projekt-Root)
            let mut current = exe_dir.to_path_buf();
            for _ in 0..5 {
                let db_path = current.join("dnd-nexus.db");
                if db_path.exists() {
                    project_db_paths.push(db_path);
                }
                if let Some(parent) = current.parent() {
                    current = parent.to_path_buf();
                } else {
                    break;
                }
            }
        }
    }
    
    // Pfad 2: Aktuelles Arbeitsverzeichnis
    if let Ok(cwd) = std::env::current_dir() {
        let db_path = cwd.join("dnd-nexus.db");
        if db_path.exists() {
            project_db_paths.push(db_path);
        }
        // Auch Parent-Verzeichnisse prüfen
        if let Some(parent) = cwd.parent() {
            let db_path = parent.join("dnd-nexus.db");
            if db_path.exists() {
                project_db_paths.push(db_path);
            }
        }
    }
    
    // Pfad 3: Hardcoded Projekt-Pfad (für Development)
    #[cfg(debug_assertions)]
    {
        let hardcoded_path = std::path::PathBuf::from("/daten/projects/dnd_nexus-sheet_engine/dnd-nexus.db");
        if hardcoded_path.exists() {
            project_db_paths.push(hardcoded_path);
        }
    }
    
    // Finde die erste existierende Root-Datenbank
    let db_path = project_db_paths.iter()
        .find(|p| p.exists())
        .ok_or_else(|| {
            let searched_paths: Vec<String> = project_db_paths.iter()
                .map(|p| p.to_string_lossy().to_string())
                .collect();
            format!(
                "Root-Datenbank (dnd-nexus.db) nicht gefunden!\n\
                Gesucht in:\n  {}\n\n\
                Bitte stelle sicher, dass die Datenbank im Projekt-Root existiert.",
                searched_paths.join("\n  ")
            )
        })?;
    
    println!("Verwende Root-Datenbank: {:?}", db_path);
    
    let db_path_str = db_path.to_string_lossy().to_string();
    println!("=== DATENBANK-PFAD: {} ===", db_path_str);
    
    // Verbindung herstellen
    let conn = Connection::open(&db_path).map_err(|e| format!("Konnte Datenbank nicht öffnen ({}): {}", db_path_str, e))?;
    
    // Migrations ausführen (stellt Tabellenstruktur sicher)
    migrations::run_migrations(&conn).map_err(|e| format!("Datenbank-Migration fehlgeschlagen: {}", e))?;
    
    // Prüfe Datenbank-Inhalt für Debugging
    let weapons_count: i32 = conn.prepare("SELECT COUNT(*) FROM all_weapons_unified")
        .and_then(|mut stmt| stmt.query_row([], |row| row.get(0)))
        .unwrap_or(0);
    let armor_count: i32 = conn.prepare("SELECT COUNT(*) FROM all_armors")
        .and_then(|mut stmt| stmt.query_row([], |row| row.get(0)))
        .unwrap_or(0);
    let magic_count: i32 = conn.prepare("SELECT COUNT(*) FROM all_mag_items_base")
        .and_then(|mut stmt| stmt.query_row([], |row| row.get(0)))
        .unwrap_or(0);
    let chars_count: i32 = conn.prepare("SELECT COUNT(*) FROM characters")
        .and_then(|mut stmt| stmt.query_row([], |row| row.get(0)))
        .unwrap_or(0);
    println!("=== DATENBANK-INHALT: Waffen={}, Rüstungen={}, Magische Gegenstände={}, Charaktere={} ===", 
             weapons_count, armor_count, magic_count, chars_count);
    
    Ok(Database(Mutex::new(conn)))
}

