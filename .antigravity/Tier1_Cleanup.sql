-- Tier 1 Cleanup: Drop JSON Columns (Definitive Edition)

BEGIN TRANSACTION;

-- 1. Drop Dependent Triggers
DROP TRIGGER IF EXISTS validate_weapon_id;
DROP TRIGGER IF EXISTS validate_armor_id;

-- 2. Drop Dependent Views (Order Important)
DROP VIEW IF EXISTS all_compendium_search;
DROP VIEW IF EXISTS all_items_searchable;
DROP VIEW IF EXISTS all_weapons_minimal;
DROP VIEW IF EXISTS all_weapons;
DROP VIEW IF EXISTS all_weapons_unified;
DROP VIEW IF EXISTS all_armors;

-- 3. Drop Columns (SQLite 3.35+)
ALTER TABLE core_weapons DROP COLUMN data;
ALTER TABLE core_armors DROP COLUMN data;

-- 4. Recreate Normalized Views
CREATE VIEW all_weapons_unified AS 
SELECT 
    COALESCE(cw.id, core.id) as id, 
    COALESCE(cw.name, core.name) as name, 
    COALESCE(cw.category, core.category) as category, 
    COALESCE(cw.category_label, core.category_label) as category_label,
    COALESCE(cw.weapon_subtype, core.weapon_subtype) as weapon_subtype,
    COALESCE(cw.mastery_id, core.mastery_id) as mastery_id, 
    COALESCE(cw.damage_dice, core.damage_dice) as damage_dice, 
    COALESCE(cw.damage_type, core.damage_type) as damage_type, 
    COALESCE(cw.weight_kg, core.weight_kg) as weight_kg, 
    COALESCE(cw.cost_gp, core.cost_gp) as cost_gp, 
    COALESCE(cw.source_page, core.source_page) as source_page,
    COALESCE(cw.range_normal, core.range_normal) as range_normal,
    COALESCE(cw.range_long, core.range_long) as range_long,
    COALESCE(cw.data, '{}') as data,
    CASE WHEN cw.parent_id IS NOT NULL THEN 'override' WHEN cw.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
FROM core_weapons core 
LEFT JOIN custom_weapons cw ON cw.parent_id = core.id 
UNION 
SELECT 
    id, name, category, category_label, weapon_subtype, mastery_id, damage_dice, 
    damage_type, weight_kg, cost_gp, 
    source_page, range_normal, range_long,
    data, 
    CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
FROM custom_weapons WHERE parent_id IS NULL;


CREATE VIEW all_armors AS 
SELECT 
    COALESCE(c.id, core.id) as id, 
    COALESCE(c.name, core.name) as name, 
    COALESCE(c.category, core.category) as category, 
    COALESCE(c.category_label, core.category_label) as category_label,
    COALESCE(c.base_ac, core.base_ac) as base_ac, 
    COALESCE(c.ac_bonus, core.ac_bonus) as ac_bonus, 
    COALESCE(c.ac_formula, core.ac_formula) as ac_formula, 
    COALESCE(c.strength_requirement, core.strength_requirement) as strength_requirement, 
    COALESCE(c.stealth_disadvantage, core.stealth_disadvantage) as stealth_disadvantage, 
    COALESCE(c.don_time_minutes, core.don_time_minutes) as don_time_minutes, 
    COALESCE(c.doff_time_minutes, core.doff_time_minutes) as doff_time_minutes, 
    COALESCE(c.weight_kg, core.weight_kg) as weight_kg, 
    COALESCE(c.cost_gp, core.cost_gp) as cost_gp, 
    COALESCE(c.source_page, core.source_page) as source_page,
    COALESCE(c.data, '{}') as data,
    CASE WHEN c.parent_id IS NOT NULL THEN 'override' WHEN c.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
FROM core_armors core 
LEFT JOIN custom_armors c ON c.parent_id = core.id 
UNION 
SELECT 
    id, name, category, category_label, base_ac, ac_bonus, ac_formula, strength_requirement, stealth_disadvantage, 
    don_time_minutes, doff_time_minutes, weight_kg, cost_gp, 
    source_page,
    data, 
    CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
FROM custom_armors WHERE parent_id IS NULL;

-- 5. Recreate Legacy/Search Views
CREATE VIEW all_weapons AS 
SELECT 
    COALESCE(cw.id, core.id) as id, 
    COALESCE(cw.name, core.name) as name, 
    COALESCE(cw.category, core.category) as category, 
    COALESCE(cw.category_label, core.category_label) as category_label,
    COALESCE(cw.weapon_type, core.weapon_type) as weapon_type, 
    COALESCE(cw.weapon_subtype, core.weapon_subtype) as weapon_subtype,
    COALESCE(cw.damage_dice, core.damage_dice) as damage_dice, 
    COALESCE(cw.damage_type, core.damage_type) as damage_type, 
    COALESCE(cw.weight_kg, core.weight_kg) as weight_kg, 
    COALESCE(cw.cost_gp, core.cost_gp) as cost_gp, 
    COALESCE(cw.data, '{}') as data, 
    CASE WHEN cw.parent_id IS NOT NULL THEN 'override' WHEN cw.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
FROM core_weapons core 
LEFT JOIN custom_weapons cw ON cw.parent_id = core.id 
UNION 
SELECT 
    id, name, category, category_label, weapon_type, weapon_subtype, damage_dice, damage_type, weight_kg, cost_gp, 
    data, 
    CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
FROM custom_weapons WHERE parent_id IS NULL;


