use rusqlite::{Connection, Result};
use serde_json::Value;

fn main() -> Result<()> {
    println!("🔨 Background Starting Equipment Migration");
    println!("{}", "═".repeat(80));
    
    // Öffne Datenbank (versuche verschiedene Pfade)
    let db_paths = vec![
        "../dnd-nexus.db",
        "dnd-nexus.db",
        "../../dnd-nexus.db",
    ];
    
    let mut conn = None;
    for path in &db_paths {
        if std::path::Path::new(path).exists() {
            conn = Some(Connection::open(path)?);
            println!("   ✓ Datenbank gefunden: {}", path);
            break;
        }
    }
    
    let conn = conn.ok_or_else(|| rusqlite::Error::SqliteFailure(
        rusqlite::ffi::Error::new(1),
        Some("Datenbank nicht gefunden. Bitte im Projekt-Root ausführen.".to_string())
    ))?;
    
    println!("\n📋 Schritt 1: Erstelle background_starting_equipment Tabelle...\n");
    
    // Erstelle Tabelle für strukturierte Starting Equipment Daten
    conn.execute(
        "CREATE TABLE IF NOT EXISTS background_starting_equipment (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            background_id TEXT NOT NULL,
            option_label TEXT,  -- 'A', 'B', oder NULL für feste Items
            item_name TEXT NOT NULL,  -- Name des Items (z.B. 'Sichel', 'Buch (Gebete)', 'GOLD')
            item_id TEXT,  -- FK zu core_items/custom_items (falls gefunden)
            tool_id TEXT,  -- FK zu core_tools/custom_tools (falls Tool)
            weapon_id TEXT,  -- FK zu core_weapons/custom_weapons (falls Waffe)
            quantity INTEGER DEFAULT 1,
            is_variant BOOLEAN DEFAULT 0,  -- TRUE für Varianten wie 'Buch (Gebete)'
            base_item_name TEXT,  -- Basis-Name ohne Variante (z.B. 'Buch' für 'Buch (Gebete)')
            variant_suffix TEXT,  -- Varianten-Suffix (z.B. '(Gebete)' für 'Buch (Gebete)')
            gold REAL,  -- Gold-Menge (nur wenn item_name = 'GOLD')
            is_gold BOOLEAN DEFAULT 0,  -- TRUE wenn dies ein Gold-Eintrag ist
            created_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (background_id) REFERENCES core_backgrounds(id) ON DELETE CASCADE,
            FOREIGN KEY (item_id) REFERENCES core_items(id) ON DELETE SET NULL,
            FOREIGN KEY (tool_id) REFERENCES core_tools(id) ON DELETE SET NULL,
            FOREIGN KEY (weapon_id) REFERENCES core_weapons(id) ON DELETE SET NULL
        )",
        [],
    )?;
    
    // Erstelle Indizes
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_bg_equipment_bg ON background_starting_equipment(background_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_bg_equipment_option ON background_starting_equipment(background_id, option_label)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_bg_equipment_item ON background_starting_equipment(item_id)",
        [],
    )?;
    
    println!("✅ Tabelle erstellt\n");
    
    println!("📦 Schritt 2: Migriere bestehende Daten...\n");
    
    // Lösche alte Einträge (für Re-Run)
    conn.execute("DELETE FROM background_starting_equipment", [])?;
    println!("   ✓ Alte Einträge gelöscht\n");
    
    // Hole alle Backgrounds
    let mut stmt = conn.prepare("SELECT id, name, data FROM core_backgrounds")?;
    let backgrounds = stmt.query_map([], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
        ))
    })?;
    
    let mut migrated = 0;
    let mut errors = 0;
    
    // Prepare statements
    let mut insert_equipment = conn.prepare(
        "INSERT INTO background_starting_equipment 
        (background_id, option_label, item_name, item_id, tool_id, weapon_id, quantity, is_variant, base_item_name, variant_suffix, gold, is_gold)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    )?;
    
    // Hole alle Items, Tools und Waffen für Matching
    let items_db: Vec<(String, String)> = conn.prepare("SELECT id, name FROM core_items")?
        .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))?
        .collect::<Result<Vec<_>, _>>()?;
    
    let tools_db: Vec<(String, String)> = conn.prepare("SELECT id, name FROM core_tools")?
        .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))?
        .collect::<Result<Vec<_>, _>>()?;
    
    let weapons_db: Vec<(String, String)> = conn.prepare("SELECT id, name FROM core_weapons")?
        .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))?
        .collect::<Result<Vec<_>, _>>()?;
    
    println!("   Gefunden: {} Items, {} Tools, {} Waffen\n", items_db.len(), tools_db.len(), weapons_db.len());
    
    // Helper: Normalisiere Item-Namen für Matching
    fn normalize_name(name: &str) -> String {
        name.to_lowercase()
            .replace(" ", "")
            .replace("-", "")
            .replace("(", "")
            .replace(")", "")
            .trim()
            .to_string()
    }
    
    // Helper: Finde Item/Tool/Weapon ID
    fn find_item_id(item_name: &str, items: &[(String, String)], tools: &[(String, String)], weapons: &[(String, String)]) -> (Option<String>, Option<String>, Option<String>) {
        let normalized = normalize_name(item_name);
        
        // Versuche exakte Übereinstimmung
        for (id, name) in items {
            if normalize_name(name) == normalized {
                return (Some(id.clone()), None, None);
            }
        }
        
        for (id, name) in tools {
            if normalize_name(name) == normalized {
                return (None, Some(id.clone()), None);
            }
        }
        
        for (id, name) in weapons {
            if normalize_name(name) == normalized {
                return (None, None, Some(id.clone()));
            }
        }
        
        // Versuche Partial-Match (z.B. "Buch" für "Buch (Gebete)")
        let base_name = item_name.split('(').next().unwrap_or(item_name).trim();
        let base_normalized = normalize_name(base_name);
        
        for (id, name) in items {
            if normalize_name(name) == base_normalized {
                return (Some(id.clone()), None, None);
            }
        }
        
        (None, None, None)
    }
    
    // Helper: Parse Variante
    fn parse_variant(item_name: &str) -> (String, bool, String, Option<String>) {
        if let Some(pos) = item_name.find('(') {
            let base = item_name[..pos].trim().to_string();
            let variant = item_name[pos..].trim().to_string();
            (base.clone(), true, base, Some(variant))
        } else {
            (item_name.to_string(), false, item_name.to_string(), None)
        }
    }
    
    for bg_result in backgrounds {
        let (bg_id, bg_name, data_str) = bg_result?;
        
        // Parse JSON
        let data: Value = match serde_json::from_str(&data_str) {
            Ok(d) => d,
            Err(e) => {
                eprintln!("   ⚠️  {}: JSON Parse Error: {}", bg_name, e);
                errors += 1;
                continue;
            }
        };
        
        // Prüfe auf starting_equipment
        if let Some(starting_equipment) = data.get("starting_equipment") {
            // Prüfe auf options-Format (neue Struktur)
            if let Some(options) = starting_equipment.get("options").and_then(|o| o.as_array()) {
                println!("   📦 {}: Migriere {} Optionen...", bg_name, options.len());
                
                for option in options {
                    let label = option.get("label").and_then(|l| l.as_str());
                    let _items = option.get("items");
                    let gold = option.get("gold").and_then(|g| g.as_f64());
                    
                    // Gold wird separat in der Option gespeichert (nicht als Item)
                    // Wir speichern es als separaten Eintrag mit item_name = "GOLD"
                    if let Some(gold_val) = gold {
                        let label_str = label.unwrap_or("").to_string();
                        insert_equipment.execute(rusqlite::params![
                            bg_id,
                            label_str,
                            "GOLD",
                            None::<String>,
                            None::<String>,
                            None::<String>,
                            1,
                            false,
                            Some("GOLD".to_string()),
                            None::<String>,
                            gold_val,
                            true,  // is_gold = true
                        ])?;
                    }
                    
                    // Füge Items hinzu
                    if let Some(items_value) = option.get("items") {
                        if items_value.is_null() {
                            // items ist null (z.B. Option B hat nur Gold)
                            println!("      Option {}: items ist null (nur Gold)", label.unwrap_or("?"));
                        } else if let Some(items_array) = items_value.as_array() {
                            println!("      Option {}: {} Items gefunden", label.unwrap_or("?"), items_array.len());
                            for (idx, item) in items_array.iter().enumerate() {
                                // Unterstütze beide Formate: String oder StructuredItem-Objekt
                                let (item_name, quantity) = if let Some(name_str) = item.as_str() {
                                    // Einfaches String-Format
                                    (name_str.to_string(), 1)
                                } else if let Some(item_obj) = item.as_object() {
                                    // StructuredItem-Format: {name, quantity, unit, variant}
                                    let name = item_obj.get("name")
                                        .and_then(|n| n.as_str())
                                        .unwrap_or("")
                                        .to_string();
                                    let qty = item_obj.get("quantity")
                                        .and_then(|q| q.as_i64())
                                        .unwrap_or(1) as i32;
                                    (name, qty)
                                } else {
                                    eprintln!("        ⚠️  [{}/{}] Unbekanntes Item-Format: {:?}", idx + 1, items_array.len(), item);
                                    continue;
                                };
                                
                                if item_name.is_empty() {
                                    continue;
                                }
                                
                                println!("        [{}/{}] Verarbeite: {} (x{})", idx + 1, items_array.len(), item_name, quantity);
                                
                                // Prüfe auf Variante im StructuredItem-Format
                                let (final_name, is_variant, base_item_name, variant_suffix) = if let Some(item_obj) = item.as_object() {
                                    if let Some(variant) = item_obj.get("variant").and_then(|v| v.as_str()) {
                                        // Variante ist explizit im Objekt
                                        let base = item_name.clone();
                                        (format!("{} ({})", base, variant), true, base, Some(format!("({})", variant)))
                                    } else {
                                        // Keine explizite Variante, prüfe Name auf Varianten-Syntax
                                        parse_variant(&item_name)
                                    }
                                } else {
                                    // String-Format: Parse Variante aus Name
                                    parse_variant(&item_name)
                                };
                                
                                // Versuche Item/Tool/Weapon zu finden
                                let (item_id, tool_id, weapon_id) = find_item_id(&final_name, &items_db, &tools_db, &weapons_db);
                                
                                let label_str = label.unwrap_or("").to_string();
                                match insert_equipment.execute(rusqlite::params![
                                    bg_id,
                                    label_str,
                                    final_name,
                                    item_id,
                                    tool_id,
                                    weapon_id,
                                    quantity,
                                    is_variant,
                                    Some(base_item_name),
                                    variant_suffix,
                                    None::<f64>,
                                    false,  // is_gold = false
                                ]) {
                                    Ok(rows) => {
                                        let matched = if item_id.is_some() { "Item" } else if tool_id.is_some() { "Tool" } else if weapon_id.is_some() { "Weapon" } else { "N/A" };
                                        println!("          → {} ({} Zeilen)", matched, rows);
                                    }
                                    Err(e) => {
                                        eprintln!("          ✗ Fehler: {}", e);
                                    }
                                }
                            }
                        } else {
                            println!("      Option {}: items ist kein Array", label.unwrap_or("?"));
                        }
                    } else {
                        println!("      Option {}: kein items-Feld", label.unwrap_or("?"));
                    }
                }
                
                migrated += 1;
            } else if let Some(items_array) = starting_equipment.get("items").and_then(|i| i.as_array()) {
                // Legacy-Format: Direktes items-Array
                println!("   📦 {}: Migriere Legacy-Format...", bg_name);
                
                for item in items_array {
                    if let Some(item_name) = item.as_str() {
                        let (_base_name, is_variant, base_item_name, variant_suffix) = parse_variant(item_name);
                        
                        let (item_id, tool_id, weapon_id) = find_item_id(item_name, &items_db, &tools_db, &weapons_db);
                        
                        insert_equipment.execute(rusqlite::params![
                            bg_id,
                            None::<String>,
                            item_name,
                            item_id,
                            tool_id,
                            weapon_id,
                            1,
                            is_variant,
                            Some(base_item_name),
                            variant_suffix,
                            None::<f64>,
                            false,  // is_gold = false
                        ])?;
                    }
                }
                
                migrated += 1;
            }
        }
    }
    
    println!("\n✅ Migration abgeschlossen!");
    println!("   ✓ {} Backgrounds migriert", migrated);
    println!("   ✗ {} Fehler", errors);
    
    // Validiere Migration
    println!("\n🔍 Schritt 3: Validiere Migration...\n");
    
    let count = conn.query_row(
        "SELECT COUNT(*) FROM background_starting_equipment",
        [],
        |row| row.get::<_, i64>(0),
    )?;
    
    println!("   📊 Gesamt Einträge: {}", count);
    
    // Zeige Beispiel-Daten
    let mut stmt = conn.prepare(
        "SELECT background_id, option_label, item_name, item_id, tool_id, weapon_id, quantity, is_variant, gold, is_gold
         FROM background_starting_equipment 
         WHERE background_id IN ('bauer', 'akolyth', 'adeliger')
         ORDER BY background_id, option_label, item_name
         LIMIT 20"
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
    
    println!("\n   📋 Beispiel-Daten:");
    for ex in examples {
        let (bg_id, option, item_name, item_id, tool_id, weapon_id, qty, is_var, gold, is_gold) = ex?;
        if is_gold {
            println!("      {} [{}] {} GM Gold",
                bg_id, option.unwrap_or_else(|| "fixed".to_string()), gold.unwrap_or(0.0));
        } else {
            println!("      {} [{}] {} (x{}) - Item: {:?}, Tool: {:?}, Weapon: {:?}, Variant: {}",
                bg_id, option.unwrap_or_else(|| "fixed".to_string()), item_name, qty,
                item_id.is_some(), tool_id.is_some(), weapon_id.is_some(), is_var);
        }
    }
    
    println!("\n✅ Migration erfolgreich abgeschlossen!");
    println!("{}", "═".repeat(80));
    
    Ok(())
}
