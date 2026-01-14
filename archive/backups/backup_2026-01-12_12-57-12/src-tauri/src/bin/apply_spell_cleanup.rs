use rusqlite::Connection;
use serde_json::Value;
use std::fs;
use std::path::Path;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("--- Spell Cleanup Importer ---");

    let possible_db_paths = [
        "dnd-nexus.db",
        "../dnd-nexus.db",
        "../../dnd-nexus.db",
        "sync.db",
        "../sync.db",
        "C:/Users/mario/.cursor/projects/dnd_nexus/dnd-nexus.db",
    ];
    
    let mut db_path = None;
    for path in possible_db_paths {
        if Path::new(path).exists() {
            db_path = Some(path.to_string());
            break;
        }
    }

    let db_path = match db_path {
        Some(p) => p,
        None => {
            return Err("Database not found in any expected location".into());
        }
    };

    let json_path = "../tools/intermediate_data/cleaned_spells.json";
    let alternative_json_paths = [
        "tools/intermediate_data/cleaned_spells.json",
        "../tools/intermediate_data/cleaned_spells.json",
        "C:/Users/mario/.cursor/projects/dnd_nexus/tools/intermediate_data/cleaned_spells.json",
    ];

    let mut json_path_found = None;
    if Path::new(json_path).exists() {
        json_path_found = Some(json_path.to_string());
    } else {
        for path in alternative_json_paths {
            if Path::new(path).exists() {
                json_path_found = Some(path.to_string());
                break;
            }
        }
    }

    let json_path = match json_path_found {
        Some(p) => p,
        None => {
            return Err("JSON data not found in any expected location".into());
        }
    };

    println!("Current dir: {:?}", std::env::current_dir()?);
    println!("Using DB: {}", db_path);
    println!("Using JSON: {}", json_path);

    let conn = Connection::open(&db_path)?;
    let json_content = fs::read_to_string(&json_path)?;
    let spells: Value = serde_json::from_str(&json_content)?;

    let spells_array = spells.as_array().ok_or("Expected array of spells")?;

    println!("Updating {} spells...", spells_array.len());

    let mut stmt = conn.prepare("
        UPDATE core_spells SET 
            level = ?,
            school = ?,
            casting_time = ?,
            range = ?,
            components = ?,
            material_components = ?,
            duration = ?,
            concentration = ?,
            ritual = ?,
            description = ?,
            higher_levels = ?,
            classes = ?,
            data = ?
        WHERE id = ? OR name = ?
    ")?;

    for spell in spells_array {
        let id = spell["id"].as_str().unwrap_or("");
        let name = spell["name"].as_str().unwrap_or("");
        let level = spell["level"].as_i64().unwrap_or(0);
        let school = spell["school"].as_str().unwrap_or("");
        let casting_time = spell["casting_time"].as_str().unwrap_or("");
        let range = spell["range"].as_str().unwrap_or("");
        let components = spell["components"].as_str().unwrap_or("");
        let material_components = spell["material_components"].as_str();
        let duration = spell["duration"].as_str().unwrap_or("");
        let concentration = if spell["concentration"].as_bool().unwrap_or(false) { 1 } else { 0 };
        let ritual = if spell["ritual"].as_bool().unwrap_or(false) { 1 } else { 0 };
        let description = spell["description"].as_str().unwrap_or("");
        let higher_levels = spell["higher_levels"].as_str().unwrap_or("");
        let classes = spell["classes"].as_str().unwrap_or("");
        let data = serde_json::to_string(&spell["data"])?;

        stmt.execute(rusqlite::params![
            level,
            school,
            casting_time,
            range,
            components,
            material_components,
            duration,
            concentration,
            ritual,
            description,
            higher_levels,
            classes,
            data,
            id,
            name
        ])?;
    }

    // Cleanup artifacts
    conn.execute("DELETE FROM core_spells WHERE id = 'ii'", [])?;
    conn.execute("DELETE FROM core_spells WHERE id LIKE 'sturm-iu-bewahren%'", [])?;

    println!("Done!");
    Ok(())
}

