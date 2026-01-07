use rusqlite::{params, Connection};
use std::path::Path;
use uuid::Uuid;
use serde_json::json;

fn main() {
    println!("--- Datenbank Konsolidierung ---");
    
    let source_db = "../dnd5e_strict.db";
    let target_db = "../dnd-nexus.db";

    if !Path::new(source_db).exists() {
        println!("Fehler: {} nicht gefunden!", source_db);
        return;
    }

    println!("Migriere Daten von {} nach {}...", source_db, target_db);
    let source_conn = Connection::open(source_db).expect("Konnte Quell-DB nicht öffnen");
    let target_conn = Connection::open(target_db).expect("Konnte Ziel-DB nicht öffnen");

    // 1. Species
    println!("Migriere Völker...");
    let mut stmt = source_conn.prepare("SELECT id, name, speed, size FROM species").unwrap();
    let rows = stmt.query_map([], |row| {
        let id: i32 = row.get(0)?;
        let name: String = row.get(1)?;
        let speed: f64 = row.get(2)?;
        let size: String = row.get(3)?;
        Ok((id, name, speed, size))
    }).unwrap();

    for r in rows {
        let (s_id, name, speed, size) = r.unwrap();
        let mut trait_stmt = source_conn.prepare("SELECT name, description FROM species_traits WHERE species_id = ?").unwrap();
        let traits: Vec<_> = trait_stmt.query_map([s_id], |t_row| {
            Ok(json!({ "name": t_row.get::<_, String>(0)?, "description": t_row.get::<_, String>(1)? }))
        }).unwrap().map(|t| t.unwrap()).collect();

        let data = json!({ "speed": speed, "size": size, "traits": traits }).to_string();
        target_conn.execute("INSERT OR REPLACE INTO core_species (id, name, data) VALUES (?, ?, ?)", params![Uuid::new_v4().to_string(), name, data]).unwrap();
    }

    // 2. Classes
    println!("Migriere Klassen...");
    let mut stmt = source_conn.prepare("SELECT name FROM classes").unwrap();
    let class_names = stmt.query_map([], |row| row.get::<_, String>(0)).unwrap();
    for name in class_names {
        let name = name.unwrap();
        target_conn.execute("INSERT OR REPLACE INTO core_classes (id, name, data) VALUES (?, ?, ?)", params![Uuid::new_v4().to_string(), name, "{}" ]).unwrap();
    }

    // 3. Items
    println!("Migriere Gegenstände...");
    let mut stmt = source_conn.prepare("SELECT i.name, it.name, i.cost_cp, i.weight FROM items i JOIN item_types it ON i.item_type_id = it.id").unwrap();
    let items = stmt.query_map([], |row| {
        let name: String = row.get(0)?;
        let cat: String = row.get(1)?;
        let cost: Option<i32> = row.get(2)?;
        let weight: Option<f64> = row.get(3)?;
        Ok((name, cat, cost, weight))
    }).unwrap();
    for itm in items {
        let (name, cat, cost, weight) = itm.unwrap();
        let data = json!({ "cost_cp": cost.unwrap_or(0), "weight": weight.unwrap_or(0.0) }).to_string();
        target_conn.execute("INSERT OR REPLACE INTO core_items (id, name, category, data) VALUES (?, ?, ?, ?)", params![Uuid::new_v4().to_string(), name, cat, data]).unwrap();
    }

    // 4. Feats
    println!("Migriere Talente...");
    let mut stmt = source_conn.prepare("SELECT id, name, description FROM feats").unwrap();
    let feats = stmt.query_map([], |row| {
        let id: i32 = row.get(0)?;
        let name: String = row.get(1)?;
        let desc: String = row.get(2)?;
        Ok((id, name, desc))
    }).unwrap();
    for f in feats {
        let (s_id, name, desc) = f.unwrap();
        let mut eff_stmt = source_conn.prepare("SELECT effect_type, effect_value FROM feat_effects WHERE feat_id = ?").unwrap();
        let effects: Vec<_> = eff_stmt.query_map([s_id], |e_row| {
            Ok(json!({ "type": e_row.get::<_, String>(0)?, "value": e_row.get::<_, String>(1)? }))
        }).unwrap().map(|e| e.unwrap()).collect();
        let data = json!({ "description": desc, "effects": effects }).to_string();
        target_conn.execute("INSERT OR REPLACE INTO core_feats (id, name, data) VALUES (?, ?, ?)", params![Uuid::new_v4().to_string(), name, data]).unwrap();
    }

    println!("\nMigration abgeschlossen! Alle Daten sind nun in dnd-nexus.db.");
}
