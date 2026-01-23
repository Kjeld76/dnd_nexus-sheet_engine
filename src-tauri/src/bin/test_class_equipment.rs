use rusqlite::{Connection, params};

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
    
    let conn = conn.ok_or("Datenbank nicht gefunden")?;
    
    println!("🧪 Teste Class Starting Equipment Schema\n");
    
    // Test 1: Tabelle existiert
    println!("[1/6] Prüfe Tabelle class_starting_equipment existiert...");
    let table_exists: i64 = conn.query_row(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='class_starting_equipment'",
        [],
        |row| row.get(0),
    )?;
    
    if table_exists > 0 {
        println!("   ✓ Tabelle existiert\n");
    } else {
        println!("   ✗ Tabelle existiert NICHT!\n");
        return Err("Tabelle class_starting_equipment nicht gefunden".into());
    }
    
    // Test 2: Spalten prüfen
    println!("[2/6] Prüfe Spalten...");
    let mut stmt = conn.prepare("PRAGMA table_info(class_starting_equipment)")?;
    let columns = stmt.query_map([], |row| {
        Ok(row.get::<_, String>(1)?)
    })?;
    
    let expected_columns = vec![
        "id", "class_id", "is_custom", "option_label", "item_name",
        "item_id", "tool_id", "weapon_id", "armor_id", "quantity",
        "is_variant", "base_item_name", "variant_suffix", "gold",
        "is_gold", "created_at"
    ];
    
    let found_columns: Vec<String> = columns.collect::<Result<Vec<_>, _>>()?;
    let mut missing = Vec::new();
    for expected in &expected_columns {
        if !found_columns.contains(&expected.to_string()) {
            missing.push(expected);
        }
    }
    
    if missing.is_empty() {
        println!("   ✓ Alle erwarteten Spalten vorhanden\n");
    } else {
        println!("   ✗ Fehlende Spalten: {:?}\n", missing);
    }
    
    // Test 3: Indizes prüfen
    println!("[3/6] Prüfe Indizes...");
    let index_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND tbl_name='class_starting_equipment'",
        [],
        |row| row.get(0),
    )?;
    
    if index_count >= 4 {
        println!("   ✓ Indizes vorhanden ({})\n", index_count);
    } else {
        println!("   ⚠ Nur {} Indizes gefunden (erwartet: >= 4)\n", index_count);
    }
    
    // Test 4: Trigger prüfen
    println!("[4/6] Prüfe Trigger...");
    let trigger_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='trigger' AND tbl_name='class_starting_equipment'",
        [],
        |row| row.get(0),
    )?;
    
    if trigger_count >= 2 {
        println!("   ✓ Trigger vorhanden ({})\n", trigger_count);
    } else {
        println!("   ⚠ Nur {} Trigger gefunden (erwartet: >= 2)\n", trigger_count);
    }
    
    // Test 5: Test-Daten einfügen (mit existierender Klasse)
    println!("[5/6] Teste Daten-Insert...");
    
    // Prüfe, ob mindestens eine Klasse existiert
    let class_exists: i64 = conn.query_row(
        "SELECT COUNT(*) FROM core_classes LIMIT 1",
        [],
        |row| row.get(0),
    )?;
    
    if class_exists == 0 {
        println!("   ⚠ Keine Klassen in core_classes gefunden - Test-Daten werden nicht eingefügt\n");
    } else {
        // Hole erste Klasse
        let test_class_id: String = conn.query_row(
            "SELECT id FROM core_classes LIMIT 1",
            [],
            |row| row.get(0),
        )?;
        
        // Test-Insert (gültige class_id)
        match conn.execute(
            "INSERT INTO class_starting_equipment (class_id, is_custom, option_label, item_name, is_gold, gold) 
             VALUES (?, ?, ?, ?, ?, ?)",
            params![test_class_id, false, "TEST", "Test-Gold", true, 100.0],
        ) {
            Ok(_) => {
                println!("   ✓ Test-Insert erfolgreich (class_id: {})", test_class_id);
                
                // Test-Insert (ungültige class_id) - sollte fehlschlagen
                let invalid_result = conn.execute(
                    "INSERT INTO class_starting_equipment (class_id, is_custom, option_label, item_name, is_gold, gold) 
                     VALUES (?, ?, ?, ?, ?, ?)",
                    params!["invalid_class_id_xyz", false, "TEST", "Test-Gold", true, 100.0],
                );
                
                if invalid_result.is_err() {
                    println!("   ✓ Trigger funktioniert: Ungültige class_id wurde abgelehnt\n");
                } else {
                    println!("   ✗ Trigger funktioniert NICHT: Ungültige class_id wurde akzeptiert!\n");
                }
                
                // Cleanup: Test-Daten löschen
                conn.execute(
                    "DELETE FROM class_starting_equipment WHERE option_label = 'TEST'",
                    [],
                )?;
                println!("   ✓ Test-Daten entfernt\n");
            }
            Err(e) => {
                println!("   ✗ Test-Insert fehlgeschlagen: {}\n", e);
            }
        }
    }
    
    // Test 6: Query mit all_classes View
    println!("[6/6] Teste Query mit all_classes View...");
    
    let query_test: i64 = conn.query_row(
        "SELECT COUNT(*) 
         FROM class_starting_equipment e
         JOIN all_classes c ON e.class_id = c.id",
        [],
        |row| row.get(0),
    )?;
    
    println!("   ✓ Query mit all_classes funktioniert ({} Ergebnisse)\n", query_test);
    
    // Zeige aktuelle Statistiken
    println!("📊 Aktuelle Statistiken:\n");
    
    let total: i64 = conn.query_row(
        "SELECT COUNT(*) FROM class_starting_equipment",
        [],
        |row| row.get(0),
    )?;
    
    let core_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM class_starting_equipment WHERE is_custom = 0",
        [],
        |row| row.get(0),
    )?;
    
    let custom_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM class_starting_equipment WHERE is_custom = 1",
        [],
        |row| row.get(0),
    )?;
    
    println!("   Gesamt Einträge: {}", total);
    println!("   Core-Klassen: {}", core_count);
    println!("   Custom-Klassen: {}\n", custom_count);
    
    if total > 0 {
        println!("📋 Beispiel-Einträge:\n");
        let mut stmt = conn.prepare(
            "SELECT class_id, is_custom, option_label, item_name, quantity, is_gold, gold
             FROM class_starting_equipment
             ORDER BY class_id, option_label
             LIMIT 10"
        )?;
        
        let examples = stmt.query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, bool>(1)?,
                row.get::<_, Option<String>>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, i64>(4)?,
                row.get::<_, bool>(5)?,
                row.get::<_, Option<f64>>(6)?,
            ))
        })?;
        
        for ex in examples {
            let (class_id, is_custom, option, item_name, qty, is_gold, gold) = ex?;
            let origin = if is_custom { "custom" } else { "core" };
            if is_gold {
                println!("   [{}] {} - {} GM Gold ({})",
                    option.as_ref().unwrap_or(&"-".to_string()),
                    class_id,
                    gold.unwrap_or(0.0),
                    origin
                );
            } else {
                println!("   [{}] {} - {} (x{}) ({})",
                    option.as_ref().unwrap_or(&"-".to_string()),
                    class_id,
                    item_name,
                    qty,
                    origin
                );
            }
        }
        println!();
    }
    
    println!("✅ Alle Tests abgeschlossen!\n");
    
    Ok(())
}
