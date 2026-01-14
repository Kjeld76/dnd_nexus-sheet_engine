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

    // Prüfe Dolch (beil)
    let weapon_id = "dolch";
    
    println!("\n=== Waffe: Dolch ===\n");
    
    // Mastery
    let mastery: Option<String> = conn.query_row(
        "SELECT mastery_id FROM core_weapons WHERE id = ?",
        [weapon_id],
        |row| row.get(0)
    ).ok();
    
    println!("Mastery ID: {:?}", mastery);
    
    if let Some(mid) = &mastery {
        if !mid.is_empty() {
            let mastery_name: Option<String> = conn.query_row(
                "SELECT name FROM weapon_masteries WHERE id = ?",
                [mid],
                |row| row.get(0)
            ).ok();
            println!("Mastery Name: {:?}", mastery_name);
        }
    }
    
    // Properties
    let mut stmt = conn.prepare(
        "SELECT wp.id, wp.name, wpm.parameter_value
         FROM weapon_property_mappings wpm
         JOIN weapon_properties wp ON wpm.property_id = wp.id
         WHERE wpm.weapon_id = ?"
    ).unwrap();
    
    let properties = stmt.query_map([weapon_id], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, Option<String>>(2)?
        ))
    }).unwrap();
    
    println!("\nProperties:");
    for prop in properties {
        if let Ok((id, name, param)) = prop {
            println!("  • {} ({}) - param: {:?}", name, id, param);
        }
    }
}
