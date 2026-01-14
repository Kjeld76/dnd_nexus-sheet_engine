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

    // Prüfe View
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM all_weapons_unified", [], |row| row.get(0))
        .unwrap_or(0);
    
    println!("Anzahl Waffen in all_weapons_unified: {}", count);

    if count > 0 {
        let mut stmt = conn.prepare("SELECT id, name, category, mastery_id FROM all_weapons_unified LIMIT 5").unwrap();
        let rows = stmt.query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, Option<String>>(3)?
            ))
        }).unwrap();

        println!("\nErste 5 Waffen aus View:");
        for row in rows {
            if let Ok((id, name, category, mastery_id)) = row {
                println!("  • {} ({}) - {} - mastery: {:?}", name, id, category, mastery_id);
            }
        }
    } else {
        println!("\n⚠️  View ist leer! Prüfe core_weapons...");
        let core_count: i64 = conn.query_row("SELECT COUNT(*) FROM core_weapons", [], |row| row.get(0))
            .unwrap_or(0);
        println!("Anzahl in core_weapons: {}", core_count);
    }
}
