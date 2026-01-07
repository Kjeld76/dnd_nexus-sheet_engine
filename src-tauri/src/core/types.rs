use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Character {
    pub id: Uuid,
    pub meta: CharacterMeta,
    pub attributes: Attributes,
    #[serde(default)]
    pub health: HealthPool,
    #[serde(default)]
    pub proficiencies: CharacterProficiencies,
    pub spellcasting: Option<CharacterSpellcasting>,
    pub appearance: Option<CharacterAppearance>,
    #[serde(default)]
    pub modifiers: Vec<Modifier>,
    #[serde(default)]
    pub inventory: Vec<CharacterItem>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CharacterMeta {
    pub name: String,
    pub level: i32,
    pub species_id: Option<String>,
    pub class_id: Option<String>,
    pub subclass_id: Option<String>,
    pub background_id: Option<String>,
    pub alignment: Option<String>,
    #[serde(default)]
    pub xp: i32,
    pub use_metric: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HealthPool {
    pub current: i32,
    pub max: i32,
    pub temp: i32,
    pub hit_dice_max: i32,
    pub hit_dice_used: i32,
    pub death_saves: DeathSaves,
}

impl Default for HealthPool {
    fn default() -> Self {
        Self {
            current: 10,
            max: 10,
            temp: 0,
            hit_dice_max: 1,
            hit_dice_used: 0,
            death_saves: DeathSaves::default(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct DeathSaves {
    pub successes: i32,
    pub failures: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct CharacterProficiencies {
    pub skills: Vec<String>,
    pub saving_throws: Vec<String>,
    pub weapons: Vec<String>,
    pub armor: Vec<String>,
    pub tools: Vec<String>,
    pub languages: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CharacterItem {
    pub id: String,
    pub item_id: String,
    pub quantity: i32,
    pub is_equipped: bool,
    pub custom_data: Option<Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CharacterSpellcasting {
    pub ability: String,
    pub save_dc: i32,
    pub attack_bonus: i32,
    pub slots: Value, // Using Value for flexible slot mapping
    pub prepared_spells: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CharacterAppearance {
    pub age: Option<String>,
    pub height: Option<String>,
    pub weight: Option<String>,
    pub eyes: Option<String>,
    pub skin: Option<String>,
    pub hair: Option<String>,
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
