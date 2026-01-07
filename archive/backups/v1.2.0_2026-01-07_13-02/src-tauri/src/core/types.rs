use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Character {
    pub id: Uuid,
    pub meta: CharacterMeta,
    pub attributes: Attributes,
    pub modifiers: Vec<Modifier>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CharacterMeta {
    pub name: String,
    pub level: i32,
    pub use_metric: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Attributes {
    pub str: i32,
    pub dex: i32,
    pub con: i32,
    pub int: i32,
    pub wis: i32,
    pub cha: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Modifier {
    pub id: String,
    pub source: String,
    pub target: String,
    pub modifier_type: ModifierType,
    pub value: i32,
    pub condition: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Spell {
    pub id: String,
    pub name: String,
    pub level: i32,
    pub school: String,
    pub casting_time: String,
    pub range: String,
    pub components: String,
    pub material_components: Option<String>,
    pub duration: String,
    pub concentration: bool,
    pub ritual: bool,
    pub description: String,
    pub higher_levels: Option<String>,
    pub classes: String,
    pub data: Value,
    pub source: String,
}

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
pub struct Weapon {
    pub id: String,
    pub name: String,
    pub category: String,
    pub weapon_type: String,
    pub damage_dice: String,
    pub damage_type: String,
    pub weight_kg: f64,
    pub cost_gp: f64,
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
pub struct CustomSpell {
    pub id: Option<String>,
    pub name: String,
    pub level: i32,
    pub school: String,
    pub casting_time: String,
    pub range: String,
    pub components: String,
    pub material_components: Option<String>,
    pub duration: String,
    pub concentration: bool,
    pub ritual: bool,
    pub description: String,
    pub higher_levels: Option<String>,
    pub classes: String,
    pub data: Value,
    pub parent_id: Option<String>,
    pub is_homebrew: Option<bool>,
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
    pub item_type: String, // "gear", "tool", "weapon", "armor"
    pub is_homebrew: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CustomWeapon {
    pub id: Option<String>,
    pub name: String,
    pub category: String,
    pub weapon_type: String,
    pub damage_dice: String,
    pub damage_type: String,
    pub weight_kg: f64,
    pub cost_gp: f64,
    pub data: Value,
    pub parent_id: Option<String>,
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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CustomGeneric {
    pub id: Option<String>,
    pub name: String,
    pub data: Value,
    pub parent_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
pub enum ModifierType {
    Override,
    Add,
    Multiply,
}
