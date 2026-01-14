use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Species {
    pub id: String,
    pub name: String,
    pub data: Value,
    pub source: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Class {
    pub id: String,
    pub name: String,
    pub data: Value,
    pub source: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Gear {
    pub id: String,
    pub name: String,
    pub description: String,
    pub cost_gp: f64,
    pub weight_kg: f64,
    pub data: Value,
    pub source: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Tool {
    pub id: String,
    pub name: String,
    pub category: String,
    pub cost_gp: f64,
    pub weight_kg: f64,
    pub data: Value,
    pub source: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Feat {
    pub id: String,
    pub name: String,
    pub category: String,
    pub data: Value,
    pub source: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Skill {
    pub id: String,
    pub name: String,
    pub ability: String,
    pub description: String,
    pub source: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Background {
    pub id: String,
    pub name: String,
    pub data: Value,
    pub source: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Armor {
    pub id: String,
    pub name: String,
    pub category: String,
    pub base_ac: Option<i32>,  // NULL für Formeln
    pub ac_bonus: i32,  // Für Schilde (+2)
    pub ac_formula: Option<String>,  // z.B. "11 + DEX", "12 + DEX (max. 2)", "14"
    pub strength_requirement: Option<i32>,  // BEHALTEN (Legacy)
    pub stealth_disadvantage: bool,  // BEHALTEN (Legacy)
    pub don_time_minutes: Option<i32>,  // Anlegezeit in Minuten
    pub doff_time_minutes: Option<i32>,  // Ablegezeit in Minuten
    pub weight_kg: f64,
    pub cost_gp: f64,
    pub properties: Vec<ArmorProperty>,  // NEU: Properties via Mapping-Tabelle
    pub data: Value,
    pub source: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArmorProperty {
    pub id: String,
    pub name: String,
    pub description: String,
    pub affects_field: Option<String>,  // z.B. "strength_requirement", "stealth_disadvantage", "ac_bonus"
    pub parameter_value: Option<Value>,  // JSON für komplexe Parameter
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CustomItem {
    pub id: Option<String>,
    pub name: String,
    pub description: String,
    pub cost_gp: f64,
    pub weight_kg: f64,
    pub data: Value,
    pub parent_id: Option<String>,
    pub item_type: String,
    pub is_homebrew: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CustomArmor {
    pub id: Option<String>,
    pub name: String,
    pub category: String,
    pub base_ac: Option<i32>,  // NULL für Formeln
    pub ac_bonus: i32,  // Für Schilde (+2)
    pub ac_formula: Option<String>,  // z.B. "11 + DEX", "12 + DEX (max. 2)", "14"
    pub strength_requirement: Option<i32>,
    pub stealth_disadvantage: bool,
    pub don_time_minutes: Option<i32>,  // Anlegezeit in Minuten
    pub doff_time_minutes: Option<i32>,  // Ablegezeit in Minuten
    pub weight_kg: f64,
    pub cost_gp: f64,
    pub data: Value,
    pub parent_id: Option<String>,
    pub is_homebrew: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Item {
    pub id: String,
    pub name: String,
    pub description: String,
    pub cost_gp: f64,
    pub weight_kg: f64,
    pub category: String,
    pub data: Value,
    pub source: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Equipment {
    pub id: String,
    pub name: String,
    pub description: String,
    pub total_cost_gp: Option<f64>,
    pub total_weight_kg: Option<f64>,
    pub items: Value,
    pub tools: Value,
    pub data: Value,
    pub source: String,
}

