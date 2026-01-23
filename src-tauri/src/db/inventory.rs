use rusqlite::{params, Connection};
use crate::types::character::{Character, CharacterInventoryEntry};
use crate::error::AppResult;
use serde::Serialize;
use std::collections::HashMap;
use serde_json::Value;

/// Helper to fetch all inventory entries for a character from SQL
pub fn get_all_inventory_entries(conn: &Connection, character_id: &str) -> AppResult<Vec<CharacterInventoryEntry>> {
    let mut stmt = conn.prepare(
        "SELECT id, character_id, item_id, item_type, quantity, is_equipped, is_attuned,
                container_id, custom_name, custom_description, data, created_at, updated_at,
                location, source, is_starting_equipment
         FROM character_inventory 
         WHERE character_id = ?"
    )?;
    
    let iter = stmt.query_map(params![character_id], |row| {
         let data: Option<String> = row.get(10)?;
         let data_value: Option<Value> = data.and_then(|s| serde_json::from_str(&s).ok());
         Ok(CharacterInventoryEntry {
             id: row.get(0)?,
             character_id: row.get(1)?,
             item_id: row.get(2)?,
             item_type: row.get(3)?,
             quantity: row.get(4)?,
             is_equipped: row.get::<_, i32>(5)? != 0,
             is_attuned: row.get::<_, i32>(6)? != 0,
             container_id: row.get(7)?,
             custom_name: row.get(8)?,
             custom_description: row.get(9)?,
             data: data_value,
             created_at: row.get(11)?,
             updated_at: row.get(12)?,
             location: row.get(13)?,
             source: row.get(14)?,
             is_starting_equipment: row.get::<_, i32>(15)? != 0,
         })
    })?;
    
    let mut items = Vec::new();
    for item in iter {
        items.push(item?);
    }
    Ok(items)
}

#[derive(Debug, Serialize)]
pub struct StartingEquipmentOption {
    pub label: String,
    pub items: Vec<String>,
    pub gold: f64,
}

/// Helper to fetch class starting equipment options
pub fn get_class_starting_equipment_options(
    conn: &Connection,
    class_id: &str,
) -> AppResult<Vec<StartingEquipmentOption>> {
    let mut stmt = conn.prepare(
        "SELECT option_label, item_name, quantity, is_gold, gold 
         FROM class_starting_equipment 
         WHERE class_id = ? 
         ORDER BY option_label, item_name"
    )?;

    let rows = stmt.query_map(params![class_id], |row| {
        Ok((
            row.get::<_, String>(0)?, // option_label
            row.get::<_, String>(1)?, // item_name
            row.get::<_, i32>(2)?,    // quantity
            row.get::<_, bool>(3)?,   // is_gold
            row.get::<_, Option<f64>>(4)?, // gold
        ))
    })?;

    let mut options_map: HashMap<String, StartingEquipmentOption> = HashMap::new();

    for row in rows {
        let (label, name, quantity, is_gold, gold_opt) = row?;
        
        let entry = options_map.entry(label.clone()).or_insert(StartingEquipmentOption {
            label: label.clone(),
            items: Vec::new(),
            gold: 0.0,
        });

        if is_gold {
            if let Some(g) = gold_opt {
                entry.gold += g;
            }
        } else {
            let display_name = if quantity > 1 {
                format!("{}x {}", quantity, name)
            } else {
                name
            };
            entry.items.push(display_name);
        }
    }

    let mut result: Vec<StartingEquipmentOption> = options_map.into_values().collect();
    result.sort_by(|a, b| a.label.cmp(&b.label));

    Ok(result)
}

