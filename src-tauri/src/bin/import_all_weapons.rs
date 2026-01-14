use rusqlite::{params, Connection};
use std::path::Path;
use serde_json::json;

struct WeaponData {
    name: &'static str,
    damage_dice: &'static str,
    damage_type: &'static str,
    props: &'static str,
    mastery: &'static str,
    weight_kg: f64,
    cost_gp: f64,
    category: &'static str,
    weapon_type: &'static str,
}

fn slugify(text: &str) -> String {
    text.to_lowercase()
        .replace('ä', "ae")
        .replace('ö', "oe")
        .replace('ü', "ue")
        .replace('ß', "ss")
        .replace(|c: char| !c.is_alphanumeric(), "_")
        .trim_matches('_')
        .to_string()
}

fn parse_properties(props_str: &str) -> Vec<(String, Option<String>)> {
    let mut results = Vec::new();
    let parts: Vec<&str> = props_str.split(',').map(|s| s.trim()).collect();
    
    // Compile regexes once outside the loop for performance
    let versatile_regex = regex::Regex::new(r"Vielseitig\s*\((\d+W\d+)\)")
        .unwrap();
    let thrown_regex = regex::Regex::new(r"Wurfwaffe\s*\(Reichweite\s*(\d+(?:,\d+)?)\/(\d+(?:,\d+)?)\)")
        .unwrap();
    let ammunition_regex = regex::Regex::new(r"Geschosse\s*\(Reichweite\s*(\d+(?:,\d+)?)\/(\d+(?:,\d+)?)(?:,\s*([^)]+))?\)")
        .unwrap();
    
    for part in parts {
        if part.is_empty() {
            continue;
        }
        
        // Vielseitig (1W8)
        if let Some(caps) = versatile_regex
            .captures(part)
        {
            let damage = caps.get(1).unwrap().as_str();
            results.push(("vielseitig".to_string(), Some(json!({"damage": damage}).to_string())));
            continue;
        }
        
        // Wurfwaffe (Reichweite 6/18)
        if let Some(caps) = thrown_regex
            .captures(part)
        {
            let normal = caps.get(1).unwrap().as_str().replace(',', ".").parse::<f64>().unwrap_or(0.0);
            let max = caps.get(2).unwrap().as_str().replace(',', ".").parse::<f64>().unwrap_or(0.0);
            results.push(("wurfwaffe".to_string(), Some(json!({"normal": normal, "max": max, "unit": "m"}).to_string())));
            continue;
        }
        
        // Geschosse (Reichweite 24/96, Pfeil)
        if let Some(caps) = ammunition_regex
            .captures(part)
        {
            let normal = caps.get(1).unwrap().as_str().replace(',', ".").parse::<f64>().unwrap_or(0.0);
            let max = caps.get(2).unwrap().as_str().replace(',', ".").parse::<f64>().unwrap_or(0.0);
            let ammo_type = caps.get(3).map(|m| m.as_str().trim().to_lowercase()).unwrap_or_else(|| "pfeil".to_string());
            results.push(("geschosse".to_string(), Some(json!({"ammo_type": ammo_type, "normal": normal, "max": max, "unit": "m"}).to_string())));
            continue;
        }
        
        // Einfache Properties ohne Parameter
        let simple_props = vec![
            ("Finesse", "finesse"),
            ("Leicht", "leicht"),
            ("Schwer", "schwer"),
            ("Weitreichend", "weitreichend"),
            ("Zweihändig", "zweihaendig"),
            ("Laden", "laden"),
        ];
        
        for (de, id) in simple_props {
            if part.contains(de) {
                results.push((id.to_string(), None));
                break;
            }
        }
    }
    
    results
}

fn mastery_to_id(mastery: &str) -> &'static str {
    match mastery {
        "Plagen" => "plagen",
        "Einkerben" => "einkerben",
        "Umstoßen" => "umstossen",
        "Verlangsamen" => "verlangsamen",
        "Auslaugen" => "auslaugen",
        "Stoßen" => "stossen",
        "Streifen" => "streifen",
        "Spalten" => "spalten",
        _ => "",
    }
}

fn category_to_db(category: &str, weapon_type: &str) -> &'static str {
    match (category, weapon_type) {
        ("Einfache Waffen", "Nahkampf") => "simple_melee",
        ("Einfache Waffen", "Fernkampf") => "simple_ranged",
        ("Kriegswaffen", "Nahkampf") => "martial_melee",
        ("Kriegswaffen", "Fernkampf") => "martial_ranged",
        _ => "simple_melee",
    }
}

