use rusqlite::{params, Connection};
use crate::types::character::Character;
use crate::error::AppResult;
// use uuid::Uuid; - Removed unused import

/// Synchronizes character modifiers with the database.
pub fn sync_modifiers(conn: &Connection, character: &Character) -> AppResult<()> {
    let char_id = character.id.to_string();

    // 1. Clear existing modifiers
    conn.execute(
        "DELETE FROM character_modifiers WHERE character_id = ?",
        params![char_id],
    )?;

    // 2. Sync Modifiers
    for modifier in &character.modifiers {
        let modifier_type = match modifier.modifier_type {
            crate::core::types::ModifierType::Override => "Override",
            crate::core::types::ModifierType::Add => "Add",
            crate::core::types::ModifierType::Multiply => "Multiply",
        };

        conn.execute(
            "INSERT INTO character_modifiers (
                id, character_id, source, target, 
                modifier_type, value, condition, 
                created_at, updated_at
             ) VALUES (?, ?, ?, ?, ?, ?, ?, (unixepoch()), (unixepoch()))",
            params![
                modifier.id,
                char_id,
                modifier.source,
                modifier.target,
                modifier_type,
                modifier.value,
                modifier.condition,
            ],
        )?;
    }

    Ok(())
}
