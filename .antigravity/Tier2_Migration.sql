-- Tier 2 Migration: Classes & Species

BEGIN TRANSACTION;

-- 1. Migrate Species Scalars
UPDATE core_species SET
    size = json_extract(data, '$.size'),
    speed = json_extract(data, '$.speed'),
    darkvision = COALESCE(json_extract(data, '$.data.darkvision'), json_extract(data, '$.darkvision'), 0)
WHERE data IS NOT NULL;

-- 2. Migrate Species Traits
INSERT INTO species_traits (species_id, name, description)
SELECT 
    s.id,
    json_extract(value, '$.name'),
    json_extract(value, '$.description')
FROM core_species s, json_each(json_extract(s.data, '$.traits'))
WHERE json_extract(s.data, '$.traits') IS NOT NULL;

-- 3. Migrate Species Languages
-- Handle both array of strings "languages": ["Common"] AND object "languages": {"known": [...]}
INSERT INTO species_languages (species_id, language)
SELECT 
    s.id,
    value
FROM core_species s, json_each(
    CASE 
        WHEN json_type(json_extract(s.data, '$.languages')) = 'array' THEN json_extract(s.data, '$.languages')
        ELSE json_extract(s.data, '$.languages.known')
    END
)
WHERE json_extract(s.data, '$.languages') IS NOT NULL;

-- 4. Migrate Class Scalars
UPDATE core_classes SET
    hit_die = json_extract(data, '$.hit_die')
WHERE data IS NOT NULL;

-- 5. Migrate Class Primary Abilities
-- (Skipping for now if missing in JSON, or add logic if found later)

-- 6. Migrate Class Saving Throws
INSERT INTO class_saving_throws (class_id, ability)
SELECT 
    c.id,
    value
FROM core_classes c, json_each(json_extract(c.data, '$.saving_throws'))
WHERE json_extract(c.data, '$.saving_throws') IS NOT NULL;

-- 7. Migrate Class Proficiencies

-- Armor (Object keys)
INSERT INTO class_proficiencies (class_id, type, value)
SELECT c.id, 'armor', key 
FROM core_classes c, json_each(json_extract(c.data, '$.armor_proficiencies'))
WHERE json_extract(c.data, '$.armor_proficiencies') IS NOT NULL;

-- Weapons (Object keys)
INSERT INTO class_proficiencies (class_id, type, value)
SELECT c.id, 'weapon', key 
FROM core_classes c, json_each(json_extract(c.data, '$.weapon_proficiencies'))
WHERE json_extract(c.data, '$.weapon_proficiencies') IS NOT NULL;

-- Tools (Array or Object? Handling both just in case, assuming Array for tool lists usually)
-- If it's NULL in sample, we skip.
INSERT INTO class_proficiencies (class_id, type, value)
SELECT c.id, 'tool', value 
FROM core_classes c, json_each(json_extract(c.data, '$.tool_proficiencies'))
WHERE json_extract(c.data, '$.tool_proficiencies') IS NOT NULL AND json_type(json_extract(c.data, '$.tool_proficiencies')) = 'array';

COMMIT;
