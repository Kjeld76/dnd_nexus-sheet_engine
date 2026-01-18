use rusqlite::Connection;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};
use std::fs;

pub mod migrations;
pub mod queries;
pub mod seed;

pub struct Database(pub Mutex<Connection>);

pub fn init_database(app: &AppHandle) -> Result<Database, String> {
    // 1. Versuche zuerst die Projekt-Datenbank zu finden
    // Prüfe verschiedene mögliche Pfade
    let mut project_db_paths: Vec<std::path::PathBuf> = Vec::new();
    
    // Pfad 1: Aktuelles Arbeitsverzeichnis
    if let Ok(cwd) = std::env::current_dir() {
        project_db_paths.push(cwd.join("dnd-nexus.db"));
        // Auch Parent-Verzeichnisse prüfen
        if let Some(parent) = cwd.parent() {
            project_db_paths.push(parent.join("dnd-nexus.db"));
        }
    }
    
    // Pfad 2: Relativ zum Executable
    if let Ok(exe) = std::env::current_exe() {
        if let Some(exe_dir) = exe.parent() {
            project_db_paths.push(exe_dir.join("dnd-nexus.db"));
            if let Some(parent) = exe_dir.parent() {
                project_db_paths.push(parent.join("dnd-nexus.db"));
                if let Some(grandparent) = parent.parent() {
                    project_db_paths.push(grandparent.join("dnd-nexus.db"));
                }
            }
        }
    }
    
    // Pfad 3: Hardcoded Projekt-Pfad (für Development)
    #[cfg(debug_assertions)]
    {
        project_db_paths.push(std::path::PathBuf::from("/daten/projects/dnd_nexus-sheet_engine/dnd-nexus.db"));
    }
    
    let mut db_path = None;
    for path in project_db_paths.iter() {
        if path.exists() {
            println!("Verwende Projekt-Datenbank: {:?}", path);
            db_path = Some(path.clone());
            break;
        }
    }
    
    // 2. Falls keine Projekt-Datenbank gefunden, verwende Runtime-Datenbank
    let db_path = if let Some(path) = db_path {
        path
    } else {
        println!("Keine Projekt-Datenbank gefunden. Verwende Runtime-Datenbank...");
        let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
        
        // Verzeichnis erstellen, falls es nicht existiert
        if !app_dir.exists() {
            fs::create_dir_all(&app_dir).map_err(|e| format!("Konnte Datenverzeichnis nicht erstellen: {}", e))?;
        }
        
        let runtime_db_path = app_dir.join("dnd-nexus.db");
        
        // Datenbank aus Ressourcen kopieren, falls sie nicht existiert
        if !runtime_db_path.exists() {
            println!("Datenbank nicht gefunden. Kopiere Vorlage aus Ressourcen...");
            let resource_path = app
                .path()
                .resource_dir()
                .map_err(|e| e.to_string())?
                .join("dnd-nexus.db");
            
            if resource_path.exists() {
                fs::copy(&resource_path, &runtime_db_path).map_err(|e| format!("Konnte Datenbank-Vorlage nicht kopieren: {}", e))?;
                println!("Datenbank erfolgreich nach {:?} kopiert.", runtime_db_path);
            } else {
                println!("WARNUNG: Keine Datenbank-Vorlage in Ressourcen gefunden. Erstelle leere Datenbank.");
            }
        }
        
        runtime_db_path
    };
    
    let db_path_str = db_path.to_string_lossy().to_string();
    println!("=== DATENBANK-PFAD: {} ===", db_path_str);
    
    // 3. Verbindung herstellen
    let mut conn = Connection::open(&db_path).map_err(|e| format!("Konnte Datenbank nicht öffnen ({}): {}", db_path_str, e))?;
    
    // 3. Migrations ausführen (stellt Tabellenstruktur sicher)
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
    
    // 4. Wenn die Datenbank ganz neu ist, müssen wir die PHB-Daten importieren
    // Wir prüfen einfach, ob die core_spells Tabelle Daten enthält
    let count: i32 = {
        let mut stmt = conn
            .prepare("SELECT COUNT(*) FROM core_spells")
            .map_err(|e| e.to_string())?;
        stmt.query_row([], |row| row.get(0)).unwrap_or(0)
    };
    
    // Wenn die Runtime-Datenbank leer ist (und wir nicht die Projekt-Datenbank direkt verwenden),
    // versuche Daten zu importieren
    // Prüfe ob wir die Projekt-Datenbank direkt verwenden
    let is_project_db = db_path_str.contains("dnd-nexus.db") && std::path::Path::new(&db_path_str).exists();
    
    if count == 0 && !is_project_db {
        println!("Initialisiere leere Datenbank mit PHB-Daten...");
        // Versuche, die Projekt-Datenbank zu finden und zu importieren
        let project_db_paths = [
            std::env::current_dir()
                .ok()
                .and_then(|p| Some(p.join("dnd-nexus.db"))),
            std::env::current_exe()
                .ok()
                .and_then(|p| p.parent().map(|p| p.join("dnd-nexus.db"))),
            std::env::current_exe()
                .ok()
                .and_then(|p| p.parent().and_then(|p| p.parent()).map(|p| p.join("dnd-nexus.db"))),
        ];
        
        let mut project_db_found = false;
        for path_opt in project_db_paths.iter() {
            if let Some(path) = path_opt {
                if path.exists() {
                    println!("Gefundene Projekt-Datenbank zum Importieren: {:?}", path);
                    // Importiere Daten aus der Projekt-Datenbank
                    if let Err(e) = seed::seed_core_data(&mut conn) {
                        eprintln!("WARNUNG: Fehler beim Importieren der Daten: {}", e);
                    } else {
                        project_db_found = true;
                        println!("Daten erfolgreich importiert!");
                    }
                    break;
                }
            }
        }
        
        if !project_db_found {
            println!("WARNUNG: Keine Projekt-Datenbank gefunden. Die App wird mit leerer Datenbank gestartet.");
        }
    }
    
    Ok(Database(Mutex::new(conn)))
}

