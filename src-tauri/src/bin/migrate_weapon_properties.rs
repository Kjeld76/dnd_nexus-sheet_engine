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
    let mut stmt = conn.prepare("PRAGMA table_info(weapon_properties)").unwrap();
    let columns: Vec<String> = stmt.query_map([], |row| {
        row.get::<_, String>(1)
    }).unwrap().collect::<Result<Vec<_>, _>>().unwrap();

    if !columns.contains(&"has_parameter".to_string()) {
        println!("Füge Spalte has_parameter hinzu...");
        conn.execute("ALTER TABLE weapon_properties ADD COLUMN has_parameter BOOLEAN DEFAULT 0", [])
            .expect("Fehler beim Hinzufügen von has_parameter");
    }

    if !columns.contains(&"parameter_type".to_string()) {
        println!("Füge Spalte parameter_type hinzu...");
        conn.execute("ALTER TABLE weapon_properties ADD COLUMN parameter_type TEXT CHECK(parameter_type IN ('range', 'damage', 'ammo', 'range+ammo', 'bonus', 'special'))", [])
            .expect("Fehler beim Hinzufügen von parameter_type");
    }

    if !columns.contains(&"parameter_required".to_string()) {
        println!("Füge Spalte parameter_required hinzu...");
        conn.execute("ALTER TABLE weapon_properties ADD COLUMN parameter_required BOOLEAN DEFAULT 0", [])
            .expect("Fehler beim Hinzufügen von parameter_required");
    }

    println!("✅ Migration abgeschlossen!");
}
