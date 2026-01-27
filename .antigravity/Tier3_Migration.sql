-- Tier 3 Migration: Spells

BEGIN TRANSACTION;

-- 1. Migrate Source Page
UPDATE core_spells SET
    source_page = json_extract(data, '$.source_page')
WHERE data IS NOT NULL;

-- 2. Migrate Spell Scaling
INSERT INTO spell_scaling (spell_id, type, text, dice, target)
SELECT 
    id,
    COALESCE(json_extract(data, '$.scaling.type'), 'text'), -- Default to 'text' if type is missing
    json_extract(data, '$.scaling.text'),
    json_extract(data, '$.scaling.dice'), -- Nullable
    json_extract(data, '$.scaling.target') -- Nullable
FROM core_spells
WHERE json_extract(data, '$.scaling') IS NOT NULL;

-- 3. Migrate Spell Summons
INSERT INTO spell_summons (spell_id, statblock, ac_formula, hp_formula)
SELECT 
    id,
    json_extract(data, '$.summon_text'),
    json_extract(data, '$.summon.ac'),
    json_extract(data, '$.summon.hp') -- Nullable
FROM core_spells
WHERE json_extract(data, '$.summon') IS NOT NULL;

-- 4. Migrate Spell Classes (CSV Splitting)
INSERT INTO spell_classes (spell_id, class_id)
WITH RECURSIVE split(spell_id, class_name, rest) AS (
  SELECT id, '', classes || ',' FROM core_spells WHERE classes IS NOT NULL AND classes <> ''
  UNION ALL
  SELECT spell_id, 
         trim(substr(rest, 0, instr(rest, ','))),
         substr(rest, instr(rest, ',')+1)
  FROM split
  WHERE rest <> ''
)
SELECT DISTINCT 
    spell_id, 
    CASE class_name
        WHEN 'Barbar' THEN 'barbar'
        WHEN 'Barde' THEN 'barde'
        WHEN 'Kleriker' THEN 'kleriker'
        WHEN 'Druide' THEN 'druide'
        WHEN 'Kämpfer' THEN 'kaempfer'
        WHEN 'Mönch' THEN 'moench'
        WHEN 'Paladin' THEN 'paladin'
        WHEN 'Waldläufer' THEN 'waldlaeufer'
        WHEN 'Schurke' THEN 'schurke'
        WHEN 'Zauberer' THEN 'zauberer'
        WHEN 'Hexenmeister' THEN 'hexenmeister'
        WHEN 'Magier' THEN 'magier'
        ELSE lower(class_name) -- Fallback
    END as class_id
FROM split 
WHERE class_name <> '';

COMMIT;
