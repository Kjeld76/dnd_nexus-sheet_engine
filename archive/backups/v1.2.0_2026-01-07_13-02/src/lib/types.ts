export interface Character {
  id: string;
  meta: CharacterMeta;
  attributes: Attributes;
  modifiers: Modifier[];
}

export interface CharacterMeta {
  name: string;
  level: number;
  use_metric: boolean;
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
  modifier_type: 'Override' | 'Add' | 'Multiply';
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
  source: 'core' | 'override' | 'homebrew';
}

export interface Species {
  id: string;
  name: string;
  data: any;
  source: 'core' | 'override' | 'homebrew';
}

export interface Class {
  id: string;
  name: string;
  data: any;
  source: 'core' | 'override' | 'homebrew';
}

export interface Feat {
  id: string;
  name: string;
  category: string;
  data: any;
  source: 'core' | 'override' | 'homebrew';
}

export interface Skill {
  id: string;
  name: string;
  ability: string;
  description: string;
  source: 'core';
}

export interface Gear {
  id: string;
  name: string;
  description: string;
  cost_gp: number;
  weight_kg: number;
  data: any;
  source: 'core' | 'override' | 'homebrew';
}

export interface Tool {
  id: string;
  name: string;
  category: string;
  cost_gp: number;
  weight_kg: number;
  data: any;
  source: 'core' | 'override' | 'homebrew';
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
  data: any;
  source: 'core' | 'override' | 'homebrew';
}

export interface Armor {
  id: string;
  name: string;
  category: string;
  base_ac: number;
  strength_requirement: number | null;
  stealth_disadvantage: boolean;
  weight_kg: number;
  cost_gp: number;
  data: any;
  source: 'core' | 'override' | 'homebrew';
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
  item_type: 'gear' | 'tool';
  is_homebrew?: boolean;
}