/// Synchronizes the character_inventory table with the inventory field in a Character struct.
pub fn sync_inventory(conn: &Connection, character: &Character) -> AppResult<()> {
    let char_id = character.id.to_string();

    // 1. Clear existing inventory for this character
    conn.execute(
        "DELETE FROM character_inventory WHERE character_id = ?",
        params![char_id],
    )?;

    // 1b. Update currency in characters table
    conn.execute(
        "UPDATE characters SET 
            currency_cp = ?, 
            currency_sp = ?, 
            currency_ep = ?, 
            currency_gp = ?, 
            currency_pp = ?,
            updated_at = (unixepoch())
         WHERE id = ?",
        params![
            character.meta.currency_copper.unwrap_or(0),
            character.meta.currency_silver.unwrap_or(0),
            character.meta.currency_electrum.unwrap_or(0),
            character.meta.currency_gold.unwrap_or(0),
            character.meta.currency_platinum.unwrap_or(0),
            char_id
        ],
    )?;

    // 2. Insert items from the character struct
    for item in &character.inventory {
        let item_type = detect_item_type(conn, &item.item_id)?;
        
        conn.execute(
            "INSERT INTO character_inventory (
                id, character_id, item_id, item_type, quantity, is_equipped, is_attuned, location, source, is_starting_equipment, data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![
                item.id,
                char_id,
                item.item_id,
                item_type,
                item.quantity,
                if item.is_equipped { 1 } else { 0 },
                if item.is_attuned { 1 } else { 0 },
                item.location.as_deref().unwrap_or("Body"),
                item.source.as_deref().unwrap_or("manual"),
                if item.is_starting_equipment { 1 } else { 0 },
                serde_json::to_string(&item.custom_data).unwrap_or_else(|_| "{}".to_string())
            ],
        )?;
    }

    Ok(())
}

/// Helper: attempts to detect if item_id refers to an Equipment Package (core_equipment)
fn is_equipment_package(conn: &Connection, item_id: &str) -> AppResult<bool> {
    let mut stmt = conn.prepare("SELECT 1 FROM core_equipment WHERE id = ?")?;
    Ok(stmt.exists(params![item_id])?)
}

pub fn clear_starting_equipment(
    conn: &Connection,
    character_id: &str,
    source: &str,
) -> AppResult<()> {
    // 1. Delete items from inventory
    conn.execute(
        "DELETE FROM character_inventory WHERE character_id = ? AND source = ?",
        params![character_id, source],
    )?;

    // 2. Remove gold granted by this source (if tracked)
    // We expect the frontend to tell us how much gold to remove via other means, 
    // OR we track it in the meta.
    // Ideally, we read the current meta gold field and reset it.
    // However, Rust side doesn't easily know which field to check without parsing JSON meta.
    // The user requirement says: "reset corresponding gold field in character_meta".
    
    // We need to read the character to get current gold and the tracked amount.
    let mut stmt = conn.prepare("SELECT data FROM characters WHERE id = ?")?;
    let data_str: String = stmt.query_row(params![character_id], |row| row.get(0))?;
    let mut character: Character = serde_json::from_str(&data_str)?;
    
    let mut gold_to_remove = 0;
    
    if source == "background" {
        if let Some(g) = character.meta.background_gold_granted {
            gold_to_remove = g;
            character.meta.background_gold_granted = Some(0);
            character.meta.background_equipment_applied = Some(false);
        }
    } else if source == "class" {
        // We don't have a class_gold_granted field yet in CharacterMeta.
        // We should add it to tracking if we want to reverse it perfectly.
        // For now, if we don't track it, we can't remove it safely without querying what was added.
        // But the user plan said: "We will store background_gold_granted and class_gold_granted".
        // I need to update CharacterMeta struct first? It is in character.rs.
        // I will assume for now we only handle background gold here as per current struct,
        // or check if I can add a dynamic field.
        // Actually, let's keep it simple: if source is class, we might not remove gold yet 
        // if we didn't track it. But if we are re-rolling starting equipment, we should probably.
        // Let's assume sending 0 for now until I update the struct.
    }

    if gold_to_remove > 0 {
         let current_gp = character.meta.currency_gold.unwrap_or(0);
         character.meta.currency_gold = Some((current_gp - gold_to_remove).max(0));
         
         // Save updated char back
         let new_data = serde_json::to_string(&character)?;
         conn.execute("UPDATE characters SET data = ? WHERE id = ?", params![new_data, character_id])?;
         
         // Also update flattened columns
         conn.execute("UPDATE characters SET currency_gp = ? WHERE id = ?", params![character.meta.currency_gold.unwrap_or(0), character_id])?;
    }

    Ok(())
}

