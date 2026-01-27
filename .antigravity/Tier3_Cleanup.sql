-- Tier 3 Cleanup: Spells

BEGIN TRANSACTION;

-- 1. Drop Dependent Views
DROP VIEW IF EXISTS all_spells_minimal;
DROP VIEW IF EXISTS all_spells;

-- 2. Drop Columns
ALTER TABLE core_spells DROP COLUMN data;
ALTER TABLE core_spells DROP COLUMN classes;

-- 3. Recreate Normalized View
-- Reconstructs 'classes' CSV from spell_classes table for Core entries
CREATE VIEW all_spells AS 
SELECT 
    COALESCE(c.id, core.id) as id, 
    COALESCE(c.name, core.name) as name, 
    COALESCE(c.level, core.level) as level, 
    COALESCE(c.school, core.school) as school, 
    COALESCE(c.casting_time, core.casting_time) as casting_time,
    COALESCE(c.range, core.range) as range, 
    COALESCE(c.components, core.components) as components,
    COALESCE(c.material_components, core.material_components) as material_components,
    COALESCE(c.duration, core.duration) as duration, 
    COALESCE(c.concentration, core.concentration) as concentration,
    COALESCE(c.ritual, core.ritual) as ritual, 
    COALESCE(c.description, core.description) as description,
    COALESCE(c.higher_levels, core.higher_levels) as higher_levels, 
    COALESCE(c.source_page, core.source_page) as source_page,
    
    -- Classes: Use Custom if present, else aggregate Core relations
    COALESCE(c.classes, (
        SELECT GROUP_CONCAT(class_id, ', ') 
        FROM spell_classes 
        WHERE spell_id = core.id
    )) as classes,
    
    COALESCE(c.data, '{}') as data, 
    
    CASE 
        WHEN c.parent_id IS NOT NULL THEN 'override' 
        WHEN c.is_homebrew = 1 THEN 'homebrew' 
        ELSE 'core' 
    END as source 
    
FROM core_spells core 
LEFT JOIN custom_spells c ON c.parent_id = core.id 
UNION 
SELECT 
    id, name, level, school, casting_time, range, components, material_components, duration, concentration, ritual, description, higher_levels, source_page, classes, data, 
    CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
FROM custom_spells WHERE parent_id IS NULL;

-- 4. Recreate Dependent Views
CREATE VIEW all_spells_minimal AS
SELECT
    id,
    name,
    level,
    school,
    casting_time,
    source
FROM all_spells;

COMMIT;
