use tauri::State;
use crate::db::Database;
use crate::core::types::{CustomSpell, Spell};
use uuid::Uuid;
use rusqlite::params;

#[tauri::command]
pub async fn create_custom_spell(
    db: State<'_, Database>,
    mut spell: CustomSpell,
) -> Result<CustomSpell, String> {
    let conn = db.0.lock().unwrap();
    
    let id = spell.id.clone().unwrap_or_else(|| Uuid::new_v4().to_string());
    spell.id = Some(id.clone());
    
    let is_homebrew = spell.parent_spell_id.is_none();
    
    conn.execute(
        "INSERT INTO custom_spells (id, name, level, school, data, parent_id, is_homebrew) 
         VALUES (?, ?, ?, ?, ?, ?, ?)",
        params![
            id,
            spell.name,
            spell.level,
            spell.school,
            spell.data,
            spell.parent_spell_id,
            is_homebrew
        ],
    ).map_err(|e| e.to_string())?;
    
    Ok(spell)
}

#[tauri::command]
pub async fn update_custom_spell(
    db: State<'_, Database>,
    id: String,
    spell: CustomSpell,
) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    
    conn.execute(
        "UPDATE custom_spells SET name = ?, level = ?, school = ?, data = ?, updated_at = (unixepoch()) 
         WHERE id = ?",
        params![spell.name, spell.level, spell.school, spell.data, id],
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn delete_custom_spell(
    db: State<'_, Database>,
    id: String,
) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    
    conn.execute("DELETE FROM custom_spells WHERE id = ?", params![id])
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
pub async fn restore_core_spell(
    db: State<'_, Database>,
    spell_id: String,
) -> Result<(), String> {
    let conn = db.0.lock().unwrap();
    
    conn.execute("DELETE FROM custom_spells WHERE parent_id = ?", params![spell_id])
        .map_err(|e| e.to_string())?;
    
    Ok(())
}