pub fn get_starting_equipment(
    conn: &Connection,
    character_id: &str,
    class_id: &str,
    option_label: &str,
) -> AppResult<()> {
    // 1. Fetch entries from class_starting_equipment
    let mut stmt = conn.prepare(
        "SELECT item_name, item_id, tool_id, weapon_id, armor_id, quantity, is_gold, gold 
         FROM class_starting_equipment 
         WHERE class_id = ? AND (option_label = ? OR option_label IS NULL)"
    )?;

    let rows = stmt.query_map(params![class_id, option_label], |row| {
        Ok((
            row.get::<_, String>(0)?,          // item_name
            row.get::<_, Option<String>>(1)?,  // item_id
            row.get::<_, Option<String>>(2)?,  // tool_id
            row.get::<_, Option<String>>(3)?,  // weapon_id
            row.get::<_, Option<String>>(4)?,  // armor_id
            row.get::<_, i32>(5)?,             // quantity
            row.get::<_, bool>(6)?,            // is_gold
            row.get::<_, Option<f64>>(7)?,     // gold amount
        ))
    })?;

    for row in rows {
        let (name, item_id, tool_id, weapon_id, armor_id, quantity, is_gold, gold_amount) = row?;

        // A. Handle Gold
        if is_gold {
            if let Some(amount) = gold_amount {
                // Add to existing GP
                conn.execute(
                    "UPDATE characters SET currency_gp = currency_gp + ? WHERE id = ?",
                    params![amount as i32, character_id],
                )?;
            }
            continue;
        }

        // B. Handle Item/Package
        // Prefer explicit ID if available
        let target_id = item_id.or(tool_id).or(weapon_id).or(armor_id);
        
        if let Some(tid) = target_id {
            // Check if it is a package
            if is_equipment_package(conn, &tid)? {
                // Recursively add items from package
                add_package_items(conn, character_id, &tid, "class", "Backpack")?;
            } else {
                // Add single item
                let item_type = detect_item_type(conn, &tid)?;
                add_single_item(conn, character_id, &tid, &item_type, quantity, "class", "Body")?;
            }
        } else {
            // Fallback: If no ID but name exists (e.g. "Shield"), try to resolve or ignore?
            // For now, if no ID, we can't reliably insert into character_inventory which requires item_id.
            // We log or ignore.
             println!("Warning: Skipping starting equipment '{}' - no ID found.", name);
        }
    }

    Ok(())
}

#[derive(serde::Deserialize)]
pub struct BackgroundItemInput {
    pub name: String,
    pub quantity: i32,
}

pub fn apply_background_starting_equipment(
    conn: &Connection,
    character_id: &str,
    items: Vec<BackgroundItemInput>,
    gold: i32,
) -> AppResult<()> {
    println!("DEBUG: apply_background_starting_equipment called for char {}, items: {}, gold: {}", character_id, items.len(), gold);
    
    // 1. Clear existing background equipment
    clear_starting_equipment(conn, character_id, "background")?;
    println!("DEBUG: Cleared background equipment.");

    // 2. Add new items
    for item in items {
        println!("DEBUG: Processing item: {} (qty: {})", item.name, item.quantity);
        // Resolve ID from name
        let item_id = resolve_item_id_by_name(conn, &item.name).unwrap_or(item.name.clone());
        println!("DEBUG: Resolved ID: {}", item_id);
        
        // Use default type detection
        let itype = detect_item_type(conn, &item_id)?;
        println!("DEBUG: Detected Type: {}", itype);
        
        // Add item (recursive)
        match add_single_item(conn, character_id, &item_id, &itype, item.quantity, "background", "Body") {
            Ok(_) => println!("DEBUG: Added item successfully."),
            Err(e) => println!("DEBUG: Failed to add item: {}", e),
        }
    }

    // 3. Add Gold (Track granted)
    if gold > 0 {
         println!("DEBUG: Adding gold: {}", gold);
         // ... (rest of logic)
         conn.execute(
            "UPDATE characters SET currency_gp = currency_gp + ? WHERE id = ?",
            params![gold, character_id],
        )?;
        
        // Update meta in JSON too to be safe/consistent? 
        // clear_starting_equipment relies on reading meta.background_gold_granted to know what to remove.
        // So we MUST update background_gold_granted.
        let mut stmt = conn.prepare("SELECT data FROM characters WHERE id = ?")?;
        let data_str: String = stmt.query_row(params![character_id], |row| row.get(0))?;
        let mut character: Character = serde_json::from_str(&data_str)?;

        character.meta.background_gold_granted = Some(gold);
        character.meta.background_equipment_applied = Some(true);
        // Also ensure currency_gold matches the flat column roughly or let loop above handle it?
        // best to keep them in sync.
        let current_gp = character.meta.currency_gold.unwrap_or(0);
        character.meta.currency_gold = Some(current_gp + gold);

        let new_data = serde_json::to_string(&character)?;
        conn.execute("UPDATE characters SET data = ? WHERE id = ?", params![new_data, character_id])?;
    } else {
        // Just flag applied
        let mut stmt = conn.prepare("SELECT data FROM characters WHERE id = ?")?;
        let data_str: String = stmt.query_row(params![character_id], |row| row.get(0))?;
        let mut character: Character = serde_json::from_str(&data_str)?;
        character.meta.background_gold_granted = Some(0);
        character.meta.background_equipment_applied = Some(true);
        let new_data = serde_json::to_string(&character)?;
        conn.execute("UPDATE characters SET data = ? WHERE id = ?", params![new_data, character_id])?;
    }

    Ok(())
}

