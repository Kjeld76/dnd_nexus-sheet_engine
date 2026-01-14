use serde::{Deserialize, Serialize};
use serde_json::Value;

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

