use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Weapon {
    pub id: String,
    pub name: String,
    pub category: String,
    pub weapon_type: String,
    pub damage_dice: String,
    pub damage_type: String,
    pub weight_kg: f64,
    pub cost_gp: f64,
    pub data: WeaponData,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeaponData {
    pub properties: Vec<String>,
    pub mastery: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub range: Option<WeaponRange>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub thrown_range: Option<WeaponRange>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub versatile_damage: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ammunition_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub property_details: Option<HashMap<String, PropertyDetail>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mastery_details: Option<MasteryDetail>,
    pub source_page: u16,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeaponRange {
    pub normal: f64,
    pub max: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PropertyDetail {
    pub id: String,
    pub name: String,
    pub description: String,
    pub data: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MasteryDetail {
    pub id: String,
    pub name: String,
    pub description: String,
    pub data: serde_json::Value,
}






