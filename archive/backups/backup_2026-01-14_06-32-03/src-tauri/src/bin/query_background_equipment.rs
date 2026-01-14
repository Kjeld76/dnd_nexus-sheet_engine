use rusqlite::Connection;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let db_paths = vec![
        "../dnd-nexus.db",
        "dnd-nexus.db",
        "../../dnd-nexus.db",
    ];
    
    let mut conn = None;
    for path in &db_paths {
        if std::path::Path::new(path).exists() {
            conn = Some(Connection::open(path)?);
            println!("✓ Datenbank gefunden: {}\n", path);
            break;
        }
    }
    
    let conn = conn.ok_or_else(|| "Datenbank nicht gefunden")?;
    
    // Zeige Statistiken
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM background_starting_equipment",
        [],
        |row| row.get(0),
    )?;
    
    println!("📊 Gesamt Einträge: {}\n", count);
    
    // Zeige Beispiel-Daten für Bauer, Akolyth, Adeliger
    let mut stmt = conn.prepare(
        "SELECT background_id, option_label, item_name, item_id, tool_id, weapon_id, quantity, is_variant, gold, is_gold
         FROM background_starting_equipment 
         WHERE background_id IN ('bauer', 'akolyth', 'adeliger')
         ORDER BY background_id, option_label, item_name"
    )?;
    
    let examples = stmt.query_map([], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, Option<String>>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, Option<String>>(3)?,
            row.get::<_, Option<String>>(4)?,
            row.get::<_, Option<String>>(5)?,
            row.get::<_, i64>(6)?,
            row.get::<_, bool>(7)?,
            row.get::<_, Option<f64>>(8)?,
            row.get::<_, bool>(9)?,
        ))
    })?;
    
    println!("📋 Beispiel-Daten (Bauer, Akolyth, Adeliger):\n");
    let mut gold_count = 0;
    let mut item_count = 0;
    for ex in examples {
        let (bg_id, option, item_name, item_id, tool_id, weapon_id, qty, is_var, gold, is_gold) = ex?;
        if is_gold {
            gold_count += 1;
            println!("   {} [{}] {} GM Gold",
                bg_id, option.as_ref().unwrap_or(&"fixed".to_string()), gold.unwrap_or(0.0));
        } else {
            item_count += 1;
            let matched = if item_id.is_some() { "Item" } else if tool_id.is_some() { "Tool" } else if weapon_id.is_some() { "Weapon" } else { "N/A" };
            println!("   {} [{}] {} (x{}) - {} - Variant: {}",
                bg_id, option.as_ref().unwrap_or(&"fixed".to_string()), item_name, qty, matched, is_var);
        }
    }
    println!("\n   → {} Gold-Einträge, {} Item-Einträge", gold_count, item_count);
    
    // Zeige Statistiken pro Background
    println!("\n📊 Statistiken pro Background:\n");
    let mut stmt = conn.prepare(
        "SELECT 
            background_id,
            COUNT(*) as total,
            SUM(CASE WHEN is_gold = 1 THEN 1 ELSE 0 END) as gold_entries,
            SUM(CASE WHEN item_id IS NOT NULL THEN 1 ELSE 0 END) as matched_items,
            SUM(CASE WHEN tool_id IS NOT NULL THEN 1 ELSE 0 END) as matched_tools,
            SUM(CASE WHEN weapon_id IS NOT NULL THEN 1 ELSE 0 END) as matched_weapons,
            SUM(CASE WHEN is_variant = 1 THEN 1 ELSE 0 END) as variants
         FROM background_starting_equipment
         GROUP BY background_id
         ORDER BY background_id"
    )?;
    
    let stats = stmt.query_map([], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, i64>(1)?,
            row.get::<_, i64>(2)?,
            row.get::<_, i64>(3)?,
            row.get::<_, i64>(4)?,
            row.get::<_, i64>(5)?,
            row.get::<_, i64>(6)?,
        ))
    })?;
    
    for stat in stats {
        let (bg_id, total, gold, items, tools, weapons, variants) = stat?;
        println!("   {}: {} Einträge ({} Gold, {} Items, {} Tools, {} Waffen, {} Varianten)",
            bg_id, total, gold, items, tools, weapons, variants);
    }
    
    Ok(())
}
