use rusqlite::{params, Connection};
use crate::types::character::Character;
use crate::error::AppResult;

/// Synchronizes the character_spells table and spell slot columns with the Character struct.
pub fn sync_spells(conn: &Connection, character: &Character) -> AppResult<()> {
    let char_id = character.id.to_string();

    // 1. Clear existing spells for this character
    conn.execute(
        "DELETE FROM character_spells WHERE character_id = ?",
        params![char_id],
    )?;

    // 2. Update spell slots in characters table
    conn.execute(
        "UPDATE characters SET 
            spell_slots_1 = ?, spell_slots_2 = ?, spell_slots_3 = ?, 
            spell_slots_4 = ?, spell_slots_5 = ?, spell_slots_6 = ?, 
            spell_slots_7 = ?, spell_slots_8 = ?, spell_slots_9 = ?,
            spell_slots_used_1 = ?, spell_slots_used_2 = ?, spell_slots_used_3 = ?, 
            spell_slots_used_4 = ?, spell_slots_used_5 = ?, spell_slots_used_6 = ?, 
            spell_slots_used_7 = ?, spell_slots_used_8 = ?, spell_slots_used_9 = ?,
            updated_at = (unixepoch())
         WHERE id = ?",
        params![
            character.meta.spell_slots_1,
            character.meta.spell_slots_2,
            character.meta.spell_slots_3,
            character.meta.spell_slots_4,
            character.meta.spell_slots_5,
            character.meta.spell_slots_6,
            character.meta.spell_slots_7,
            character.meta.spell_slots_8,
            character.meta.spell_slots_9,
            character.meta.spell_slots_used_1,
            character.meta.spell_slots_used_2,
            character.meta.spell_slots_used_3,
            character.meta.spell_slots_used_4,
            character.meta.spell_slots_used_5,
            character.meta.spell_slots_used_6,
            character.meta.spell_slots_used_7,
            character.meta.spell_slots_used_8,
            character.meta.spell_slots_used_9,
            char_id
        ],
    )?;

    // 3. Insert spells from the character struct
    for spell in &character.spells {
        conn.execute(
            "INSERT INTO character_spells (
                id, character_id, spell_id, is_prepared, is_always_prepared, source
            ) VALUES (?, ?, ?, ?, ?, ?)",
            params![
                spell.id,
                char_id,
                spell.spell_id,
                if spell.is_prepared { 1 } else { 0 },
                if spell.is_always_prepared { 1 } else { 0 },
                spell.source,
            ],
        )?;
    }

    Ok(())
}
