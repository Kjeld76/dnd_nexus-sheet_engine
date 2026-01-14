use rusqlite::Connection;
use std::path::Path;

fn main() {
    let possible_paths = [
        "dnd-nexus.db",
        "../dnd-nexus.db",
        "../../dnd-nexus.db",
    ];

    let mut db_path = None;
    for path in possible_paths {
        if Path::new(path).exists() {
            db_path = Some(path.to_string());
            break;
        }
    }

    let db_path = match db_path {
        Some(p) => p,
        None => {
            eprintln!("FEHLER: Datenbank existiert nicht!");
            return;
        }
    };

    println!("Nutze Datenbank: {}", db_path);
    let conn = Connection::open(db_path).expect("Konnte Datenbank nicht öffnen");

    // Prüfe ob Spalte existiert
    let mut stmt = conn.prepare("PRAGMA table_info(core_weapons)").unwrap();
    let columns: Vec<String> = stmt.query_map([], |row| {
        row.get::<_, String>(1)
    }).unwrap().collect::<Result<Vec<_>, _>>().unwrap();

    if !columns.contains(&"mastery_id".to_string()) {
        println!("Füge Spalte mastery_id zu core_weapons hinzu...");
        conn.execute("ALTER TABLE core_weapons ADD COLUMN mastery_id TEXT", [])
            .expect("Fehler beim Hinzufügen von mastery_id zu core_weapons");
    }

    if !columns.contains(&"mastery_id".to_string()) {
        let mut stmt2 = conn.prepare("PRAGMA table_info(custom_weapons)").unwrap();
        let columns2: Vec<String> = stmt2.query_map([], |row| {
            row.get::<_, String>(1)
        }).unwrap().collect::<Result<Vec<_>, _>>().unwrap();
        
        if !columns2.contains(&"mastery_id".to_string()) {
            println!("Füge Spalte mastery_id zu custom_weapons hinzu...");
            conn.execute("ALTER TABLE custom_weapons ADD COLUMN mastery_id TEXT", [])
                .expect("Fehler beim Hinzufügen von mastery_id zu custom_weapons");
        }
    }

    println!("✅ Migration abgeschlossen!");
}
