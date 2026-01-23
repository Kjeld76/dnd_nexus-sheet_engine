use rusqlite::{params, Connection};
use crate::types::character::Character;
use crate::error::AppResult;

/// Synchronizes character attributes, health, and death saves with the characters table.
pub fn sync_stats(conn: &Connection, character: &Character) -> AppResult<()> {
    let char_id = character.id.to_string();

    conn.execute(
        "UPDATE characters SET 
            attr_str = ?, attr_dex = ?, attr_con = ?, 
            attr_int = ?, attr_wis = ?, attr_cha = ?,
            hp_current = ?, hp_max = ?, hp_temp = ?,
            hit_dice_max = ?, hit_dice_used = ?,
            death_saves_successes = ?, death_saves_failures = ?,
            updated_at = (unixepoch())
         WHERE id = ?",
        params![
            character.attributes.str,
            character.attributes.dex,
            character.attributes.con,
            character.attributes.int,
            character.attributes.wis,
            character.attributes.cha,
            character.health.current,
            character.health.max,
            character.health.temp,
            character.health.hit_dice_max,
            character.health.hit_dice_used,
            character.health.death_saves.successes,
            character.health.death_saves.failures,
            char_id
        ],
    )?;

    Ok(())
}
