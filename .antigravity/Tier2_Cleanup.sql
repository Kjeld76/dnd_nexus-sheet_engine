-- Tier 2 Cleanup: Drop JSON Columns & Update Views

BEGIN TRANSACTION;

-- 1. Drop Dependent Views
DROP VIEW IF EXISTS all_species;
DROP VIEW IF EXISTS all_classes;

-- 2. Drop Columns
ALTER TABLE core_species DROP COLUMN data;
ALTER TABLE core_classes DROP COLUMN data;

-- 3. Recreate Normalized Views
-- Note: custom_species/classes don't have normalized columns yet, so we return NULL/defaults for them in UNION.
-- For overrides (LEFT JOIN), we prefer custom data (in JSON) if we can't merge properly, but without normalized columns in custom, 
-- we rely on the Core value for normalized fields unless we implement logic to extract from custom.data?
-- Siding with: Core value wins for normalized columns unless Custom has column (which it doesn't). 
-- This implies Custom CANNOT override 'speed' simply by JSON anymore in this View. 
-- BUT, Rust code handles Custom via JSON 'data'. 
-- This View is primarily for normalized access.

CREATE VIEW all_species AS 
SELECT 
    COALESCE(c.id, core.id) as id, 
    COALESCE(c.name, core.name) as name, 
    core.size as size, -- Only core has this column
    core.speed as speed,
    core.darkvision as darkvision,
    COALESCE(c.data, '{}') as data, -- Core has no data
    CASE WHEN c.parent_id IS NOT NULL THEN 'override' WHEN c.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
FROM core_species core 
LEFT JOIN custom_species c ON c.parent_id = core.id 
UNION 
SELECT 
    id, name, 
    NULL as size, 0 as speed, 0 as darkvision, 
    data, 
    CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
FROM custom_species WHERE parent_id IS NULL;


CREATE VIEW all_classes AS 
SELECT 
    COALESCE(c.id, core.id) as id, 
    COALESCE(c.name, core.name) as name, 
    core.hit_die as hit_die, -- Only core has this column
    COALESCE(c.data, '{}') as data, 
    CASE WHEN c.parent_id IS NOT NULL THEN 'override' WHEN c.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
FROM core_classes core 
LEFT JOIN custom_classes c ON c.parent_id = core.id 
UNION 
SELECT 
    id, name, 
    NULL as hit_die,
    data, 
    CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
FROM custom_classes WHERE parent_id IS NULL;

COMMIT;
