use rusqlite::{Connection, params};
use serde_json::{json, Value};
use std::collections::HashMap;

fn normalize_id(name: &str) -> String {
    name.to_lowercase()
        .replace("ä", "ae")
        .replace("ö", "oe")
        .replace("ü", "ue")
        .replace("ß", "ss")
        .replace(" ", "_")
        .replace("-", "_")
        .chars()
        .filter(|c| c.is_alphanumeric() || *c == '_')
        .collect()
}

fn skill_name_to_id(name: &str) -> String {
    let mapping: HashMap<&str, &str> = [
        ("Athletik", "athletik"),
        ("Einschüchtern", "einschuechtern"),
        ("Mit Tieren umgehen", "mit-tieren-umgehen"),
        ("Naturkunde", "naturkunde"),
        ("Überlebenskunst", "ueberlebenskunst"),
        ("Wahrnehmung", "wahrnehmung"),
        ("Akrobatik", "akrobatik"),
        ("Geschichte", "geschichte"),
        ("Heimlichkeit", "heimlichkeit"),
        ("Motiv erkennen", "motiv-erkennen"),
        ("Religion", "religion"),
        ("Arkane Kunde", "arkane-kunde"),
        ("Heilkunde", "heilkunde"),
        ("Nachforschungen", "nachforschungen"),
        ("Täuschen", "taeuschen"),
        ("Überzeugen", "ueberzeugen"),
        ("Fingerfertigkeit", "fingerfertigkeit"),
    ]
    .iter()
    .cloned()
    .collect();
    
    mapping.get(name).map(|s| s.to_string()).unwrap_or_else(|| {
        normalize_id(name)
    })
}

fn attribute_name_to_id(name: &str) -> String {
    match name {
        "Stärke" => "str",
        "Geschicklichkeit" => "dex",
        "Konstitution" => "con",
        "Intelligenz" => "int",
        "Weisheit" => "wis",
        "Charisma" => "cha",
        _ => {
            let lower = name.to_lowercase();
            if lower.contains("stärke") || lower == "str" { "str" }
            else if lower.contains("geschick") || lower == "dex" { "dex" }
            else if lower.contains("konstitution") || lower == "con" { "con" }
            else if lower.contains("intelligenz") || lower == "int" { "int" }
            else if lower.contains("weisheit") || lower == "wis" { "wis" }
            else if lower.contains("charisma") || lower == "cha" { "cha" }
            else { "str" }
        }
    }.to_string()
}

fn parse_skills(choices_str: &str) -> (usize, Vec<String>) {
    if let Some(num_str) = choices_str.split("Wähle").next() {
        let num = num_str.trim().split_whitespace().next()
            .and_then(|s| s.parse::<usize>().ok())
            .unwrap_or(2);
        let skills_part = choices_str.split("aus:").last().unwrap_or("");
        let skills: Vec<String> = skills_part
            .split(",")
            .map(|s| skill_name_to_id(s.trim()))
            .filter(|s| !s.is_empty())
            .collect();
        (num, skills)
    } else {
        (2, vec![])
    }
}

struct StartingEquipmentItem {
    option_label: Option<String>,
    item_name: String,
    quantity: i32,
    is_gold: bool,
    gold_amount: Option<f64>,
}

struct ClassData {
    id: String,
    name: String,
    hit_die: i32,
    primary_attributes: Vec<String>,
    saving_throws: Vec<String>,
    skill_choices: (usize, Vec<String>),
    tool_proficiencies: Option<Value>,
    weapon_proficiencies: Value,
    armor_proficiencies: Value,
    multiclassing: Option<Value>,
    starting_equipment: Vec<StartingEquipmentItem>,
}