fn main() {
    println!("--- Waffen Import ---");

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

    let weapons = get_weapons_data();
    
    match import_weapons(&mut conn, &weapons) {
        Ok(_) => println!("\n✅ {} Waffen importiert", weapons.len()),
        Err(e) => eprintln!("❌ Fehler beim Import: {}", e),
    }
}

fn get_weapons_data() -> Vec<WeaponData> {
    vec![
        // Einfache Nahkampf
        WeaponData { name: "Beil", damage_dice: "1W6", damage_type: "hieb", props: "Leicht, Wurfwaffe (Reichweite 6/18)", mastery: "Plagen", weight_kg: 1.0, cost_gp: 5.0, category: "Einfache Waffen", weapon_type: "Nahkampf" },
        WeaponData { name: "Dolch", damage_dice: "1W4", damage_type: "stich", props: "Finesse, Leicht, Wurfwaffe (Reichweite 6/18)", mastery: "Einkerben", weight_kg: 0.5, cost_gp: 2.0, category: "Einfache Waffen", weapon_type: "Nahkampf" },
        WeaponData { name: "Kampfstab", damage_dice: "1W6", damage_type: "wucht", props: "Vielseitig (1W8)", mastery: "Umstoßen", weight_kg: 2.0, cost_gp: 0.2, category: "Einfache Waffen", weapon_type: "Nahkampf" },
        WeaponData { name: "Knüppel", damage_dice: "1W4", damage_type: "wucht", props: "Leicht", mastery: "Verlangsamen", weight_kg: 1.0, cost_gp: 0.1, category: "Einfache Waffen", weapon_type: "Nahkampf" },
        WeaponData { name: "Leichter Hammer", damage_dice: "1W4", damage_type: "wucht", props: "Leicht, Wurfwaffe (Reichweite 6/18)", mastery: "Einkerben", weight_kg: 1.0, cost_gp: 2.0, category: "Einfache Waffen", weapon_type: "Nahkampf" },
        WeaponData { name: "Sichel", damage_dice: "1W4", damage_type: "hieb", props: "Leicht", mastery: "Einkerben", weight_kg: 1.0, cost_gp: 1.0, category: "Einfache Waffen", weapon_type: "Nahkampf" },
        WeaponData { name: "Speer", damage_dice: "1W6", damage_type: "stich", props: "Vielseitig (1W8), Wurfwaffe (Reichweite 6/18)", mastery: "Auslaugen", weight_kg: 1.5, cost_gp: 1.0, category: "Einfache Waffen", weapon_type: "Nahkampf" },
        WeaponData { name: "Streitkolben", damage_dice: "1W6", damage_type: "wucht", props: "", mastery: "Auslaugen", weight_kg: 2.0, cost_gp: 5.0, category: "Einfache Waffen", weapon_type: "Nahkampf" },
        WeaponData { name: "Wurfspeer", damage_dice: "1W6", damage_type: "stich", props: "Wurfwaffe (Reichweite 9/36)", mastery: "Verlangsamen", weight_kg: 1.0, cost_gp: 0.5, category: "Einfache Waffen", weapon_type: "Nahkampf" },
        WeaponData { name: "Zweihandknüppel", damage_dice: "1W8", damage_type: "wucht", props: "Zweihändig", mastery: "Stoßen", weight_kg: 5.0, cost_gp: 0.2, category: "Einfache Waffen", weapon_type: "Nahkampf" },
        
        // Einfache Fernkampf
        WeaponData { name: "Kurzbogen", damage_dice: "1W6", damage_type: "stich", props: "Geschosse (Reichweite 24/96, Pfeil), Zweihändig", mastery: "Plagen", weight_kg: 1.0, cost_gp: 25.0, category: "Einfache Waffen", weapon_type: "Fernkampf" },
        WeaponData { name: "Leichte Armbrust", damage_dice: "1W8", damage_type: "stich", props: "Geschosse (Reichweite 24/96, Bolzen), Laden, Zweihändig", mastery: "Verlangsamen", weight_kg: 2.5, cost_gp: 25.0, category: "Einfache Waffen", weapon_type: "Fernkampf" },
        WeaponData { name: "Schleuder", damage_dice: "1W4", damage_type: "wucht", props: "Geschosse (Reichweite 9/36, Kugel)", mastery: "Verlangsamen", weight_kg: 0.0, cost_gp: 0.1, category: "Einfache Waffen", weapon_type: "Fernkampf" },
        WeaponData { name: "Wurfpfeil", damage_dice: "1W4", damage_type: "stich", props: "Finesse, Wurfwaffe (Reichweite 6/18)", mastery: "Plagen", weight_kg: 0.125, cost_gp: 0.05, category: "Einfache Waffen", weapon_type: "Fernkampf" },
        
        // Kriegswaffen Nahkampf
        WeaponData { name: "Dreizack", damage_dice: "1W8", damage_type: "stich", props: "Vielseitig (1W10), Wurfwaffe (Reichweite 6/18)", mastery: "Umstoßen", weight_kg: 2.0, cost_gp: 5.0, category: "Kriegswaffen", weapon_type: "Nahkampf" },
        WeaponData { name: "Flegel", damage_dice: "1W8", damage_type: "wucht", props: "", mastery: "Auslaugen", weight_kg: 1.0, cost_gp: 10.0, category: "Kriegswaffen", weapon_type: "Nahkampf" },
        WeaponData { name: "Glefe", damage_dice: "1W10", damage_type: "hieb", props: "Schwer, Weitreichend, Zweihändig", mastery: "Streifen", weight_kg: 3.0, cost_gp: 20.0, category: "Kriegswaffen", weapon_type: "Nahkampf" },
        WeaponData { name: "Hellebarde", damage_dice: "1W10", damage_type: "hieb", props: "Schwer, Weitreichend, Zweihändig", mastery: "Spalten", weight_kg: 3.0, cost_gp: 20.0, category: "Kriegswaffen", weapon_type: "Nahkampf" },
        WeaponData { name: "Kriegshammer", damage_dice: "1W8", damage_type: "wucht", props: "Vielseitig (1W10)", mastery: "Stoßen", weight_kg: 2.5, cost_gp: 15.0, category: "Kriegswaffen", weapon_type: "Nahkampf" },
        WeaponData { name: "Kriegspicke", damage_dice: "1W8", damage_type: "stich", props: "Vielseitig (1W10)", mastery: "Auslaugen", weight_kg: 1.0, cost_gp: 5.0, category: "Kriegswaffen", weapon_type: "Nahkampf" },
        WeaponData { name: "Krummsäbel", damage_dice: "1W6", damage_type: "hieb", props: "Finesse, Leicht", mastery: "Einkerben", weight_kg: 1.5, cost_gp: 25.0, category: "Kriegswaffen", weapon_type: "Nahkampf" },
        WeaponData { name: "Kurzschwert", damage_dice: "1W6", damage_type: "stich", props: "Finesse, Leicht", mastery: "Plagen", weight_kg: 1.0, cost_gp: 10.0, category: "Kriegswaffen", weapon_type: "Nahkampf" },
        WeaponData { name: "Langschwert", damage_dice: "1W8", damage_type: "hieb", props: "Vielseitig (1W10)", mastery: "Auslaugen", weight_kg: 1.5, cost_gp: 15.0, category: "Kriegswaffen", weapon_type: "Nahkampf" },
        WeaponData { name: "Lanze", damage_dice: "1W10", damage_type: "stich", props: "Schwer, Weitreichend, Zweihändig", mastery: "Umstoßen", weight_kg: 3.0, cost_gp: 10.0, category: "Kriegswaffen", weapon_type: "Nahkampf" },
        WeaponData { name: "Morgenstern", damage_dice: "1W8", damage_type: "stich", props: "", mastery: "Auslaugen", weight_kg: 2.0, cost_gp: 15.0, category: "Kriegswaffen", weapon_type: "Nahkampf" },
        WeaponData { name: "Peitsche", damage_dice: "1W4", damage_type: "hieb", props: "Finesse, Weitreichend", mastery: "Verlangsamen", weight_kg: 1.5, cost_gp: 2.0, category: "Kriegswaffen", weapon_type: "Nahkampf" },
        WeaponData { name: "Pike", damage_dice: "1W10", damage_type: "stich", props: "Schwer, Weitreichend, Zweihändig", mastery: "Stoßen", weight_kg: 9.0, cost_gp: 5.0, category: "Kriegswaffen", weapon_type: "Nahkampf" },
        WeaponData { name: "Rapier", damage_dice: "1W8", damage_type: "stich", props: "Finesse", mastery: "Plagen", weight_kg: 1.0, cost_gp: 25.0, category: "Kriegswaffen", weapon_type: "Nahkampf" },
        WeaponData { name: "Streitaxt", damage_dice: "1W8", damage_type: "hieb", props: "Vielseitig (1W10)", mastery: "Umstoßen", weight_kg: 2.0, cost_gp: 10.0, category: "Kriegswaffen", weapon_type: "Nahkampf" },
        WeaponData { name: "Zweihandaxt", damage_dice: "1W12", damage_type: "hieb", props: "Schwer, Zweihändig", mastery: "Spalten", weight_kg: 3.5, cost_gp: 30.0, category: "Kriegswaffen", weapon_type: "Nahkampf" },
        WeaponData { name: "Zweihandhammer", damage_dice: "2W6", damage_type: "wucht", props: "Schwer, Zweihändig", mastery: "Umstoßen", weight_kg: 5.0, cost_gp: 10.0, category: "Kriegswaffen", weapon_type: "Nahkampf" },
        WeaponData { name: "Zweihandschwert", damage_dice: "2W6", damage_type: "hieb", props: "Schwer, Zweihändig", mastery: "Streifen", weight_kg: 3.0, cost_gp: 50.0, category: "Kriegswaffen", weapon_type: "Nahkampf" },
        
        // Kriegswaffen Fernkampf
        WeaponData { name: "Blasrohr", damage_dice: "1", damage_type: "stich", props: "Geschosse (Reichweite 7,5/30, Blasrohrpfeil), Laden", mastery: "Plagen", weight_kg: 0.5, cost_gp: 10.0, category: "Kriegswaffen", weapon_type: "Fernkampf" },
        WeaponData { name: "Handarmbrust", damage_dice: "1W6", damage_type: "stich", props: "Geschosse (Reichweite 9/36, Bolzen), Leicht, Laden", mastery: "Plagen", weight_kg: 1.5, cost_gp: 75.0, category: "Kriegswaffen", weapon_type: "Fernkampf" },
        WeaponData { name: "Langbogen", damage_dice: "1W8", damage_type: "stich", props: "Geschosse (Reichweite 45/180, Pfeil), Schwer, Zweihändig", mastery: "Verlangsamen", weight_kg: 1.0, cost_gp: 50.0, category: "Kriegswaffen", weapon_type: "Fernkampf" },
        WeaponData { name: "Muskete", damage_dice: "1W12", damage_type: "stich", props: "Geschosse (Reichweite 12/36, Kugel), Laden, Zweihändig", mastery: "Verlangsamen", weight_kg: 5.0, cost_gp: 500.0, category: "Kriegswaffen", weapon_type: "Fernkampf" },
        WeaponData { name: "Pistole", damage_dice: "1W10", damage_type: "stich", props: "Geschosse (Reichweite 9/27, Kugel), Laden", mastery: "Plagen", weight_kg: 1.5, cost_gp: 250.0, category: "Kriegswaffen", weapon_type: "Fernkampf" },
        WeaponData { name: "Schwere Armbrust", damage_dice: "1W10", damage_type: "stich", props: "Geschosse (Reichweite 30/120, Bolzen), Laden, Schwer, Zweihändig", mastery: "Stoßen", weight_kg: 9.0, cost_gp: 50.0, category: "Kriegswaffen", weapon_type: "Fernkampf" },
    ]
}

