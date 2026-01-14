use rusqlite::{params, Connection};
use serde_json::json;
use std::path::Path;

fn slugify(text: &str) -> String {
    text.to_lowercase()
        .replace("ä", "ae")
        .replace("ö", "oe")
        .replace("ü", "ue")
        .replace("ß", "ss")
        .replace(|c: char| !c.is_alphanumeric(), "_")
        .trim_matches('_')
        .to_string()
}

fn parse_cost(cost_str: &str) -> f64 {
    let re = regex::Regex::new(r"(\d+(?:,\d+)?)\s*(GM|SM|KM|EM|PM)").unwrap();
    if let Some(caps) = re.captures(cost_str) {
        let value = caps[1].replace(',', ".").parse::<f64>().unwrap_or(0.0);
        let unit = caps[2].to_uppercase();
        match unit.as_str() {
            "GM" => value,
            "SM" => value / 10.0,
            "KM" => value / 100.0,
            "EM" => value / 2.0,
            "PM" => value * 10.0,
            _ => value,
        }
    } else {
        // Fallback: Versuche direkte Zahl
        cost_str.replace(',', ".").parse::<f64>().unwrap_or(0.0)
    }
}

fn parse_weight(weight_str: &str) -> f64 {
    let re = regex::Regex::new(r"(\d+(?:,\d+)?)\s*(kg|g)").unwrap();
    if let Some(caps) = re.captures(weight_str) {
        let value = caps[1].replace(',', ".").parse::<f64>().unwrap_or(0.0);
        let unit = caps[2].to_lowercase();
        if unit == "g" {
            value / 1000.0
        } else {
            value
        }
    } else {
        weight_str.replace(',', ".").parse::<f64>().unwrap_or(0.0)
    }
}

struct ArmorPropertyData {
    property_id: String,
    parameter_value: Option<String>,
}

struct ArmorData {
    id: String,
    name: String,
    category: String,
    base_ac: Option<i32>,
    ac_bonus: i32,
    ac_formula: Option<String>,
    strength_requirement: Option<i32>,
    stealth_disadvantage: bool,
    don_time_minutes: i32,
    doff_time_minutes: i32,
    weight_kg: f64,
    cost_gp: f64,
    properties: Vec<ArmorPropertyData>,
    data: serde_json::Value,
}