CREATE VIEW all_weapons_minimal AS
SELECT 
    id, 
    name, 
    category, 
    damage_dice, 
    damage_type, 
    cost_gp,
    source
FROM all_weapons_unified;

CREATE VIEW all_items_searchable AS
SELECT id, name, 'gear' as type, source FROM all_gear
UNION ALL
SELECT id, name, 'tool' as type, source FROM all_tools
UNION ALL
SELECT id, name, 'weapon' as type, source FROM all_weapons_unified
UNION ALL
SELECT id, name, 'armor' as type, source FROM all_armors
UNION ALL
SELECT id, name, 'bundle' as type, source FROM all_equipment
UNION ALL
SELECT id, name, 'item' as type, source FROM all_items
UNION ALL
SELECT id, name, 'magic_item' as type, source FROM all_mag_items_base;

CREATE VIEW all_compendium_search AS
SELECT 
    'GEAR-' || id as id, id as raw_id, name, 'gear' as item_category,
    CASE WHEN source = 'core' THEN 'core_item' WHEN source = 'homebrew' THEN 'custom_item' ELSE 'custom_item' END as item_type,
    cost_gp, weight_kg, source, 1 as priority
FROM all_gear WHERE source = 'core'
UNION
SELECT 
    'TOOL-' || id as id, id as raw_id, name, 'tool' as item_category,
    CASE WHEN source = 'core' THEN 'core_tool' WHEN source = 'homebrew' THEN 'custom_tool' ELSE 'custom_tool' END as item_type,
    cost_gp, weight_kg, source, 1 as priority
FROM all_tools WHERE source = 'core'
UNION
SELECT 
    'ITEM-' || id as id, id as raw_id, name, 'item' as item_category,
    CASE WHEN source = 'core' THEN 'core_item' WHEN source = 'homebrew' THEN 'custom_item' ELSE 'custom_item' END as item_type,
    cost_gp, weight_kg, source, 1 as priority
FROM all_items WHERE source = 'core'
UNION
SELECT 
    'MAG-' || id as id, id as raw_id, name, 'magic_item' as item_category,
    CASE WHEN source = 'core' THEN 'core_magic_item' WHEN source = 'homebrew' THEN 'custom_magic_item' ELSE 'custom_magic_item' END as item_type,
    COALESCE(CAST(json_extract(data, '$.cost_gp') AS REAL), 0.0) as cost_gp,
    COALESCE(CAST(json_extract(data, '$.weight_kg') AS REAL), CAST(json_extract(data, '$.weight') AS REAL), 0.0) as weight_kg,
    source, 1 as priority
FROM all_mag_items_base WHERE source = 'core'
UNION
SELECT 
    'GEAR-' || id as id, id as raw_id, name, 'gear' as item_category, 'custom_item' as item_type,
    cost_gp, weight_kg, source, 2 as priority
FROM all_gear WHERE source IN ('homebrew', 'override')
UNION
SELECT 
    'TOOL-' || id as id, id as raw_id, name, 'tool' as item_category, 'custom_tool' as item_type,
    cost_gp, weight_kg, source, 2 as priority
FROM all_tools WHERE source IN ('homebrew', 'override')
UNION
SELECT 
    'ITEM-' || id as id, id as raw_id, name, 'item' as item_category, 'custom_item' as item_type,
    cost_gp, weight_kg, source, 2 as priority
FROM all_items WHERE source IN ('homebrew', 'override')
UNION
SELECT 
    'MAG-' || id as id, id as raw_id, name, 'magic_item' as item_category, 'custom_magic_item' as item_type,
    COALESCE(CAST(json_extract(data, '$.cost_gp') AS REAL), 0.0) as cost_gp,
    COALESCE(CAST(json_extract(data, '$.weight_kg') AS REAL), CAST(json_extract(data, '$.weight') AS REAL), 0.0) as weight_kg,
    source, 2 as priority
FROM all_mag_items_base WHERE source IN ('homebrew', 'override')
UNION
SELECT 
    'WEAP-' || id as id, id as raw_id, name, 'weapon' as item_category,
    CASE WHEN source = 'core' THEN 'core_weapon' WHEN source = 'homebrew' THEN 'custom_weapon' ELSE 'custom_weapon' END as item_type,
    cost_gp, weight_kg, source, CASE WHEN source = 'core' THEN 1 ELSE 2 END as priority
FROM all_weapons
UNION
SELECT 
    'ARM-' || id as id, id as raw_id, name, 'armor' as item_category,
    CASE WHEN source = 'core' THEN 'core_armor' WHEN source = 'homebrew' THEN 'custom_armor' ELSE 'custom_armor' END as item_type,
    cost_gp, weight_kg, source, CASE WHEN source = 'core' THEN 1 ELSE 2 END as priority
FROM all_armors;

-- 6. Recreate Dependent Triggers
CREATE TRIGGER validate_weapon_id
BEFORE INSERT ON weapon_property_mappings
BEGIN
    SELECT CASE
        WHEN NOT EXISTS (SELECT 1 FROM all_weapons_unified WHERE id = NEW.weapon_id)
        THEN RAISE(ABORT, 'weapon_id must exist in all_weapons_unified (core_weapons or custom_weapons)')
    END;
END;

CREATE TRIGGER validate_armor_id
BEFORE INSERT ON armor_property_mappings
BEGIN
    SELECT CASE
        WHEN NOT EXISTS (SELECT 1 FROM all_armors WHERE id = NEW.armor_id)
        THEN RAISE(ABORT, 'armor_id must exist in all_armors (core_armors or custom_armors)')
    END;
END;

COMMIT;
