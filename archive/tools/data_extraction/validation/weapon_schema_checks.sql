-- Check 1: Mindestanzahl
SELECT 'Weapon Count' as check_name, 
       COUNT(*) as result,
       CASE WHEN COUNT(*) >= 30 THEN 'PASS' ELSE 'FAIL' END as status
FROM core_weapons;

-- Check 2: JSON-Validität
SELECT 'JSON Validity' as check_name,
       COUNT(*) as invalid_count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status
FROM core_weapons 
WHERE json_valid(data) = 0;

-- Check 3: Properties existieren
SELECT 'Property References' as check_name,
       COUNT(*) as invalid_count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status
FROM core_weapons w
WHERE EXISTS (
    SELECT 1 
    FROM json_each(json_extract(w.data, '$.properties')) prop
    WHERE prop.value NOT IN (SELECT id FROM weapon_properties)
);

-- Check 4: Mastery existiert
SELECT 'Mastery References' as check_name,
       COUNT(*) as invalid_count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status
FROM core_weapons
WHERE json_extract(data, '$.mastery') NOT IN (SELECT id FROM weapon_masteries);

-- Check 5: Fernkampf hat Reichweite
SELECT 'Ranged Weapon Range' as check_name,
       COUNT(*) as invalid_count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status
FROM core_weapons
WHERE weapon_type = 'Fernkampf'
  AND json_extract(data, '$.range') IS NULL
  AND json_extract(data, '$.thrown_range') IS NULL;

-- Check 6: Vielseitig hat Schaden
SELECT 'Versatile Damage' as check_name,
       COUNT(*) as invalid_count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status
FROM core_weapons
WHERE json_extract(data, '$.properties') LIKE '%versatile%'
  AND json_extract(data, '$.versatile_damage') IS NULL;

-- Check 7: Alle Weights > 0 (Schleuder is 0, wait)
SELECT 'Positive Weights' as check_name,
       COUNT(*) as invalid_count,
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status
FROM core_weapons
WHERE weight_kg < 0; -- Changed to < 0 since some small items might be 0