fn main() {
    println!("--- Rüstungen Import ---");

    let possible_paths = [
        "dnd-nexus.db",
        "../dnd-nexus.db",
        "../../dnd-nexus.db",
    ];

    let mut db_path = None;
    for path in possible_paths {
        if Path::new(path).exists() {
            db_path = Some(path.to_string());
            break;
        }
    }

    let db_path = match db_path {
        Some(p) => p,
        None => {
            eprintln!("FEHLER: Datenbank existiert nicht!");
            return;
        }
    };

    println!("Nutze Datenbank: {}", db_path);
    let mut conn = Connection::open(db_path).expect("Konnte Datenbank nicht öffnen");

    let raw_armors = vec![
        // Leichte Rüstung (1 Min. An/Ablegen)
        ("Gepolsterte Rüstung", "11 + GES", None, 0, Some("11 + DEX"), None, true, 1, 1, "4 kg", "5 GM", "leichte_ruestung"),
        ("Lederrüstung", "11 + GES", None, 0, Some("11 + DEX"), None, false, 1, 1, "5 kg", "10 GM", "leichte_ruestung"),
        ("Beschlagene Lederrüstung", "12 + GES", None, 0, Some("12 + DEX"), None, false, 1, 1, "6,5 kg", "45 GM", "leichte_ruestung"),
        
        // Mittelschwere Rüstung (5 Min. An / 1 Min. Ab)
        ("Fellrüstung", "12 + GES (max. 2)", None, 0, Some("12 + DEX (max. 2)"), None, false, 5, 1, "6 kg", "10 GM", "mittelschwere_ruestung"),
        ("Kettenhemd", "13 + GES (max. 2)", None, 0, Some("13 + DEX (max. 2)"), None, false, 5, 1, "10 kg", "50 GM", "mittelschwere_ruestung"),
        ("Schuppenpanzer", "14 + GES (max. 2)", None, 0, Some("14 + DEX (max. 2)"), None, true, 5, 1, "22,5 kg", "50 GM", "mittelschwere_ruestung"),
        ("Brustplatte", "14 + GES (max. 2)", None, 0, Some("14 + DEX (max. 2)"), None, false, 5, 1, "10 kg", "400 GM", "mittelschwere_ruestung"),
        ("Plattenpanzer", "15 + GES (max. 2)", None, 0, Some("15 + DEX (max. 2)"), None, true, 5, 1, "20 kg", "750 GM", "mittelschwere_ruestung"),
        
        // Schwere Rüstung (10 Min. An / 5 Min. Ab)
        ("Ringpanzer", "14", Some(14), 0, Some("14"), None, true, 10, 5, "20 kg", "30 GM", "schwere_ruestung"),
        ("Kettenpanzer", "16", Some(16), 0, Some("16"), Some(13), true, 10, 5, "27,5 kg", "75 GM", "schwere_ruestung"),
        ("Schienenpanzer", "17", Some(17), 0, Some("17"), Some(15), true, 10, 5, "30 kg", "200 GM", "schwere_ruestung"),
        ("Ritterrüstung", "18", Some(18), 0, Some("18"), Some(15), true, 10, 5, "32,5 kg", "1.500 GM", "schwere_ruestung"),
        
        // Schild (1 Aktion = 0 Min, aber wir speichern 0 für "1 Aktion")
        ("Schild", "+2", None, 2, Some("+2"), None, false, 0, 0, "3 kg", "10 GM", "schild"),
    ];

    let mut armors_to_import: Vec<ArmorData> = Vec::new();

    for (name, _ac_str, base_ac, ac_bonus, ac_formula, strength_req, stealth_disadv, don_time, doff_time, weight_str, cost_str, category) in raw_armors {
        let id = slugify(name);
        let mut properties: Vec<ArmorPropertyData> = Vec::new();
        let mut data_json = json!({ "source_page": 219 });

        // Properties basierend auf Rüstungstyp
        if let Some(strength) = strength_req {
            properties.push(ArmorPropertyData {
                property_id: "schwer".to_string(),
                parameter_value: Some(json!({ "strength_requirement": strength }).to_string()),
            });
        }

        if stealth_disadv {
            properties.push(ArmorPropertyData {
                property_id: "stealth_nachteil".to_string(),
                parameter_value: None,
            });
        }

        // DEX-Bonus-Info für data JSON
        if ac_formula.as_ref().map(|s| s.contains("DEX")).unwrap_or(false) {
            let max_dex = if ac_formula.as_ref().map(|s| s.contains("max. 2")).unwrap_or(false) {
                Some(2)
            } else {
                None
            };
            data_json["dex_bonus"] = json!({
                "apply": true,
                "max": max_dex
            });
        } else {
            data_json["dex_bonus"] = json!({
                "apply": false,
                "max": null
            });
        }

        armors_to_import.push(ArmorData {
            id,
            name: name.to_string(),
            category: category.to_string(),
            base_ac,
            ac_bonus,
            ac_formula: ac_formula.map(|s| s.to_string()),
            strength_requirement: strength_req,
            stealth_disadvantage: stealth_disadv,
            don_time_minutes: don_time,
            doff_time_minutes: doff_time,
            weight_kg: parse_weight(weight_str),
            cost_gp: parse_cost(cost_str),
            properties,
            data: data_json,
        });
    }

    import_armors(&mut conn, &armors_to_import).expect("Failed to import armors");

    println!("\n✅ {} Rüstungen importiert", armors_to_import.len());
}

fn import_armors(conn: &mut Connection, armors: &[ArmorData]) -> Result<(), rusqlite::Error> {
    let tx = conn.transaction()?;

    tx.execute("DELETE FROM armor_property_mappings WHERE armor_id IN (SELECT id FROM core_armors)", params![])?;
    tx.execute("DELETE FROM core_armors", params![])?;

    for armor in armors {
        println!("   • {} ({})", armor.name, armor.id);
        tx.execute(
            "INSERT INTO core_armors (id, name, category, base_ac, ac_bonus, ac_formula, strength_requirement, stealth_disadvantage, don_time_minutes, doff_time_minutes, weight_kg, cost_gp, data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())",
            params![
                armor.id,
                armor.name,
                armor.category,
                armor.base_ac,
                armor.ac_bonus,
                armor.ac_formula,
                armor.strength_requirement,
                armor.stealth_disadvantage,
                armor.don_time_minutes,
                armor.doff_time_minutes,
                armor.weight_kg,
                armor.cost_gp,
                armor.data.to_string(),
            ],
        )?;

        for prop in &armor.properties {
            tx.execute(
                "INSERT INTO armor_property_mappings (armor_id, property_id, parameter_value) VALUES (?, ?, ?)",
                params![
                    armor.id,
                    prop.property_id,
                    prop.parameter_value,
                ],
            )?;
        }
    }

    tx.commit()?;
    Ok(())
}