fn import_weapons(conn: &mut Connection, weapons: &[WeaponData]) -> Result<(), rusqlite::Error> {
    let tx = conn.transaction()?;
    
    {
        let mut weapon_stmt = tx.prepare(
            "INSERT OR REPLACE INTO core_weapons (
                id, name, category, weapon_type, mastery_id, damage_dice, damage_type, weight_kg, cost_gp, data, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())"
        )?;
        
        let mut prop_stmt = tx.prepare(
            "INSERT OR REPLACE INTO weapon_property_mappings (
                weapon_id, property_id, parameter_value
            ) VALUES (?, ?, ?)"
        )?;
        
        for weapon in weapons {
            let id = slugify(weapon.name);
            let category = category_to_db(weapon.category, weapon.weapon_type);
            let mastery_id = mastery_to_id(weapon.mastery);
            let data_json = json!({"source_page": 213}).to_string();
            
            weapon_stmt.execute(params![
                id,
                weapon.name,
                category,
                weapon.weapon_type,  // DEPRECATED, aber noch NOT NULL
                mastery_id,
                weapon.damage_dice,
                weapon.damage_type,
                weapon.weight_kg,
                weapon.cost_gp,
                data_json
            ])?;
            
            let properties = parse_properties(weapon.props);
            for (prop_id, param_value) in properties {
                prop_stmt.execute(params![id, prop_id, param_value])?;
            }
            
            println!("   • {} ({})", weapon.name, id);
        }
    }
    
    tx.commit()?;
    Ok(())
}
