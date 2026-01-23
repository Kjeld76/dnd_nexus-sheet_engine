-- Phase 1: Performance-Indizes (non-breaking)
CREATE INDEX IF NOT EXISTS idx_bg_equipment_bg_option 
  ON background_starting_equipment(background_id, option_label);

CREATE INDEX IF NOT EXISTS idx_class_equipment_class_custom 
  ON class_starting_equipment(class_id, is_custom);

CREATE INDEX IF NOT EXISTS idx_feature_prerequisites_feature_type
  ON feature_prerequisites(feature_id, prerequisite_type);

CREATE INDEX IF NOT EXISTS idx_weapon_mappings_weapon
  ON weapon_property_mappings(weapon_id);

CREATE INDEX IF NOT EXISTS idx_armor_mappings_armor
  ON armor_property_mappings(armor_id);
