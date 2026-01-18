export interface Armor {
  id: string;
  name: string;
  category: string;
  category_label?: string; // Lesbare deutsche Bezeichnung (z.B. "Leichte Rüstung", "Schilde")
  base_ac: number | null; // NULL für Formeln
  ac_bonus: number; // Für Schilde (+2)
  ac_formula: string | null; // z.B. "11 + DEX", "12 + DEX (max. 2)", "14"
  strength_requirement: number | null; // BEHALTEN (Legacy)
  stealth_disadvantage: boolean; // BEHALTEN (Legacy)
  don_time_minutes: number | null; // Anlegezeit in Minuten
  doff_time_minutes: number | null; // Ablegezeit in Minuten
  weight_kg: number;
  cost_gp: number;
  properties?: ArmorProperty[]; // NEU: Properties via Mapping-Tabelle
  data: ArmorData;
  source: "core" | "homebrew" | "override";
}

export interface ArmorProperty {
  id: string;
  name: string;
  description: string;
  affects_field?: string; // z.B. "strength_requirement", "stealth_disadvantage", "ac_bonus"
  parameter_value?: unknown; // JSON für komplexe Parameter
}

export interface ArmorData {
  dex_bonus: {
    apply: boolean;
    max: number | null;
  };
  source_page: number;
}
