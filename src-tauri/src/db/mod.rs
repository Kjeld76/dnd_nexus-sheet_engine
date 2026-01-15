use rusqlite::Connection;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};
use std::fs;

pub mod migrations;
pub mod queries;
pub mod seed;

pub struct Database(pub Mutex<Connection>);

pub fn init_database(app: &AppHandle) -> Result<Database, String> {
    // 1. Pfad für App-Daten bestimmen (z.B. %APPDATA%/dnd-nexus unter Windows)
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    
    // Verzeichnis erstellen, falls es nicht existiert
    if !app_dir.exists() {
        fs::create_dir_all(&app_dir).map_err(|e| format!("Konnte Datenverzeichnis nicht erstellen: {}", e))?;
    }
    
    let db_path = app_dir.join("dnd-nexus.db");
    
    // 2. Datenbank aus Ressourcen kopieren, falls sie nicht existiert
    if !db_path.exists() {
        println!("Datenbank nicht gefunden. Kopiere Vorlage aus Ressourcen...");
        let resource_path = app.path().resolve_resource("dnd-nexus.db").map_err(|e| e.to_string())?;
        
        if resource_path.exists() {
            fs::copy(&resource_path, &db_path).map_err(|e| format!("Konnte Datenbank-Vorlage nicht kopieren: {}", e))?;
            println!("Datenbank erfolgreich nach {:?} kopiert.", db_path);
        } else {
            println!("WARNUNG: Keine Datenbank-Vorlage in Ressourcen gefunden. Erstelle leere Datenbank.");
        }
    }
    
    let db_path_str = db_path.to_string_lossy().to_string();
    
    // 3. Verbindung herstellen
    let conn = Connection::open(&db_path).map_err(|e| format!("Konnte Datenbank nicht öffnen ({}): {}", db_path_str, e))?;
    
    // 3. Migrations ausführen (stellt Tabellenstruktur sicher)
    migrations::run_migrations(&conn).map_err(|e| format!("Datenbank-Migration fehlgeschlagen: {}", e))?;
    
    // 4. Wenn die Datenbank ganz neu ist, müssen wir die PHB-Daten importieren
    // Wir prüfen einfach, ob die core_spells Tabelle Daten enthält
    let mut stmt = conn.prepare("SELECT COUNT(*) FROM core_spells").map_err(|e| e.to_string())?;
    let count: i32 = stmt.query_row([], |row| row.get(0)).unwrap_or(0);
    
    if count == 0 {
        println!("Initialisiere leere Datenbank mit PHB-Daten...");
        // Hier rufen wir den Seeder auf, falls nötig
        // Da wir aber dnd-nexus.db als fertige Datei im Projekt haben,
        // wäre es am besten, diese beim Build mit einzubinden (Resources).
    }
    
    Ok(Database(Mutex::new(conn)))
}

