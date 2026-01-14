export interface Character {
  id: string;
  meta: CharacterMeta;
  attributes: Attributes;
  health: HealthPool;
  proficiencies: CharacterProficiencies;
  spellcasting?: CharacterSpellcasting;
  appearance?: CharacterAppearance;
  modifiers: Modifier[];
  feats: string[]; // List of feat IDs
  inventory: CharacterItem[];
}

export interface CharacterMeta {
  name: string;
  player_name?: string;
  level: number;
  species_id?: string;
  class_id?: string;
  subclass_id?: string;
  background_id?: string;
  origin_id?: string;
  alignment?: string;
  faith?: string;
  gender?: string;
  xp: number;
  use_metric: boolean;
  background_ability_scores?: Record<string, number>; // Tracks ability score bonuses from background
  currency_gold?: number;
  currency_silver?: number;
  currency_copper?: number;
  equipment_on_body?: string;
  equipment_in_backpack?: string;
  equipment_on_pack_animal?: string;
  equipment_in_bag_of_holding?: string;
  equipment_on_body_items?: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
  equipment_in_backpack_items?: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
  equipment_on_pack_animal_items?: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
  equipment_in_bag_of_holding_items?: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
  total_weight_kg?: number;
  personality_traits?: string;
  ideals?: string;
  bonds?: string;
  flaws?: string;
}

export interface CharacterAppearance {
  age?: string;
  height?: string;
  weight?: string;
  eyes?: string;
  skin?: string;
  hair?: string;
}

export interface CharacterSpellcasting {
  ability: keyof Attributes;
  save_dc: number;
  attack_bonus: number;
  slots: Record<number, { total: number; used: number }>;
  prepared_spells: string[]; // List of spell IDs
}

export interface HealthPool {
  current: number;
  max: number;
  temp: number;
  hit_dice_max: number;
  hit_dice_used: number;
  use_rolled_hp?: boolean; // true = gewürfelt, false/undefined = Durchschnitt
  death_saves: {
    successes: number;
    failures: number;
  };
}

export interface CharacterProficiencies {
  skills: string[]; // List of skill IDs or names
  saving_throws: (keyof Attributes)[];
  weapons: string[];
  armor: string[];
  tools: string[];
  languages: string[];
}

export interface CharacterItem {
  id: string;
  item_id: string; // Reference to compendium
  quantity: number;
  is_equipped: boolean;
  custom_data?: any;
}

export interface Attributes {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface Modifier {
  id: string;
  source: string;
  target: string;
  modifier_type: "Override" | "Add" | "Multiply";
  value: number;
  condition?: string;
}

export interface Spell {
  id: string;
  name: string;
  level: number;
  school: string;
  casting_time: string;
  range: string;
  components: string;
  material_components?: string;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  description: string;
  higher_levels?: string;
  classes: string;
  data: any;
  source: "core" | "override" | "homebrew";
}

export interface Species {
  id: string;
  name: string;
  data: any;
  source: "core" | "override" | "homebrew";
}

export interface Class {
  id: string;
  name: string;
  data: any;
  source: "core" | "override" | "homebrew";
}

export interface Feat {
  id: string;
  name: string;
  category: string;
  data: any;
  source: "core" | "override" | "homebrew";
}

export interface Skill {
  id: string;
  name: string;
  ability: string;
  description: string;
  source: "core";
}

export interface Background {
  id: string;
  name: string;
  data: {
    description?: string;
    ability_scores?: string[];
    feat?: string;
    skills?: string[];
    tool?:
      | string
      | {
          type: "fixed" | "choice";
          name?: string;
          category?: string;
          description?: string;
        };
    starting_equipment?: {
      options?: Array<{
        label: string;
        items: string[] | null;
        gold: number | null;
      }>;
      // Legacy fields
      items?: string[];
      gold?: number;
    };
    [key: string]: any;
  };
  source: "core" | "override" | "homebrew";
}

export interface Gear {
  id: string;
  name: string;
  description: string;
  cost_gp: number;
  weight_kg: number;
  data: any;
  source: "core" | "override" | "homebrew";
}

export interface Tool {
  id: string;
  name: string;
  category: string;
  cost_gp: number;
  weight_kg: number;
  data: any;
  source: "core" | "override" | "homebrew";
}

export interface Item {
  id: string;
  name: string;
  description: string;
  cost_gp: number;
  weight_kg: number;
  category?: string;
  data: any;
  source: "core" | "override" | "homebrew";
}

export interface Equipment {
  id: string;
  name: string;
  description: string;
  total_cost_gp?: number;
  total_weight_kg?: number;
  items: Array<{ item_id: string; quantity: number }>;
  tools?: Array<{ tool_id: string; quantity: number }>;
  data: any;
  source: "core" | "override" | "homebrew";
}

export interface Weapon {
  id: string;
  name: string;
  category: string;
  weapon_type: string;
  damage_dice: string;
  damage_type: string;
  weight_kg: number;
  cost_gp: number;
  properties?: Array<{
    id: string;
    name: string;
    description?: string;
    [key: string]: any;
  }>;
  mastery?: {
    id: string;
    name: string;
    description?: string;
    [key: string]: any;
  };
  data: any;
  source: "core" | "override" | "homebrew";
}

export interface Armor {
  id: string;
  name: string;
  category: string;
  base_ac: number | null; // NULL für Formeln
  ac_bonus: number; // Für Schilde (+2)
  ac_formula: string | null; // z.B. "11 + DEX", "12 + DEX (max. 2)", "14"
  strength_requirement: number | null;
  stealth_disadvantage: boolean;
  don_time_minutes: number | null; // Anlegezeit in Minuten
  doff_time_minutes: number | null; // Ablegezeit in Minuten
  weight_kg: number;
  cost_gp: number;
  properties?: Array<{
    id: string;
    name: string;
    description: string;
    affects_field?: string;
    parameter_value?: any;
  }>;
  data: any;
  source: "core" | "override" | "homebrew";
}

export interface CustomSpell {
  id?: string;
  name: string;
  level: number;
  school: string;
  casting_time: string;
  range: string;
  components: string;
  material_components?: string;
  duration: string;
  concentration: boolean;
  ritual: boolean;
  description: string;
  higher_levels?: string;
  classes: string;
  data: any;
  parent_id?: string;
  is_homebrew?: boolean;
}

export interface CustomWeapon {
  id?: string;
  name: string;
  category: string;
  weapon_type: string;
  damage_dice: string;
  damage_type: string;
  weight_kg: number;
  cost_gp: number;
  data: any;
  parent_id?: string;
  is_homebrew?: boolean;
}

export interface CustomArmor {
  id?: string;
  name: string;
  category: string;
  base_ac: number;
  strength_requirement: number | null;
  stealth_disadvantage: boolean;
  weight_kg: number;
  cost_gp: number;
  data: any;
  parent_id?: string;
  is_homebrew?: boolean;
}

export interface CustomItem {
  id?: string;
  name: string;
  description: string;
  cost_gp: number;
  weight_kg: number;
  data: any;
  parent_id?: string;
  item_type: "gear" | "tool";
  is_homebrew?: boolean;
}
