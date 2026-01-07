export interface Weapon {
  id: string;
  name: string;
  category: string;
  weapon_type: string;
  damage_dice: string;
  damage_type: string;
  weight_kg: number;
  cost_gp: number;
  data: WeaponData;
  source: 'core' | 'homebrew' | 'override';
}

export interface WeaponData {
  properties: string[];
  mastery: string;
  range?: WeaponRange;
  thrown_range?: WeaponRange;
  versatile_damage?: string;
  ammunition_type?: string;
  property_details?: Record<string, PropertyDetail>;
  mastery_details?: MasteryDetail;
  source_page: number;
}

export interface WeaponRange {
  normal: number;
  max: number;
}

export interface PropertyDetail {
  id: string;
  name: string;
  description: string;
  data: any;
}

export interface MasteryDetail {
  id: string;
  name: string;
  description: string;
  data: any;
}






