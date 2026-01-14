export interface Weapon {
  id: string;
  name: string;
  category: string;
  weapon_type?: string; // DEPRECATED, bleibt für Rückwärtskompatibilität
  mastery_id: string; // NEU
  damage_dice: string;
  damage_type: string;
  weight_kg: number;
  cost_gp: number;
  properties: WeaponProperty[]; // NEU: Properties als Array
  mastery?: WeaponMastery; // NEU: Optional Mastery-Objekt
  data: WeaponData;
  source: "core" | "homebrew" | "override";
}

export interface WeaponProperty {
  id: string;
  name: string;
  description: string;
  has_parameter: boolean;
  parameter_type?: string;
  parameter_value?: unknown;
}

export interface WeaponMastery {
  id: string;
  name: string;
  description: string;
}

export interface WeaponData {
  properties?: string[]; // DEPRECATED, bleibt für Rückwärtskompatibilität
  mastery?: string; // DEPRECATED, bleibt für Rückwärtskompatibilität
  range?: WeaponRange;
  thrown_range?: WeaponRange;
  versatile_damage?: string;
  ammunition_type?: string;
  property_details?: Record<string, PropertyDetail>;
  mastery_details?: MasteryDetail;
  source_page?: number;
}

export interface WeaponRange {
  normal: number;
  max: number;
}

export interface PropertyDetail {
  id: string;
  name: string;
  description: string;
  data: Record<string, unknown>;
}

export interface MasteryDetail {
  id: string;
  name: string;
  description: string;
  data: Record<string, unknown>;
}
