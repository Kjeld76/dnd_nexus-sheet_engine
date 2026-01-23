use rusqlite::{params, Connection};
use crate::types::character::Character;
use crate::error::AppResult;
use uuid::Uuid;

/// Synchronizes character proficiencies and features with the database.
pub fn sync_features(conn: &Connection, character: &Character) -> AppResult<()> {
    let char_id = character.id.to_string();

    // 1. Clear existing proficiencies and features
    conn.execute(
        "DELETE FROM character_proficiencies WHERE character_id = ?",
        params![char_id],
    )?;
    conn.execute(
        "DELETE FROM character_features WHERE character_id = ?",
        params![char_id],
    )?;

    // 2. Sync Proficiencies
    let profs = &character.proficiencies;
    
    // Skills
    for skill in &profs.skills {
        insert_proficiency(conn, &char_id, "skill", skill)?;
    }
    // Saving Throws
    for st in &profs.saving_throws {
        insert_proficiency(conn, &char_id, "saving_throw", st)?;
    }
    // Weapons
    for weapon in &profs.weapons {
        insert_proficiency(conn, &char_id, "weapon", weapon)?;
    }
    // Armor
    for armor in &profs.armor {
        insert_proficiency(conn, &char_id, "armor", armor)?;
    }
    // Tools
    for tool in &profs.tools {
        insert_proficiency(conn, &char_id, "tool", tool)?;
    }
    // Languages
    for lang in &profs.languages {
        insert_proficiency(conn, &char_id, "language", lang)?;
    }

    // 3. Sync Features/Feats
    for feat_id in &character.feats {
        conn.execute(
            "INSERT INTO character_features (id, character_id, feature_id, created_at, updated_at)
             VALUES (?, ?, ?, (unixepoch()), (unixepoch()))",
            params![
                Uuid::new_v4().to_string(),
                char_id,
                feat_id
            ],
        )?;
    }

    Ok(())
}

fn insert_proficiency(conn: &Connection, char_id: &str, p_type: &str, ref_id: &str) -> AppResult<()> {
    conn.execute(
        "INSERT INTO character_proficiencies (id, character_id, type, ref_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, (unixepoch()), (unixepoch()))",
        params![
            Uuid::new_v4().to_string(),
            char_id,
            p_type,
            ref_id
        ],
    )?;
    Ok(())
}
