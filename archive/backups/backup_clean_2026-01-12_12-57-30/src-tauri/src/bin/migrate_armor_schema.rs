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

    // Prüfe ob Spalten existieren
    let mut stmt = conn.prepare("PRAGMA table_info(core_armors)").unwrap();
    let columns: Vec<String> = stmt.query_map([], |row| {
        Ok(row.get::<_, String>(1)?)
    }).unwrap().collect::<Result<Vec<_>, _>>().unwrap();

    if !columns.contains(&"ac_bonus".to_string()) {
        println!("Füge Spalte ac_bonus zu core_armors hinzu...");
        conn.execute("ALTER TABLE core_armors ADD COLUMN ac_bonus INTEGER DEFAULT 0", [])
            .expect("Fehler beim Hinzufügen von ac_bonus zu core_armors");
    }

    if !columns.contains(&"ac_formula".to_string()) {
        println!("Füge Spalte ac_formula zu core_armors hinzu...");
        conn.execute("ALTER TABLE core_armors ADD COLUMN ac_formula TEXT", [])
            .expect("Fehler beim Hinzufügen von ac_formula zu core_armors");
    }

    if !columns.contains(&"don_time_minutes".to_string()) {
        println!("Füge Spalte don_time_minutes zu core_armors hinzu...");
        conn.execute("ALTER TABLE core_armors ADD COLUMN don_time_minutes INTEGER", [])
            .expect("Fehler beim Hinzufügen von don_time_minutes zu core_armors");
    }

    if !columns.contains(&"doff_time_minutes".to_string()) {
        println!("Füge Spalte doff_time_minutes zu core_armors hinzu...");
        conn.execute("ALTER TABLE core_armors ADD COLUMN doff_time_minutes INTEGER", [])
            .expect("Fehler beim Hinzufügen von doff_time_minutes zu core_armors");
    }

    // base_ac NULL erlauben (für Formeln)
    // SQLite unterstützt kein ALTER COLUMN, daher müssen wir prüfen ob base_ac NOT NULL ist
    // In der Praxis wird base_ac bereits NULL sein können, wenn die Migration korrekt läuft

    // custom_armors
    let mut stmt2 = conn.prepare("PRAGMA table_info(custom_armors)").unwrap();
    let columns2: Vec<String> = stmt2.query_map([], |row| {
        Ok(row.get::<_, String>(1)?)
    }).unwrap().collect::<Result<Vec<_>, _>>().unwrap();

    if !columns2.contains(&"ac_bonus".to_string()) {
        println!("Füge Spalte ac_bonus zu custom_armors hinzu...");
        conn.execute("ALTER TABLE custom_armors ADD COLUMN ac_bonus INTEGER DEFAULT 0", [])
            .expect("Fehler beim Hinzufügen von ac_bonus zu custom_armors");
    }

    if !columns2.contains(&"ac_formula".to_string()) {
        println!("Füge Spalte ac_formula zu custom_armors hinzu...");
        conn.execute("ALTER TABLE custom_armors ADD COLUMN ac_formula TEXT", [])
            .expect("Fehler beim Hinzufügen von ac_formula zu custom_armors");
    }

    if !columns2.contains(&"don_time_minutes".to_string()) {
        println!("Füge Spalte don_time_minutes zu custom_armors hinzu...");
        conn.execute("ALTER TABLE custom_armors ADD COLUMN don_time_minutes INTEGER", [])
            .expect("Fehler beim Hinzufügen von don_time_minutes zu custom_armors");
    }

    if !columns2.contains(&"doff_time_minutes".to_string()) {
        println!("Füge Spalte doff_time_minutes zu custom_armors hinzu...");
        conn.execute("ALTER TABLE custom_armors ADD COLUMN doff_time_minutes INTEGER", [])
            .expect("Fehler beim Hinzufügen von doff_time_minutes zu custom_armors");
    }

    println!("✅ Migration abgeschlossen!");
}
