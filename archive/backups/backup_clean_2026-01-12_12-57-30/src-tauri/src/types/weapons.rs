use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Weapon {
    pub id: String,
    pub name: String,
    pub category: String,
    pub mastery_id: String,  // NEU: Referenz zu weapon_masteries
    pub damage_dice: String,
    pub damage_type: String,
    pub weight_kg: f64,
    pub cost_gp: f64,
    pub properties: Vec<WeaponProperty>,  // NEU: Properties via Mapping-Tabelle
    pub mastery: Option<WeaponMastery>,  // NEU: Optional, wird via JOIN geladen
    pub data: Value,
    pub source: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeaponProperty {
    pub id: String,
    pub name: String,
    pub description: String,
    pub has_parameter: bool,
    pub parameter_type: Option<String>,  // 'range', 'damage', 'ammo', 'range+ammo', 'bonus', 'special'
    pub parameter_value: Option<Value>,   // JSON für komplexe Parameter
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeaponMastery {
    pub id: String,
    pub name: String,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CustomWeapon {
    pub id: Option<String>,
    pub name: String,
    pub category: String,
    pub mastery_id: String,  // NEU: Referenz zu weapon_masteries
    pub damage_dice: String,
    pub damage_type: String,
    pub weight_kg: f64,
    pub cost_gp: f64,
    pub data: Value,
    pub parent_id: Option<String>,
    pub is_homebrew: Option<bool>,
}







