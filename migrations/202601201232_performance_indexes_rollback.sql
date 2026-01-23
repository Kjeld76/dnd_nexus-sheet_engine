-- Rollback: Performance-Indizes (non-breaking)
DROP INDEX IF EXISTS idx_bg_equipment_bg_option;
DROP INDEX IF EXISTS idx_class_equipment_class_custom;
DROP INDEX IF EXISTS idx_feature_prerequisites_feature_type;
DROP INDEX IF EXISTS idx_weapon_mappings_weapon;
DROP INDEX IF EXISTS idx_armor_mappings_armor;
