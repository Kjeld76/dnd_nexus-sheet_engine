use rusqlite::Connection;

fn main() {
    let db_path = "/home/entwickler/.local/share/com.dndnexus.app/dnd-nexus.db";
    let conn = Connection::open(db_path).expect("Could not open DB");

    println!("=== DEBUG: Testing Species ===");
    let mut stmt = conn.prepare("SELECT count(*) FROM all_species").unwrap();
    let count: i32 = stmt.query_row([], |row| row.get(0)).unwrap();
    println!("Count all_species: {}", count);
    
    let mut stmt = conn.prepare("SELECT id, name, size, data FROM all_species LIMIT 1").map_err(|e| println!("Error preparing species query: {}", e)).ok();
    if let Some(mut s) = stmt {
        let iter = s.query_map([], |row| {
             Ok(format!("{} - {} ({:?})\nData: {}", row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, Option<String>>(2)?, row.get::<_, String>(3)?))
        }).unwrap();
        for i in iter {
            println!("Sample Species: {}", i.unwrap());
        }
    }

    println!("\n=== DEBUG: Testing Classes ===");
    let mut stmt = conn.prepare("SELECT count(*) FROM all_classes").unwrap();
    let count: i32 = stmt.query_row([], |row| row.get(0)).unwrap();
    println!("Count all_classes: {}", count);

    let mut stmt = conn.prepare("SELECT name, data FROM all_classes LIMIT 1").unwrap();
    let iter = stmt.query_map([], |row| {
         Ok(format!("{} - Data Len: {}", row.get::<_, String>(0)?, row.get::<_, String>(1)?.len()))
    }).unwrap();
    for i in iter {
        println!("Sample Class: {}", i.unwrap());
    }


    println!("\n=== DEBUG: Testing Feats ===");
    let mut stmt = conn.prepare("SELECT count(*) FROM all_feats").unwrap();
    let count: i32 = stmt.query_row([], |row| row.get(0)).unwrap();
    println!("Count all_feats: {}", count);

    // Test JSON extraction/columns
    let mut stmt = conn.prepare("SELECT id, name, description FROM all_feats LIMIT 1").unwrap();
    let iter = stmt.query_map([], |row| {
        Ok(format!("{} - {} (Desc len: {})", row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, String>(2)?.len()))
    }).unwrap();
    for i in iter {
        println!("Sample Feat: {}", i.unwrap());
    }


    println!("\n=== DEBUG: Testing Backgrounds ===");
    let mut stmt = conn.prepare("SELECT count(*) FROM all_backgrounds").unwrap();
    let count: i32 = stmt.query_row([], |row| row.get(0)).unwrap();
    println!("Count all_backgrounds: {}", count);
    
    // Test complex JSON arrays
    let mut stmt = conn.prepare("SELECT id, name, ability_scores, skills, tools, starting_equipment FROM all_backgrounds LIMIT 1").unwrap();
    let iter = stmt.query_map([], |row| {
         let abs: String = row.get(2)?;
         let skills: String = row.get(3)?;
         Ok(format!("{} - {}\n  Abilities: {}\n  Skills: {}", row.get::<_, String>(0)?, row.get::<_, String>(1)?, abs, skills))
    }).unwrap();
    for i in iter {
        println!("Sample Background: {}", i.unwrap());
    }

}
