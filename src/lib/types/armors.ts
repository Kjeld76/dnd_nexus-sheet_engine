export interface Armor {
  id: string;
  name: string;
  category: string;
  base_ac: number;
  strength_requirement: number | null;
  stealth_disadvantage: boolean;
  weight_kg: number;
  cost_gp: number;
  data: ArmorData;
  source: 'core' | 'homebrew' | 'override';
}

export interface ArmorData {
  dex_bonus: {
    apply: boolean;
    max: number | null;
  };
  ac_formula: string;
  source_page: number;
}