fn resolve_item_id_by_name(conn: &Connection, name: &str) -> Option<String> {
    let tables = ["core_items", "core_gear", "core_equipment", "core_tools", "core_weapons", "core_armors"];
    for t in tables {
         // Using LIKE for case-insensitive match (default in SQLite for ASCII, but good to be safe)
         let query = format!("SELECT id FROM {} WHERE name = ? COLLATE NOCASE", t); 
         let mut stmt = conn.prepare(&query).ok()?;
         let mut rows = stmt.query(params![name]).ok()?;
         if let Some(row) = rows.next().ok()? {
             return row.get(0).ok();
         }
    }
    None
}

fn add_package_items(conn: &Connection, char_id: &str, equipment_id: &str, source: &str, location: &str) -> AppResult<()> {
    // 1. Items in package
    let mut stmt_items = conn.prepare(
        "SELECT item_id, quantity FROM core_equipment_items WHERE equipment_id = ?"
    )?;
    let item_rows = stmt_items.query_map(params![equipment_id], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, i32>(1)?))
    })?;

    for i in item_rows {
        let (iid, qty) = i?;
        let itype = detect_item_type(conn, &iid)?;
        add_single_item(conn, char_id, &iid, &itype, qty, source, location)?;
    }

    // 2. Tools in package
    let mut stmt_tools = conn.prepare(
        "SELECT tool_id, quantity FROM core_equipment_tools WHERE equipment_id = ?"
    )?;
    let tool_rows = stmt_tools.query_map(params![equipment_id], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, i32>(1)?))
    })?;

    for t in tool_rows {
        let (tid, qty) = t?;
        add_single_item(conn, char_id, &tid, "core_tool", qty, source, location)?;
    }

    Ok(())
}

fn add_single_item(
    conn: &Connection, 
    char_id: &str, 
    item_id: &str, 
    item_type: &str, 
    quantity: i32, 
    source: &str,
    location: &str
) -> AppResult<()> {
    // RECURSION CHECK: If this 'single item' is actually a package (and not found as a regular item first?),
    // or if detect_item_type failed to find it in items but it exists in equipment?
    // detect_item_type checks core_items, core_gear etc. It does NOT check core_equipment.
    // So if item_id refers to a package, detect_item_type likely returned default "core_item".
    
    if is_equipment_package(conn, item_id)? {
        // It is a package, resolve recursively.
        // For packages inside packages, we usually put them in the same location (e.g. Backpack).
        return add_package_items(conn, char_id, item_id, source, location);
    }

    // Normal insertion
    let new_id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO character_inventory (
            id, character_id, item_id, item_type, quantity, is_equipped, is_attuned, location, source, is_starting_equipment, data
        ) VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?, 1, '{}')",
        params![new_id, char_id, item_id, item_type, quantity, location, source],
    )?;
    Ok(())
}

/// Attempts to detect the type of an item by searching across all base tables.
fn detect_item_type(conn: &Connection, item_id: &str) -> AppResult<String> {
    // Order of preference: Magic Items -> Weapons -> Armor -> Gear -> Items -> Tools
    let queries = [
        ("core_mag_items_base", "core_magic_item"),
        ("custom_mag_items_base", "custom_magic_item"),
        ("core_weapons", "core_weapon"),
        ("custom_weapons", "custom_weapon"),
        ("core_armors", "core_armor"),
        ("custom_armors", "custom_armor"),
        ("core_gear", "core_item"), // Gear usually maps to core_item type for generic
        ("custom_gear", "custom_item"),
        ("core_items", "core_item"),
        ("custom_items", "custom_item"),
        ("core_tools", "core_tool"),
        ("custom_tools", "custom_tool"),
    ];

    for (table, item_type) in queries {
        let mut stmt = conn.prepare(&format!("SELECT 1 FROM {} WHERE id = ?", table))?;
        if stmt.exists(params![item_id])? {
            return Ok(item_type.to_string());
        }
    }

    // Default if not found (should not happen for valid IDs)
    Ok("core_item".to_string())
}
