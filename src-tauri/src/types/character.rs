use serde::{Deserialize, Serialize};
use uuid::Uuid;
use serde_json::Value;
use crate::core::types::ModifierType;

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
    pub feats: Vec<String>,
    #[serde(default)]
    pub inventory: Vec<CharacterItem>,
    #[serde(default)]
    pub spells: Vec<CharacterSpell>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CharacterMeta {
    pub name: String,
    pub level: i32,
    #[serde(default)]
    pub fighting_styles: Option<Vec<String>>,
    pub species_id: Option<String>,
    pub class_id: Option<String>,
    pub subclass_id: Option<String>,
    pub background_id: Option<String>,
    pub origin_id: Option<String>,
    pub alignment: Option<String>,
    pub gender: Option<String>,
    pub player_name: Option<String>,
    pub faith: Option<String>,
    #[serde(default)]
    pub xp: i32,
    pub use_metric: bool,
    pub background_ability_scores: Option<std::collections::HashMap<String, i32>>,
    pub background_tool_choice: Option<String>,
    pub background_gold_granted: Option<i32>,
    pub background_equipment_applied: Option<bool>,
    pub personality_traits: Option<String>,
    pub ideals: Option<String>,
    pub bonds: Option<String>,
    pub flaws: Option<String>,
    // Inventar & Währung
    #[serde(default)]
    pub equipment_on_body_items: Option<Vec<EquipmentListItem>>,
    #[serde(default)]
    pub equipment_in_backpack_items: Option<Vec<EquipmentListItem>>,
    #[serde(default)]
    pub equipment_on_pack_animal_items: Option<Vec<EquipmentListItem>>,
    #[serde(default)]
    pub equipment_in_bag_of_holding_items: Option<Vec<EquipmentListItem>>,
    #[serde(default)]
    pub equipment_tool_items: Option<Vec<EquipmentListItem>>,
    #[serde(default)]
    pub currency_platinum: Option<i32>,
    #[serde(default)]
    pub currency_gold: Option<i32>,
    #[serde(default)]
    pub currency_electrum: Option<i32>,
    #[serde(default)]
    pub currency_silver: Option<i32>,
    #[serde(default)]
    pub currency_copper: Option<i32>,
    pub equipment_on_body: Option<String>,
    pub equipment_in_backpack: Option<String>,
    pub equipment_on_pack_animal: Option<String>,
    pub equipment_in_bag_of_holding: Option<String>,
    #[serde(default)]
    pub total_weight_kg: Option<f64>,
    // Spell Slots
    #[serde(default)]
    pub spell_slots_1: i32,
    #[serde(default)]
    pub spell_slots_2: i32,
    #[serde(default)]
    pub spell_slots_3: i32,
    #[serde(default)]
    pub spell_slots_4: i32,
    #[serde(default)]
    pub spell_slots_5: i32,
    #[serde(default)]
    pub spell_slots_6: i32,
    #[serde(default)]
    pub spell_slots_7: i32,
    #[serde(default)]
    pub spell_slots_8: i32,
    #[serde(default)]
    pub spell_slots_9: i32,
    #[serde(default)]
    pub spell_slots_used_1: i32,
    #[serde(default)]
    pub spell_slots_used_2: i32,
    #[serde(default)]
    pub spell_slots_used_3: i32,
    #[serde(default)]
    pub spell_slots_used_4: i32,
    #[serde(default)]
    pub spell_slots_used_5: i32,
    #[serde(default)]
    pub spell_slots_used_6: i32,
    #[serde(default)]
    pub spell_slots_used_7: i32,
    #[serde(default)]
    pub spell_slots_used_8: i32,
    #[serde(default)]
    pub spell_slots_used_9: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HealthPool {
    pub current: i32,
    pub max: i32,
    pub temp: i32,
    pub hit_dice_max: i32,
    pub hit_dice_used: i32,
    #[serde(default)]
    pub use_rolled_hp: Option<bool>, // true = gewürfelt, false/None = Durchschnitt
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
            use_rolled_hp: None,
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
    #[serde(default)]
    pub item_type: Option<String>,
    pub quantity: i32,
    pub is_equipped: bool,
    #[serde(default)]
    pub is_attuned: bool,
    #[serde(default)]
    pub location: Option<String>,
    #[serde(default)]
    pub source: Option<String>,
    #[serde(default)]
    pub is_starting_equipment: bool,
    pub custom_data: Option<Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CharacterInventoryEntry {
    pub id: String,
    pub character_id: String,
    pub item_id: String,
    pub item_type: String,
    pub quantity: i32,
    pub is_equipped: bool,
    pub is_attuned: bool,
    pub container_id: Option<String>,
    pub custom_name: Option<String>,
    pub custom_description: Option<String>,
    pub data: Option<Value>,
    pub created_at: Option<i64>,
    pub updated_at: Option<i64>,
    #[serde(default)]
    pub location: Option<String>,
    #[serde(default)]
    pub source: Option<String>,
    #[serde(default)]
    pub is_starting_equipment: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CharacterSpell {
    pub id: String,
    pub spell_id: String,
    pub is_prepared: bool,
    #[serde(default)]
    pub is_always_prepared: bool,
    pub source: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CharacterSpellcasting {
    pub ability: String,
    pub save_dc: i32,
    pub attack_bonus: i32,
    pub slots: Value,
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
pub struct EquipmentListItem {
    pub id: String,
    pub name: String,
    pub quantity: i32,
}