fn get_class_definitions() -> Vec<ClassData> {
    vec![
        // Barbar
        ClassData {
            id: normalize_id("Barbar"),
            name: "Barbar".to_string(),
            hit_die: 12,
            primary_attributes: vec!["str".to_string()],
            saving_throws: vec!["str".to_string(), "con".to_string()],
            skill_choices: (2, vec![
                "athletik".to_string(), "einschuechtern".to_string(),
                "mit-tieren-umgehen".to_string(), "naturkunde".to_string(),
                "ueberlebenskunst".to_string(), "wahrnehmung".to_string(),
            ]),
            tool_proficiencies: None,
            weapon_proficiencies: json!({
                "simple_weapons": true,
                "martial_weapons": true
            }),
            armor_proficiencies: json!({
                "light_armor": true,
                "medium_armor": true,
                "shields": true
            }),
            multiclassing: Some(json!({
                "prerequisites": [{"attribute": "str", "value": 13}]
            })),
            starting_equipment: vec![
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Zweihandaxt".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Beil".to_string(), quantity: 4, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Entdeckerausrüstung".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "GOLD".to_string(), quantity: 1, is_gold: true, gold_amount: Some(15.0) },
                StartingEquipmentItem { option_label: Some("B".to_string()), item_name: "GOLD".to_string(), quantity: 1, is_gold: true, gold_amount: Some(75.0) },
            ],
        },
        // Barde
        ClassData {
            id: normalize_id("Barde"),
            name: "Barde".to_string(),
            hit_die: 8,
            primary_attributes: vec!["cha".to_string()],
            saving_throws: vec!["dex".to_string(), "cha".to_string()],
            skill_choices: (3, vec![]),
            tool_proficiencies: Some(json!({
                "choose": {
                    "count": 3,
                    "from_category": ["musikinstrument"]
                }
            })),
            weapon_proficiencies: json!({
                "simple_weapons": true,
                "martial_weapons": false
            }),
            armor_proficiencies: json!({
                "light_armor": true
            }),
            multiclassing: Some(json!({
                "prerequisites": [{"attribute": "cha", "value": 13}]
            })),
            starting_equipment: vec![
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Lederrüstung".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Dolch".to_string(), quantity: 2, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Musikinstrument deiner Wahl".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Unterhaltungskünstler-Ausrüstung".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "GOLD".to_string(), quantity: 1, is_gold: true, gold_amount: Some(19.0) },
                StartingEquipmentItem { option_label: Some("B".to_string()), item_name: "GOLD".to_string(), quantity: 1, is_gold: true, gold_amount: Some(90.0) },
            ],
        },
        // Druide
        ClassData {
            id: normalize_id("Druide"),
            name: "Druide".to_string(),
            hit_die: 8,
            primary_attributes: vec!["wis".to_string()],
            saving_throws: vec!["int".to_string(), "wis".to_string()],
            skill_choices: (2, vec![
                "arkane-kunde".to_string(), "heilkunde".to_string(),
                "mit-tieren-umgehen".to_string(), "motiv-erkennen".to_string(),
                "naturkunde".to_string(), "religion".to_string(),
                "ueberlebenskunst".to_string(), "wahrnehmung".to_string(),
            ]),
            tool_proficiencies: Some(json!({
                "fixed": ["kraeuterkundeausruestung"]
            })),
            weapon_proficiencies: json!({
                "simple_weapons": true,
                "martial_weapons": false
            }),
            armor_proficiencies: json!({
                "light_armor": true,
                "shields": true
            }),
            multiclassing: Some(json!({
                "prerequisites": [{"attribute": "wis", "value": 13}]
            })),
            starting_equipment: vec![
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Lederrüstung".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Schild".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Sichel".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Druidischer Fokus (Kampfstab)".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Entdeckerausrüstung".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Kräuterkundeausrüstung".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "GOLD".to_string(), quantity: 1, is_gold: true, gold_amount: Some(9.0) },
                StartingEquipmentItem { option_label: Some("B".to_string()), item_name: "GOLD".to_string(), quantity: 1, is_gold: true, gold_amount: Some(50.0) },
            ],
        },
        // Hexenmeister
        ClassData {
            id: normalize_id("Hexenmeister"),
            name: "Hexenmeister".to_string(),
            hit_die: 8,
            primary_attributes: vec!["cha".to_string()],
            saving_throws: vec!["wis".to_string(), "cha".to_string()],
            skill_choices: (2, vec![
                "arkane-kunde".to_string(), "einschuechtern".to_string(),
                "geschichte".to_string(), "nachforschungen".to_string(),
                "naturkunde".to_string(), "religion".to_string(), "taeuschen".to_string(),
            ]),
            tool_proficiencies: None,
            weapon_proficiencies: json!({
                "simple_weapons": true,
                "martial_weapons": false
            }),
            armor_proficiencies: json!({
                "light_armor": true
            }),
            multiclassing: Some(json!({
                "prerequisites": [{"attribute": "cha", "value": 13}]
            })),
            starting_equipment: vec![
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Lederrüstung".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Sichel".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Dolch".to_string(), quantity: 2, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Arkaner Fokus (Kugel)".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Buch (okkulte Überlieferungen)".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Gelehrtenausrüstung".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "GOLD".to_string(), quantity: 1, is_gold: true, gold_amount: Some(15.0) },
                StartingEquipmentItem { option_label: Some("B".to_string()), item_name: "GOLD".to_string(), quantity: 1, is_gold: true, gold_amount: Some(100.0) },
            ],
        },
        // Kämpfer
        ClassData {
            id: normalize_id("Kämpfer"),
            name: "Kämpfer".to_string(),
            hit_die: 10,
            primary_attributes: vec!["str".to_string(), "dex".to_string()],
            saving_throws: vec!["str".to_string(), "con".to_string()],
            skill_choices: (2, vec![
                "akrobatik".to_string(), "athletik".to_string(),
                "einschuechtern".to_string(), "geschichte".to_string(),
                "mit-tieren-umgehen".to_string(), "motiv-erkennen".to_string(),
                "ueberlebenskunst".to_string(), "ueberzeugen".to_string(), "wahrnehmung".to_string(),
            ]),
            tool_proficiencies: None,
            weapon_proficiencies: json!({
                "simple_weapons": true,
                "martial_weapons": true
            }),
            armor_proficiencies: json!({
                "light_armor": true,
                "medium_armor": true,
                "heavy_armor": true,
                "shields": true
            }),
            multiclassing: Some(json!({
                "prerequisites": [{"attribute": "str", "value": 13}, {"attribute": "dex", "value": 13}]
            })),
            starting_equipment: vec![
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Kettenpanzer".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Zweihandschwert".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Flegel".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Wurfspeer".to_string(), quantity: 8, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Gewölbeforscherausrüstung".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "GOLD".to_string(), quantity: 1, is_gold: true, gold_amount: Some(4.0) },
                StartingEquipmentItem { option_label: Some("B".to_string()), item_name: "Beschlagene Lederrüstung".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("B".to_string()), item_name: "Krummsäbel".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("B".to_string()), item_name: "Kurzschwert".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("B".to_string()), item_name: "Langbogen".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("B".to_string()), item_name: "Pfeil".to_string(), quantity: 20, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("B".to_string()), item_name: "Köcher".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("B".to_string()), item_name: "Gewölbeforscherausrüstung".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("B".to_string()), item_name: "GOLD".to_string(), quantity: 1, is_gold: true, gold_amount: Some(11.0) },
                StartingEquipmentItem { option_label: Some("C".to_string()), item_name: "GOLD".to_string(), quantity: 1, is_gold: true, gold_amount: Some(155.0) },
            ],
        },
        // Kleriker
        ClassData {
            id: normalize_id("Kleriker"),
            name: "Kleriker".to_string(),
            hit_die: 8,
            primary_attributes: vec!["wis".to_string()],
            saving_throws: vec!["wis".to_string(), "cha".to_string()],
            skill_choices: (2, vec![
                "geschichte".to_string(), "heilkunde".to_string(),
                "motiv-erkennen".to_string(), "religion".to_string(), "ueberzeugen".to_string(),
            ]),
            tool_proficiencies: None,
            weapon_proficiencies: json!({
                "simple_weapons": true,
                "martial_weapons": false
            }),
            armor_proficiencies: json!({
                "light_armor": true,
                "medium_armor": true,
                "shields": true
            }),
            multiclassing: Some(json!({
                "prerequisites": [{"attribute": "wis", "value": 13}]
            })),
            starting_equipment: vec![
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Kettenhemd".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Schild".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Streitkolben".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Heiliges Symbol".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Priesterausrüstung".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "GOLD".to_string(), quantity: 1, is_gold: true, gold_amount: Some(7.0) },
                StartingEquipmentItem { option_label: Some("B".to_string()), item_name: "GOLD".to_string(), quantity: 1, is_gold: true, gold_amount: Some(110.0) },
            ],
        },
        // Magier
        ClassData {
            id: normalize_id("Magier"),
            name: "Magier".to_string(),
            hit_die: 6,
            primary_attributes: vec!["int".to_string()],
            saving_throws: vec!["int".to_string(), "wis".to_string()],
            skill_choices: (2, vec![
                "arkane-kunde".to_string(), "geschichte".to_string(),
                "heilkunde".to_string(), "motiv-erkennen".to_string(),
                "nachforschungen".to_string(), "naturkunde".to_string(), "religion".to_string(),
            ]),
            tool_proficiencies: None,
            weapon_proficiencies: json!({
                "simple_weapons": true,
                "martial_weapons": false
            }),
            armor_proficiencies: json!({}),
            multiclassing: Some(json!({
                "prerequisites": [{"attribute": "int", "value": 13}]
            })),
            starting_equipment: vec![
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Dolch".to_string(), quantity: 2, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Arkaner Fokus (Kampfstab)".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Robe".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Zauberbuch".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Gelehrtenausrüstung".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "GOLD".to_string(), quantity: 1, is_gold: true, gold_amount: Some(5.0) },
                StartingEquipmentItem { option_label: Some("B".to_string()), item_name: "GOLD".to_string(), quantity: 1, is_gold: true, gold_amount: Some(55.0) },
            ],
        },
        // Mönch
        ClassData {
            id: normalize_id("Mönch"),
            name: "Mönch".to_string(),
            hit_die: 8,
            primary_attributes: vec!["dex".to_string(), "wis".to_string()],
            saving_throws: vec!["str".to_string(), "dex".to_string()],
            skill_choices: (2, vec![
                "akrobatik".to_string(), "athletik".to_string(),
                "geschichte".to_string(), "heimlichkeit".to_string(),
                "motiv-erkennen".to_string(), "religion".to_string(),
            ]),
            tool_proficiencies: Some(json!({
                "choose": {
                    "count": 1,
                    "from_category": ["handwerkszeug", "musikinstrument"]
                }
            })),
            weapon_proficiencies: json!({
                "simple_weapons": true,
                "martial_weapons": true,
                "additional": ["light"]
            }),
            armor_proficiencies: json!({}),
            multiclassing: Some(json!({
                "prerequisites": [{"attribute": "dex", "value": 13}, {"attribute": "wis", "value": 13}]
            })),
            starting_equipment: vec![
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Speer".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Dolch".to_string(), quantity: 5, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Handwerkszeug oder Musikinstrument".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Entdeckerausrüstung".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "GOLD".to_string(), quantity: 1, is_gold: true, gold_amount: Some(11.0) },
                StartingEquipmentItem { option_label: Some("B".to_string()), item_name: "GOLD".to_string(), quantity: 1, is_gold: true, gold_amount: Some(50.0) },
            ],
        },
        // Paladin
        ClassData {
            id: normalize_id("Paladin"),
            name: "Paladin".to_string(),
            hit_die: 10,
            primary_attributes: vec!["str".to_string(), "cha".to_string()],
            saving_throws: vec!["wis".to_string(), "cha".to_string()],
            skill_choices: (2, vec![
                "athletik".to_string(), "einschuechtern".to_string(),
                "heilkunde".to_string(), "motiv-erkennen".to_string(),
                "religion".to_string(), "ueberzeugen".to_string(),
            ]),
            tool_proficiencies: None,
            weapon_proficiencies: json!({
                "simple_weapons": true,
                "martial_weapons": true
            }),
            armor_proficiencies: json!({
                "light_armor": true,
                "medium_armor": true,
                "heavy_armor": true,
                "shields": true
            }),
            multiclassing: Some(json!({
                "prerequisites": [{"attribute": "str", "value": 13}, {"attribute": "cha", "value": 13}]
            })),
            starting_equipment: vec![
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Kettenpanzer".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Schild".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Langschwert".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Wurfspeer".to_string(), quantity: 6, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Heiliges Symbol".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Priesterausrüstung".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "GOLD".to_string(), quantity: 1, is_gold: true, gold_amount: Some(9.0) },
                StartingEquipmentItem { option_label: Some("B".to_string()), item_name: "GOLD".to_string(), quantity: 1, is_gold: true, gold_amount: Some(150.0) },
            ],
        },
        // Schurke
        ClassData {
            id: normalize_id("Schurke"),
            name: "Schurke".to_string(),
            hit_die: 8,
            primary_attributes: vec!["dex".to_string()],
            saving_throws: vec!["dex".to_string(), "int".to_string()],
            skill_choices: (4, vec![
                "akrobatik".to_string(), "athletik".to_string(),
                "einschuechtern".to_string(), "fingerfertigkeit".to_string(),
                "heimlichkeit".to_string(), "motiv-erkennen".to_string(),
                "nachforschungen".to_string(), "taeuschen".to_string(),
                "ueberzeugen".to_string(), "wahrnehmung".to_string(),
            ]),
            tool_proficiencies: Some(json!({
                "fixed": ["diebeswerkzeug"]
            })),
            weapon_proficiencies: json!({
                "simple_weapons": true,
                "martial_weapons": true,
                "additional": ["light", "finesse"]
            }),
            armor_proficiencies: json!({
                "light_armor": true
            }),
            multiclassing: Some(json!({
                "prerequisites": [{"attribute": "dex", "value": 13}]
            })),
            starting_equipment: vec![
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Lederrüstung".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Dolch".to_string(), quantity: 2, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Kurzschwert".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Kurzbogen".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Pfeil".to_string(), quantity: 20, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Köcher".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Diebeswerkzeug".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Einbrecherausrüstung".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "GOLD".to_string(), quantity: 1, is_gold: true, gold_amount: Some(8.0) },
                StartingEquipmentItem { option_label: Some("B".to_string()), item_name: "GOLD".to_string(), quantity: 1, is_gold: true, gold_amount: Some(100.0) },
            ],
        },
        // Waldläufer
        ClassData {
            id: normalize_id("Waldläufer"),
            name: "Waldläufer".to_string(),
            hit_die: 10,
            primary_attributes: vec!["dex".to_string(), "wis".to_string()],
            saving_throws: vec!["str".to_string(), "dex".to_string()],
            skill_choices: (3, vec![
                "athletik".to_string(), "heimlichkeit".to_string(),
                "mit-tieren-umgehen".to_string(), "motiv-erkennen".to_string(),
                "nachforschungen".to_string(), "naturkunde".to_string(),
                "ueberlebenskunst".to_string(), "wahrnehmung".to_string(),
            ]),
            tool_proficiencies: None,
            weapon_proficiencies: json!({
                "simple_weapons": true,
                "martial_weapons": true
            }),
            armor_proficiencies: json!({
                "light_armor": true,
                "medium_armor": true,
                "shields": true
            }),
            multiclassing: Some(json!({
                "prerequisites": [{"attribute": "dex", "value": 13}, {"attribute": "wis", "value": 13}]
            })),
            starting_equipment: vec![
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Beschlagene Lederrüstung".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Krummsäbel".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Kurzschwert".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Langbogen".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Pfeil".to_string(), quantity: 20, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Köcher".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Druidischer Fokus (Mistelzweig)".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Entdeckerausrüstung".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "GOLD".to_string(), quantity: 1, is_gold: true, gold_amount: Some(7.0) },
                StartingEquipmentItem { option_label: Some("B".to_string()), item_name: "GOLD".to_string(), quantity: 1, is_gold: true, gold_amount: Some(150.0) },
            ],
        },
        // Zauberer
        ClassData {
            id: normalize_id("Zauberer"),
            name: "Zauberer".to_string(),
            hit_die: 6,
            primary_attributes: vec!["cha".to_string()],
            saving_throws: vec!["con".to_string(), "cha".to_string()],
            skill_choices: (2, vec![
                "arkane-kunde".to_string(), "einschuechtern".to_string(),
                "motiv-erkennen".to_string(), "religion".to_string(),
                "taeuschen".to_string(), "ueberzeugen".to_string(),
            ]),
            tool_proficiencies: None,
            weapon_proficiencies: json!({
                "simple_weapons": true,
                "martial_weapons": false
            }),
            armor_proficiencies: json!({}),
            multiclassing: Some(json!({
                "prerequisites": [{"attribute": "cha", "value": 13}]
            })),
            starting_equipment: vec![
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Speer".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Dolch".to_string(), quantity: 2, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Arkaner Fokus (Kristall)".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "Gewölbeforscherausrüstung".to_string(), quantity: 1, is_gold: false, gold_amount: None },
                StartingEquipmentItem { option_label: Some("A".to_string()), item_name: "GOLD".to_string(), quantity: 1, is_gold: true, gold_amount: Some(28.0) },
                StartingEquipmentItem { option_label: Some("B".to_string()), item_name: "GOLD".to_string(), quantity: 1, is_gold: true, gold_amount: Some(50.0) },
            ],
        },
    ]
}

