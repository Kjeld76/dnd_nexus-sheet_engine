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
    pub base_ac: i32,
    pub strength_requirement: Option<i32>,
    pub stealth_disadvantage: bool,
    pub weight_kg: f64,
    pub cost_gp: f64,
    pub data: Value,
    pub source: String,
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
    pub base_ac: i32,
    pub strength_requirement: Option<i32>,
    pub stealth_disadvantage: bool,
    pub weight_kg: f64,
    pub cost_gp: f64,
    pub data: Value,
    pub parent_id: Option<String>,
    pub is_homebrew: Option<bool>,
}

