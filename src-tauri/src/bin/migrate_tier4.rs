use rusqlite::Connection;
use serde_json::Value;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🚀 Starting Tier 4 Migration (Feats & Backgrounds)...");
    
    let db_path = "/home/entwickler/.local/share/com.dndnexus.app/dnd-nexus.db";
    let conn = Connection::open(db_path)?;
    
    migrate_feats(&conn)?;
    migrate_backgrounds(&conn)?;
    
    println!("✅ Tier 4 Migration Complete!");
    Ok(())
}

fn migrate_feats(conn: &Connection) -> Result<(), Box<dyn std::error::Error>> {
    println!("\n📦 Migrating Feats...");
    
    let mut stmt = conn.prepare("SELECT id, name, data FROM core_feats")?;
    let rows = stmt.query_map([], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
        ))
    })?;

    let mut updated_count = 0;
    
    // Prepare update statement outside loop
    let mut update_stmt = conn.prepare("UPDATE core_feats SET description = ?, prerequisite = ? WHERE id = ?")?;

    for row in rows {
        let (id, name, data_str) = row?;
        let data: Value = serde_json::from_str(&data_str).unwrap_or(Value::Null);

        let description = data.get("description").and_then(|v| v.as_str()).unwrap_or("");
        let prerequisite = data.get("prerequisite").and_then(|v| v.as_str()); // Option<String>

        update_stmt.execute(rusqlite::params![description, prerequisite, id])?;
        updated_count += 1;
    }

    println!("   ✓ Updated {} feats with descriptions and prerequisites.", updated_count);
    Ok(())
}

fn migrate_backgrounds(conn: &Connection) -> Result<(), Box<dyn std::error::Error>> {
    println!("\n📦 Migrating Backgrounds...");

    let mut stmt = conn.prepare("SELECT id, name, data FROM core_backgrounds")?;
    let rows = stmt.query_map([], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
        ))
    })?;

    // Clear target tables first to allow re-runs
    conn.execute("DELETE FROM background_ability_scores", [])?;
    conn.execute("DELETE FROM background_skills", [])?;
    conn.execute("DELETE FROM background_tools", [])?;
    conn.execute("DELETE FROM background_equipment_items", [])?; // Cascades from options usually, but specific table
    // Cascade delete on options should handle items if configured, but let's be safe or rely on FKs.
    // Actually, if we delete options, items go if ON DELETE CASCADE.
    conn.execute("DELETE FROM background_equipment_options", [])?;

    let mut update_desc_stmt = conn.prepare("UPDATE core_backgrounds SET description = ? WHERE id = ?")?;
    let mut insert_ability = conn.prepare("INSERT INTO background_ability_scores (background_id, ability) VALUES (?, ?)")?;
    let mut insert_skill = conn.prepare("INSERT INTO background_skills (background_id, skill_name) VALUES (?, ?)")?;
    let mut insert_tool = conn.prepare("INSERT INTO background_tools (background_id, type, name, category, description) VALUES (?, ?, ?, ?, ?)")?;
    let mut insert_opt = conn.prepare("INSERT INTO background_equipment_options (background_id, label, gold) VALUES (?, ?, ?)")?;
    let mut insert_item = conn.prepare("INSERT INTO background_equipment_items (option_id, item_name, quantity) VALUES (?, ?, ?)")?;

    for row in rows {
        let (id, name, data_str) = row?;
        let data: Value = serde_json::from_str(&data_str).unwrap_or(Value::Null);

        // 1. Description
        let description = data.get("description").and_then(|v| v.as_str()).unwrap_or("");
        update_desc_stmt.execute(rusqlite::params![description, id])?;

        // 2. Ability Scores
        if let Some(scores) = data.get("ability_scores").and_then(|v| v.as_array()) {
            for score in scores {
                if let Some(s) = score.as_str() {
                    insert_ability.execute(rusqlite::params![id, s])?;
                }
            }
        }

        // 3. Skills
        if let Some(skills) = data.get("skills").and_then(|v| v.as_array()) {
            for skill in skills {
                if let Some(s) = skill.as_str() {
                    insert_skill.execute(rusqlite::params![id, s])?;
                }
            }
        }

        // 4. Tools
        if let Some(tool) = data.get("tool").and_then(|v| v.as_object()) {
            let type_ = tool.get("type").and_then(|v| v.as_str()).unwrap_or("fixed");
            let name = tool.get("name").and_then(|v| v.as_str());
            let category = tool.get("category").and_then(|v| v.as_str());
            let desc = tool.get("description").and_then(|v| v.as_str());
            
            insert_tool.execute(rusqlite::params![id, type_, name, category, desc])?;
        } else if let Some(tool_str) = data.get("tool").and_then(|v| v.as_str()) {
             // Legacy string format
             insert_tool.execute(rusqlite::params![id, "fixed", tool_str, None::<String>, None::<String>])?;
        }

        // 5. Equipment
        if let Some(equip) = data.get("starting_equipment") {
            // New structure: options object
            if let Some(options) = equip.get("options").and_then(|v| v.as_array()) {
                for opt in options {
                     let label = opt.get("label").and_then(|v| v.as_str()).unwrap_or("Fixed");
                     let gold = opt.get("gold").and_then(|v| v.as_f64());
                     
                     // Insert Option
                     let opt_id = insert_opt.insert(rusqlite::params![id, label, gold])?;

                     // Insert Items
                     if let Some(items) = opt.get("items").and_then(|v| v.as_array()) {
                         for item in items {
                             if let Some(item_str) = item.as_str() {
                                 insert_item.execute(rusqlite::params![opt_id, item_str, 1])?;
                             } else if let Some(item_obj) = item.as_object() {
                                 // Handle item object {name: "...", quantity: 5}
                                 let item_name = item_obj.get("name").and_then(|v| v.as_str()).unwrap_or("Unknown");
                                 let qty = item_obj.get("quantity").and_then(|v| v.as_i64()).unwrap_or(1);
                                 insert_item.execute(rusqlite::params![opt_id, item_name, qty])?;
                             }
                         }
                     }
                }
            } else if let Some(items) = equip.get("items").and_then(|v| v.as_array()) {
                 // Legacy structure: direct items array (Treat as Option A)
                 let opt_id = insert_opt.insert(rusqlite::params![id, "Standard", None::<f64>])?;
                 for item in items {
                     if let Some(item_str) = item.as_str() {
                         insert_item.execute(rusqlite::params![opt_id, item_str, 1])?;
                     }
                 }
            }
        }
    }

    println!("   ✓ Backgrounds migrated successfully.");
    Ok(())
}