fn find_item_id(conn: &Connection, item_name: &str) -> Option<String> {
    let normalized = normalize_id(item_name);
    let query = "SELECT id FROM core_items WHERE LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(name, 'ä', 'ae'), 'ö', 'oe'), 'ü', 'ue'), 'ß', 'ss'), ' ', '_')) = ? OR id = ? LIMIT 1";
    if let Ok(mut stmt) = conn.prepare(query) {
        if let Ok(row) = stmt.query_row(params![normalized, normalized], |r| Ok(r.get::<_, String>(0)?)) {
            return Some(row);
        }
    }
    None
}

fn find_weapon_id(conn: &Connection, weapon_name: &str) -> Option<String> {
    let normalized = normalize_id(weapon_name);
    let query = "SELECT id FROM core_weapons WHERE LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(name, 'ä', 'ae'), 'ö', 'oe'), 'ü', 'ue'), 'ß', 'ss'), ' ', '_')) = ? OR id = ? LIMIT 1";
    if let Ok(mut stmt) = conn.prepare(query) {
        if let Ok(row) = stmt.query_row(params![normalized, normalized], |r| Ok(r.get::<_, String>(0)?)) {
            return Some(row);
        }
    }
    None
}

fn find_armor_id(conn: &Connection, armor_name: &str) -> Option<String> {
    let normalized = normalize_id(armor_name);
    let query = "SELECT id FROM core_armors WHERE LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(name, 'ä', 'ae'), 'ö', 'oe'), 'ü', 'ue'), 'ß', 'ss'), ' ', '_')) = ? OR id = ? LIMIT 1";
    if let Ok(mut stmt) = conn.prepare(query) {
        if let Ok(row) = stmt.query_row(params![normalized, normalized], |r| Ok(r.get::<_, String>(0)?)) {
            return Some(row);
        }
    }
    None
}

