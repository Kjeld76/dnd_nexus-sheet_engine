use rusqlite::{params, Connection};
use serde_json::Value;
use std::fs;

#[path = "../db/migrations.rs"]
mod migrations;

fn slugify(text: &str) -> String {
    text.to_lowercase()
        .replace("ä", "ae")
        .replace("ö", "oe")
        .replace("ü", "ue")
        .replace("ß", "ss")
        .chars()
        .map(|c| if c.is_alphanumeric() { c } else { '_' })
        .collect::<String>()
        .split('_')
        .filter(|s| !s.is_empty())
        .collect::<Vec<_>>()
        .join("_")
}

fn parse_price(price_str: &str) -> f64 {
    let cleaned = price_str
        .replace("GM", "")
        .replace("SM", "")
        .replace("KM", "")
        .replace(" ", "")
        .replace(",", ".");
    
    let num: f64 = cleaned.parse().unwrap_or(0.0);
    
    if price_str.contains("SM") {
        num * 0.1
    } else if price_str.contains("KM") {
        num * 0.01
    } else {
        num
    }
}

fn parse_weight(weight_str: Option<&str>) -> f64 {
    if let Some(weight) = weight_str {
        let cleaned = weight
            .replace("kg", "")
            .replace(" ", "")
            .replace(",", ".");
        cleaned.parse().unwrap_or(0.0)
    } else {
        0.0
    }
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = std::env::args().collect();
    let default_path = "tools.json".to_string();
    let json_path = args.get(1).unwrap_or(&default_path);
    
    println!("🔄 Importiere Werkzeuge...");
    
    let db_path = "../dnd-nexus.db";
    let conn = Connection::open(db_path)?;
    
    // Führe Migrationen aus (stellt sicher, dass alle Tabellen existieren)
    println!("🔧 Führe Migrationen aus...");
    migrations::run_migrations(&conn)?;
    
    // Lösche alle vorhandenen Tools
    println!("🗑️  Lösche vorhandene Tools...");
    conn.execute("DELETE FROM core_tools", [])?;
    
    // Lade JSON-Daten
    let json_content = fs::read_to_string(json_path)?;
    let json: Value = serde_json::from_str(&json_content)?;
    
    let werkzeuge = json["werkzeuge"].as_array().ok_or("werkzeuge muss ein Array sein")?;
    
    let mut insert_stmt = conn.prepare(
        "INSERT INTO core_tools (id, name, category, cost_gp, weight_kg, data, created_at)
         VALUES (?, ?, ?, ?, ?, ?, unixepoch())"
    )?;
    
    let mut imported_count = 0;
    
    for tool in werkzeuge {
        let name = tool["name"].as_str().ok_or("name fehlt")?;
        let kategorie = tool["kategorie"].as_str().ok_or("kategorie fehlt")?;
        let preis = tool["preis"].as_str().ok_or("preis fehlt")?;
        let attribut = tool["attribut"].as_str();
        let gewicht = tool["gewicht"].as_str();
        
        let base_id = slugify(name);
        let cost = parse_price(preis);
        let weight = parse_weight(gewicht);
        
        let mut data = serde_json::Map::new();
        if let Some(attr) = attribut {
            data.insert("attribute".to_string(), Value::String(attr.to_string()));
        }
        
        if let Some(verwenden) = tool["verwenden"].as_array() {
            let verwenden_vec: Vec<Value> = verwenden.to_vec();
            data.insert("verwenden".to_string(), Value::Array(verwenden_vec));
        } else {
            data.insert("verwenden".to_string(), Value::Array(vec![]));
        }
        
        if let Some(herstellen) = tool["herstellen"].as_array() {
            let herstellen_vec: Vec<Value> = herstellen.to_vec();
            data.insert("herstellen".to_string(), Value::Array(herstellen_vec));
        } else {
            data.insert("herstellen".to_string(), Value::Array(vec![]));
        }
        
        let data_json = serde_json::to_string(&Value::Object(data))?;
        
        insert_stmt.execute(params![
            base_id,
            name,
            kategorie,
            cost,
            weight,
            data_json
        ])?;
        
        imported_count += 1;
        println!("✅ {} ({})", name, kategorie);
        
        // Varianten importieren
        if let Some(varianten) = tool["varianten"].as_array() {
            for variante in varianten {
                let variant_name = variante["name"].as_str().ok_or("variant name fehlt")?;
                let variant_preis = variante["preis"].as_str().ok_or("variant preis fehlt")?;
                let variant_gewicht = variante["gewicht"].as_str();
                
                let variant_id = slugify(&format!("{}_{}", name, variant_name));
                let variant_cost = parse_price(variant_preis);
                let variant_weight = parse_weight(variant_gewicht.or(gewicht));
                
                let mut variant_data = serde_json::Map::new();
                if let Some(attr) = attribut {
                    variant_data.insert("attribute".to_string(), Value::String(attr.to_string()));
                }
                
                if let Some(verwenden) = tool["verwenden"].as_array() {
                    let verwenden_vec: Vec<Value> = verwenden.to_vec();
                    variant_data.insert("verwenden".to_string(), Value::Array(verwenden_vec));
                } else {
                    variant_data.insert("verwenden".to_string(), Value::Array(vec![]));
                }
                
                if let Some(herstellen) = tool["herstellen"].as_array() {
                    let herstellen_vec: Vec<Value> = herstellen.to_vec();
                    variant_data.insert("herstellen".to_string(), Value::Array(herstellen_vec));
                } else {
                    variant_data.insert("herstellen".to_string(), Value::Array(vec![]));
                }
                
                variant_data.insert("variant_of".to_string(), Value::String(name.to_string()));
                variant_data.insert("variant_name".to_string(), Value::String(variant_name.to_string()));
                
                let variant_data_json = serde_json::to_string(&Value::Object(variant_data))?;
                
                insert_stmt.execute(params![
                    variant_id,
                    &format!("{} ({})", name, variant_name),
                    kategorie,
                    variant_cost,
                    variant_weight,
                    variant_data_json
                ])?;
                
                imported_count += 1;
                println!("  ✅ Variante: {}", variant_name);
            }
        }
    }
    
    println!("\n✨ Import abgeschlossen: {} Werkzeuge importiert", imported_count);
    
    Ok(())
}
