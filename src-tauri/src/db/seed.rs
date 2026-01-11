use rusqlite::{params, Connection};
use std::path::Path;

pub fn seed_core_data(conn: &mut Connection) -> Result<(), String> {
    // Clear old data first before a fresh import
    clear_core_data(conn)?;

    // Try to import from the project's master database
    // sync.db is the git-tracked source database
    // dnd-nexus.db is the project database (not in git)
    let master_db_paths = [
        Path::new("sync.db"),
        Path::new("../sync.db"),
        Path::new("dnd-nexus.db"),
        Path::new("../dnd-nexus.db"),
        Path::new("C:/Users/mario/.cursor/projects/dnd_nexus/dnd-nexus.db"),
    ];

    let mut master_found = false;
    for path in master_db_paths {
        if path.exists() {
            println!("Importing from master database: {:?}", path);
            import_all_from_master(conn, path)?;
            master_found = true;
            break;
        }
    }

    if !master_found {
        println!("No master database found. Please run the extraction tools first.");
        return Err("No master database found".to_string());
    }

    Ok(())
}

fn import_all_from_master(target_conn: &mut Connection, master_path: &Path) -> Result<(), String> {
    println!("Opening source database at: {:?}", master_path);
    let source_conn = Connection::open(master_path).map_err(|e| e.to_string())?;

    // Start transaction on target
    let tx = target_conn.transaction().map_err(|e| e.to_string())?;

    // 1. Spells
    println!("Importing Spells...");
    let mut stmt = source_conn.prepare("SELECT id, name, level, school, casting_time, range, components, material_components, duration, concentration, ritual, description, higher_levels, classes, data FROM core_spells").map_err(|e| e.to_string())?;
    let spell_iter = stmt.query_map([], |row| {
        Ok((
            row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, i32>(2)?,
            row.get::<_, String>(3)?, row.get::<_, String>(4)?, row.get::<_, String>(5)?,
            row.get::<_, String>(6)?, row.get::<_, Option<String>>(7)?, row.get::<_, String>(8)?,
            row.get::<_, bool>(9)?, row.get::<_, bool>(10)?, row.get::<_, String>(11)?,
            row.get::<_, Option<String>>(12)?, row.get::<_, String>(13)?, row.get::<_, String>(14)?
        ))
    }).map_err(|e| e.to_string())?;

    for s in spell_iter {
        let s = s.map_err(|e| e.to_string())?;
        tx.execute(
            "INSERT INTO core_spells (id, name, level, school, casting_time, range, components, material_components, duration, concentration, ritual, description, higher_levels, classes, data) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![s.0, s.1, s.2, s.3, s.4, s.5, s.6, s.7, s.8, s.9, s.10, s.11, s.12, s.13, s.14],
        ).map_err(|e| e.to_string())?;
    }

    // 2. Species
    println!("Importing Species...");
    let mut stmt = source_conn.prepare("SELECT id, name, data FROM core_species").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, String>(2)?))).map_err(|e| e.to_string())?;
    for r in rows {
        let (id, name, data) = r.map_err(|e| e.to_string())?;
        tx.execute("INSERT INTO core_species (id, name, data) VALUES (?, ?, ?)", params![id, name, data]).map_err(|e| e.to_string())?;
    }

    // 3. Classes
    println!("Importing Classes...");
    let mut stmt = source_conn.prepare("SELECT id, name, data FROM core_classes").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, String>(2)?))).map_err(|e| e.to_string())?;
    for r in rows {
        let (id, name, data) = r.map_err(|e| e.to_string())?;
        tx.execute("INSERT INTO core_classes (id, name, data) VALUES (?, ?, ?)", params![id, name, data]).map_err(|e| e.to_string())?;
    }

    // 4. Gear
    println!("Importing Gear...");
    let mut stmt = source_conn.prepare("SELECT id, name, description, cost_gp, weight_kg, data FROM core_gear").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, String>(2)?, row.get::<_, f64>(3)?, row.get::<_, f64>(4)?, row.get::<_, String>(5)?))).map_err(|e| e.to_string())?;
    for r in rows {
        let (id, name, desc, cost, weight, data) = r.map_err(|e| e.to_string())?;
        tx.execute("INSERT INTO core_gear (id, name, description, cost_gp, weight_kg, data) VALUES (?, ?, ?, ?, ?, ?)", params![id, name, desc, cost, weight, data]).map_err(|e| e.to_string())?;
    }

    // 5. Weapons
    println!("Importing Weapons...");
    let mut stmt = source_conn.prepare("SELECT id, name, category, weapon_type, damage_dice, damage_type, weight_kg, cost_gp, data FROM core_weapons").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| Ok((
        row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, String>(2)?, 
        row.get::<_, String>(3)?, row.get::<_, String>(4)?, row.get::<_, String>(5)?, 
        row.get::<_, f64>(6)?, row.get::<_, f64>(7)?, row.get::<_, String>(8)?
    ))).map_err(|e| e.to_string())?;
    for r in rows {
        let (id, name, cat, wtype, dmg, dmg_type, weight, cost, data) = r.map_err(|e| e.to_string())?;
        tx.execute(
            "INSERT INTO core_weapons (id, name, category, weapon_type, damage_dice, damage_type, weight_kg, cost_gp, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", 
            params![id, name, cat, wtype, dmg, dmg_type, weight, cost, data]
        ).map_err(|e| e.to_string())?;
    }

    // 6. Armor
    println!("Importing Armor...");
    let mut stmt = source_conn.prepare("SELECT id, name, category, base_ac, strength_requirement, stealth_disadvantage, weight_kg, cost_gp, data FROM core_armors").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| Ok((
        row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, String>(2)?, 
        row.get::<_, i32>(3)?, row.get::<_, Option<i32>>(4)?, row.get::<_, bool>(5)?, 
        row.get::<_, f64>(6)?, row.get::<_, f64>(7)?, row.get::<_, String>(8)?
    ))).map_err(|e| e.to_string())?;
    for r in rows {
        let (id, name, cat, ac, str_req, stealth, weight, cost, data) = r.map_err(|e| e.to_string())?;
        tx.execute(
            "INSERT INTO core_armors (id, name, category, base_ac, strength_requirement, stealth_disadvantage, weight_kg, cost_gp, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", 
            params![id, name, cat, ac, str_req, stealth, weight, cost, data]
        ).map_err(|e| e.to_string())?;
    }

    // 7. Feats
    println!("Importing Feats...");
    let mut stmt = source_conn.prepare("SELECT id, name, category, data FROM core_feats").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, String>(2)?, row.get::<_, String>(3)?))).map_err(|e| e.to_string())?;
    for r in rows {
        let (id, name, cat, data) = r.map_err(|e| e.to_string())?;
        tx.execute("INSERT INTO core_feats (id, name, category, data) VALUES (?, ?, ?, ?)", params![id, name, cat, data]).map_err(|e| e.to_string())?;
    }

    // 8. Skills
    println!("Importing Skills...");
    let mut stmt = source_conn.prepare("SELECT id, name, ability, description FROM core_skills").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, String>(2)?, row.get::<_, String>(3)?))).map_err(|e| e.to_string())?;
    for r in rows {
        let (id, name, ability, desc) = r.map_err(|e| e.to_string())?;
        tx.execute("INSERT INTO core_skills (id, name, ability, description) VALUES (?, ?, ?, ?)", params![id, name, ability, desc]).map_err(|e| e.to_string())?;
    }

    // 9. Tools
    println!("Importing Tools...");
    let mut stmt = source_conn.prepare("SELECT id, name, category, cost_gp, weight_kg, data FROM core_tools").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, String>(2)?, row.get::<_, f64>(3)?, row.get::<_, f64>(4)?, row.get::<_, String>(5)?))).map_err(|e| e.to_string())?;
    for r in rows {
        let (id, name, cat, cost, weight, data) = r.map_err(|e| e.to_string())?;
        tx.execute("INSERT INTO core_tools (id, name, category, cost_gp, weight_kg, data) VALUES (?, ?, ?, ?, ?, ?)", params![id, name, cat, cost, weight, data]).map_err(|e| e.to_string())?;
    }

    // 10. Backgrounds
    println!("Importing Backgrounds...");
    let mut stmt = source_conn.prepare("SELECT id, name, data FROM core_backgrounds").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, String>(2)?))).map_err(|e| e.to_string())?;
    for r in rows {
        let (id, name, data) = r.map_err(|e| e.to_string())?;
        tx.execute("INSERT INTO core_backgrounds (id, name, data) VALUES (?, ?, ?)", params![id, name, data]).map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;
    println!("Transaction committed successfully.");
    Ok(())
}

pub fn clear_core_data(conn: &Connection) -> Result<(), String> {
    conn.execute("DELETE FROM core_spells", []).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM core_species", []).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM core_classes", []).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM core_gear", []).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM core_weapons", []).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM core_armors", []).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM core_feats", []).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM core_skills", []).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM core_tools", []).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM core_backgrounds", []).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn import_phb_data(db: tauri::State<'_, crate::db::Database>) -> Result<(), String> {
    let mut conn = db.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    println!("Starting PHB Import from Master...");
    seed_core_data(&mut conn)?;
    println!("PHB Import finished successfully.");
    Ok(())
}