fn find_tool_id(conn: &Connection, tool_name: &str) -> Option<String> {
    let normalized = normalize_id(tool_name);
    let query = "SELECT id FROM core_tools WHERE LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(name, 'ä', 'ae'), 'ö', 'oe'), 'ü', 'ue'), 'ß', 'ss'), ' ', '_')) = ? OR id = ? LIMIT 1";
    if let Ok(mut stmt) = conn.prepare(query) {
        if let Ok(row) = stmt.query_row(params![normalized, normalized], |r| Ok(r.get::<_, String>(0)?)) {
            return Some(row);
        }
    }
    None
}

fn main() {
    let db_paths = vec![
        "../dnd-nexus.db",  // Root-Datenbank (Haupt-DB)
        "../../dnd-nexus.db",
        "dnd-nexus.db",
    ];
    
    let mut db_path = None;
    for path in &db_paths {
        if std::path::Path::new(path).exists() {
            db_path = Some(path.to_string());
            println!("✓ Datenbank gefunden: {}\n", path);
            break;
        }
    }
    
    let db_path = db_path.expect("Datenbank nicht gefunden in: dnd-nexus.db, ../dnd-nexus.db, ../../dnd-nexus.db");
    let conn = Connection::open(db_path)
        .expect("Konnte Datenbank nicht öffnen");

    let classes = get_class_definitions();
    
    println!("Importiere {} Klassen...", classes.len());
    
    for class in classes {
        println!("Verarbeite Klasse: {}", class.name);
        
        // Lade vorhandene Daten, um Subklassen und features_by_level zu behalten
        let existing_data: Option<Value> = conn.query_row(
            "SELECT data FROM core_classes WHERE id = ?",
            params![class.id],
            |row| {
                let data_str: String = row.get(0)?;
                let data: Value = serde_json::from_str(&data_str).unwrap_or(Value::Object(serde_json::Map::new()));
                Ok(Some(data))
            }
        ).ok().flatten();
        
        let mut class_data_json = json!({
            "hit_die": class.hit_die,
            "primary_attributes": class.primary_attributes,
            "saving_throws": class.saving_throws,
            "skill_choices": {
                "choose": class.skill_choices.0,
                "from": class.skill_choices.1
            },
            "tool_proficiencies": class.tool_proficiencies,
            "weapon_proficiencies": class.weapon_proficiencies,
            "armor_proficiencies": class.armor_proficiencies,
            "multiclassing": class.multiclassing,
        });
        
        // Füge vorhandene Daten hinzu, falls vorhanden (subclasses, features_by_level)
        if let Some(existing) = existing_data {
            if let Some(subclasses) = existing.get("subclasses") {
                class_data_json["subclasses"] = subclasses.clone();
            }
            if let Some(features_by_level) = existing.get("features_by_level") {
                class_data_json["features_by_level"] = features_by_level.clone();
            }
        }
        
        let class_data_str = serde_json::to_string(&class_data_json)
            .expect("Konnte JSON nicht serialisieren");
        
        let rows_affected = conn.execute(
            "UPDATE core_classes SET data = ? WHERE id = ?",
            params![class_data_str, class.id]
        ).expect("Konnte Klasse nicht updaten");
        
        if rows_affected == 0 {
            conn.execute(
                "INSERT INTO core_classes (id, name, data) VALUES (?, ?, ?)",
                params![class.id, class.name, class_data_str]
            ).expect("Konnte Klasse nicht einfügen");
            println!("  → Neue Klasse {} eingefügt", class.name);
        }
        
        println!("  → Klasse {} aktualisiert", class.name);
        
        let equipment_count = class.starting_equipment.len();
        for item in class.starting_equipment {
            let mut item_id: Option<String> = None;
            let mut weapon_id: Option<String> = None;
            let mut armor_id: Option<String> = None;
            let mut tool_id: Option<String> = None;
            
            if item.is_gold {
                item_id = None;
            } else {
                if let Some(id) = find_weapon_id(&conn, &item.item_name) {
                    weapon_id = Some(id);
                } else if let Some(id) = find_armor_id(&conn, &item.item_name) {
                    armor_id = Some(id);
                } else if let Some(id) = find_tool_id(&conn, &item.item_name) {
                    tool_id = Some(id);
                } else if let Some(id) = find_item_id(&conn, &item.item_name) {
                    item_id = Some(id);
                }
            }
            
            conn.execute(
                "INSERT INTO class_starting_equipment (class_id, is_custom, option_label, item_name, item_id, weapon_id, armor_id, tool_id, quantity, is_gold, gold) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                params![
                    class.id,
                    false,  // Core-Klassen sind nicht custom
                    item.option_label,
                    item.item_name,
                    item_id,
                    weapon_id,
                    armor_id,
                    tool_id,
                    item.quantity,
                    item.is_gold,
                    item.gold_amount
                ]
            ).expect("Konnte Starting Equipment nicht einfügen");
        }
        
        println!("  → {} Starting Equipment Einträge hinzugefügt", equipment_count);
    }
    
    println!("\nFertig! Alle Klassen wurden importiert.");
}
