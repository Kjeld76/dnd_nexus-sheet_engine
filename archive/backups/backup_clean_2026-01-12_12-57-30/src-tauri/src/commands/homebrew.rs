use tauri::State;
use crate::db::Database;
use crate::types::spell::CustomSpell;
use crate::types::weapons::CustomWeapon;
use crate::types::compendium::{CustomArmor, CustomItem};
use uuid::Uuid;
use rusqlite::params;

#[tauri::command]
pub async fn upsert_custom_spell(
    db: State<'_, Database>,
    spell: CustomSpell,
) -> Result<String, String> {
    let conn = db.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    
    let id = spell.id.clone().unwrap_or_else(|| Uuid::new_v4().to_string());
    let is_homebrew = spell.is_homebrew.unwrap_or(spell.parent_id.is_none());
    let data_json = serde_json::to_string(&spell.data).map_err(|e: serde_json::Error| e.to_string())?;
    
    conn.execute(
        "INSERT INTO custom_spells (
            id, name, level, school, casting_time, range, components, 
            material_components, duration, concentration, ritual, 
            description, higher_levels, classes, data, parent_id, is_homebrew, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, unixepoch())
        ON CONFLICT(id) DO UPDATE SET
            name=?2, level=?3, school=?4, casting_time=?5, range=?6, components=?7,
            material_components=?8, duration=?9, concentration=?10, ritual=?11,
            description=?12, higher_levels=?13, classes=?14, data=?15, is_homebrew=?17, updated_at=unixepoch()",
        params![
            id, spell.name, spell.level, spell.school, spell.casting_time,
            spell.range, spell.components, spell.material_components,
            spell.duration, spell.concentration, spell.ritual,
            spell.description, spell.higher_levels, spell.classes,
            data_json, spell.parent_id, is_homebrew
        ],
    ).map_err(|e: rusqlite::Error| e.to_string())?;
    
    Ok(id)
}

#[tauri::command]
pub async fn upsert_custom_weapon(
    db: State<'_, Database>,
    weapon: CustomWeapon,
) -> Result<String, String> {
    let conn = db.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    let id = weapon.id.clone().unwrap_or_else(|| Uuid::new_v4().to_string());
    let is_homebrew = weapon.is_homebrew.unwrap_or(weapon.parent_id.is_none());
    let data_json = serde_json::to_string(&weapon.data).map_err(|e: serde_json::Error| e.to_string())?;

    conn.execute(
        "        INSERT INTO custom_weapons (
            id, name, category, mastery_id, damage_dice, damage_type,
            weight_kg, cost_gp, data, parent_id, is_homebrew, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, unixepoch())
        ON CONFLICT(id) DO UPDATE SET
            name=?2, category=?3, mastery_id=?4, damage_dice=?5, damage_type=?6,
            weight_kg=?7, cost_gp=?8, data=?9, is_homebrew=?11, updated_at=unixepoch()",
        params![
            id, weapon.name, weapon.category, weapon.mastery_id,
            weapon.damage_dice, weapon.damage_type, weapon.weight_kg,
            weapon.cost_gp, data_json, weapon.parent_id, is_homebrew
        ],
    ).map_err(|e: rusqlite::Error| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub async fn upsert_custom_armor(
    db: State<'_, Database>,
    armor: CustomArmor,
) -> Result<String, String> {
    let conn = db.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    let id = armor.id.clone().unwrap_or_else(|| Uuid::new_v4().to_string());
    let is_homebrew = armor.is_homebrew.unwrap_or(armor.parent_id.is_none());
    let data_json = serde_json::to_string(&armor.data).map_err(|e: serde_json::Error| e.to_string())?;

    conn.execute(
        "INSERT INTO custom_armors (
            id, name, category, base_ac, strength_requirement, stealth_disadvantage,
            weight_kg, cost_gp, data, parent_id, is_homebrew, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, unixepoch())
        ON CONFLICT(id) DO UPDATE SET
            name=?2, category=?3, base_ac=?4, strength_requirement=?5, 
            stealth_disadvantage=?6, weight_kg=?7, cost_gp=?8, data=?9, is_homebrew=?11, updated_at=unixepoch()",
        params![
            id, armor.name, armor.category, armor.base_ac,
            armor.strength_requirement, armor.stealth_disadvantage,
            armor.weight_kg, armor.cost_gp, data_json, armor.parent_id, is_homebrew
        ],
    ).map_err(|e: rusqlite::Error| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub async fn upsert_custom_item(
    db: State<'_, Database>,
    item: CustomItem,
) -> Result<String, String> {
    let conn = db.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    let id = item.id.clone().unwrap_or_else(|| Uuid::new_v4().to_string());
    let is_homebrew = item.is_homebrew.unwrap_or(item.parent_id.is_none());
    let data_json = serde_json::to_string(&item.data).map_err(|e: serde_json::Error| e.to_string())?;
    
    let table = match item.item_type.as_str() {
        "gear" => "custom_gear",
        "tool" => "custom_tools",
        _ => return Err("Invalid item type".to_string()),
    };

    let sql = format!(
        "INSERT INTO {} (id, name, description, cost_gp, weight_kg, data, parent_id, is_homebrew, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, unixepoch())
         ON CONFLICT(id) DO UPDATE SET
            name=?2, description=?3, cost_gp=?4, weight_kg=?5, data=?6, is_homebrew=?8, updated_at=unixepoch()",
        table
    );

    conn.execute(
        &sql,
        params![
            id, item.name, item.description, item.cost_gp,
            item.weight_kg, data_json, item.parent_id, is_homebrew
        ],
    ).map_err(|e: rusqlite::Error| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub async fn delete_custom_entry(
    db: State<'_, Database>,
    id: String,
    table_type: String,
) -> Result<(), String> {
    let conn = db.0.lock().map_err(|e| format!("Lock error: {}", e))?;
    let table = match table_type.as_str() {
        "spell" => "custom_spells",
        "weapon" => "custom_weapons",
        "armor" => "custom_armors",
        "gear" => "custom_gear",
        "tool" => "custom_tools",
        "feat" => "custom_feats",
        "species" => "custom_species",
        "class" => "custom_classes",
        _ => return Err("Invalid table type".to_string()),
    };

    let sql = format!("DELETE FROM {} WHERE id = ?", table);
    conn.execute(&sql, params![id]).map_err(|e: rusqlite::Error| e.to_string())?;
    
    Ok(())
}


