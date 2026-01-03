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
  data: SpellData;
  source: 'core' | 'override' | 'homebrew';
}

export interface SpellData {
  time: string;
  range: string;
  duration: string;
  description: string;
  concentration: boolean;
  ritual: boolean;
  classes: string[];
}

export interface Species {
  id: string;
  name: string;
  data: SpeciesData;
  source: 'core' | 'override' | 'homebrew';
}

export interface SpeciesData {
  speed: number;
  size: string;
  traits: SpeciesTrait[];
}

export interface SpeciesTrait {
  name: string;
  description: string;
}

export interface Class {
  id: string;
  name: string;
  data: Record<string, any>;
  source: 'core' | 'override' | 'homebrew';
}

export interface Feat {
  id: string;
  name: string;
  data: FeatData;
  source: 'core' | 'override' | 'homebrew';
}

export interface FeatData {
  description: string;
  effects: FeatEffect[];
}

export interface FeatEffect {
  type: string;
  value: string;
}

export interface Item {
  id: string;
  name: string;
  category: string;
  data: ItemData;
  source: 'core' | 'override' | 'homebrew';
}

export interface ItemData {
  cost_cp: number;
  weight: number;
  damage_dice?: string;
  damage_type?: string;
  ac_base?: number;
  dex_bonus_max?: number;
  strength_req?: number;
  stealth_dis?: boolean;
  rarity?: string;
  attunement?: boolean;
}

export interface CustomSpell {
  id?: string;
  name: string;
  level: number;
  school: string;
  data: string; // Keep as string for DB transport, or SpellData if parsed in frontend
  parent_spell_id?: string;
}


