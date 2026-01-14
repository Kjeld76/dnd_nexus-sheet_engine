use rusqlite::{params, Connection};
use std::path::Path;

fn main() {
    println!("--- Rüstungen-Eigenschaften Import ---");

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

    match import_armor_properties(&conn) {
        Ok(_) => println!("✅ Eigenschaften importiert"),
        Err(e) => eprintln!("❌ Fehler beim Import der Eigenschaften: {}", e),
    }

    println!("\n✅ Import abgeschlossen!");
}

fn import_armor_properties(conn: &Connection) -> Result<(), rusqlite::Error> {
    println!("\n📦 Importiere Rüstungen-Eigenschaften...");

    let properties = vec![
        ("schwer", "Schwer", "Erfordert Stärke-Wert (STÄ 13 oder STÄ 15)", Some("strength_requirement")),
        ("stealth_nachteil", "Stealth Nachteil", "Nachteil bei Heimlichkeitswürfen", Some("stealth_disadvantage")),
        ("magisch", "Magisch", "Magische Rüstung mit AC-Bonus", Some("ac_bonus")),
        ("verzaubert", "Verzaubert", "Verzauberte Rüstung mit speziellen Eigenschaften", Some("ac_bonus")),
        ("widerstand", "Widerstand", "Rüstung des Widerstands (Schadenstyp im parameter_value)", Some("damage_resistance")),
        ("immunitaet", "Immunität", "Rüstung der Immunität (Schadenstyp im parameter_value)", Some("damage_immunity")),
    ];

    for (id, name, description, affects_field) in properties {
        conn.execute(
            "INSERT OR IGNORE INTO armor_properties (id, name, description, affects_field) VALUES (?, ?, ?, ?)",
            params![id, name, description, affects_field],
        )?;
        println!("   • {} ({})", name, id);
    }
    Ok(())
}
