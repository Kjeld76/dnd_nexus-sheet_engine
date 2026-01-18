-- Update weapon data with complete information from PHB 2024
-- This script updates the data column for all weapons with range, ammunition_type, and properties

-- Helper function to update weapon data
-- Format: UPDATE core_weapons SET data = json_set(data, '$.key', 'value') WHERE name = 'Weapon Name';

-- EINFACHE NAHKAMPFWAFFEN

-- Beil: Leicht, Wurfwaffe (Reichweite 6/18)
UPDATE core_weapons 
SET data = json_set(json_set(json_set(data, '$.properties', json('["light", "thrown"]')), '$.thrown_range', json('{"normal": 6, "max": 18}')), '$.source_page', 213)
WHERE name = 'Beil';

-- Dolch: Finesse, Leicht, Wurfwaffe (Reichweite 6/18)
UPDATE core_weapons 
SET data = json_set(json_set(json_set(json_set(data, '$.properties', json('["finesse", "light", "thrown"]')), '$.thrown_range', json('{"normal": 6, "max": 18}')), '$.source_page', 213), '$.property_details', json('{}'))
WHERE name = 'Dolch';

-- Kampfstab: Vielseitig (1W8)
UPDATE core_weapons 
SET data = json_set(json_set(data, '$.properties', json('["versatile"]')), '$.versatile_damage', '1W8')
WHERE name = 'Kampfstab';

-- Knüppel: Leicht
UPDATE core_weapons 
SET data = json_set(data, '$.properties', json('["light"]'))
WHERE name = 'Knüppel';

-- Leichter Hammer: Leicht, Wurfwaffe (Reichweite 6/18)
UPDATE core_weapons 
SET data = json_set(json_set(json_set(data, '$.properties', json('["light", "thrown"]')), '$.thrown_range', json('{"normal": 6, "max": 18}')), '$.source_page', 213)
WHERE name = 'Leichter Hammer' OR name = 'leichter Hammer';

-- Sichel: Leicht
UPDATE core_weapons 
SET data = json_set(data, '$.properties', json('["light"]'))
WHERE name = 'Sichel';

-- Speer: Vielseitig (1W8), Wurfwaffe (Reichweite 6/18)
UPDATE core_weapons 
SET data = json_set(json_set(json_set(json_set(data, '$.properties', json('["versatile", "thrown"]')), '$.versatile_damage', '1W8'), '$.thrown_range', json('{"normal": 6, "max": 18}')), '$.source_page', 213)
WHERE name = 'Speer';

-- Streitkolben: (keine besonderen Eigenschaften)
UPDATE core_weapons 
SET data = json_set(data, '$.properties', json('[]'))
WHERE name = 'Streitkolben';

-- Wurfspeer: Wurfwaffe (Reichweite 9/36)
UPDATE core_weapons 
SET data = json_set(json_set(json_set(data, '$.properties', json('["thrown"]')), '$.thrown_range', json('{"normal": 9, "max": 36}')), '$.source_page', 213)
WHERE name = 'Wurfspeer';

-- Zweihandknüppel: zweihändig
UPDATE core_weapons 
SET data = json_set(data, '$.properties', json('["two-handed"]'))
WHERE name = 'Zweihandknüppel';

-- EINFACHE FERNKAMPFWAFFEN

-- Kurzbogen: Geschosse (Reichweite 24/96, Pfeil), zweihändig
UPDATE core_weapons 
SET data = json_set(json_set(json_set(json_set(data, '$.properties', json('["ammunition", "two-handed"]')), '$.range', json('{"normal": 24, "max": 96}')), '$.ammunition_type', 'Pfeil'), '$.source_page', 213)
WHERE name = 'Kurzbogen';

-- Leichte Armbrust: Geschosse (Reichweite 24/96, Bolzen), Laden, Zweihändig
UPDATE core_weapons 
SET data = json_set(json_set(json_set(json_set(json_set(data, '$.properties', json('["ammunition", "loading", "two-handed"]')), '$.range', json('{"normal": 24, "max": 96}')), '$.ammunition_type', 'Bolzen'), '$.source_page', 213), '$.property_details', json('{}'))
WHERE name = 'Leichte Armbrust' OR name = 'leichte Armbrust';

-- Schleuder: Geschosse (Reichweite 9/36, Kugel)
UPDATE core_weapons 
SET data = json_set(json_set(json_set(json_set(data, '$.properties', json('["ammunition"]')), '$.range', json('{"normal": 9, "max": 36}')), '$.ammunition_type', 'Kugel'), '$.source_page', 213)
WHERE name = 'Schleuder';

-- Wurfpfeil: Finesse, Wurfwaffe (Reichweite 6/18)
UPDATE core_weapons 
SET data = json_set(json_set(json_set(json_set(data, '$.properties', json('["finesse", "thrown"]')), '$.thrown_range', json('{"normal": 6, "max": 18}')), '$.source_page', 213), '$.property_details', json('{}'))
WHERE name = 'Wurfpfeil';

-- NAHKAMPF KRIEGSWAFFEN

-- Dreizack: Vielseitig (1W10), Wurfwaffe (Reichweite 6/18)
UPDATE core_weapons 
SET data = json_set(json_set(json_set(json_set(data, '$.properties', json('["versatile", "thrown"]')), '$.versatile_damage', '1W10'), '$.thrown_range', json('{"normal": 6, "max": 18}')), '$.source_page', 213)
WHERE name = 'Dreizack';

-- Flegel: (keine besonderen Eigenschaften)
UPDATE core_weapons 
SET data = json_set(data, '$.properties', json('[]'))
WHERE name = 'Flegel';

-- Glefe: Schwer, Weitreichend, zweihändig
UPDATE core_weapons 
SET data = json_set(data, '$.properties', json('["heavy", "reach", "two-handed"]'))
WHERE name = 'Glefe';

-- Hellebarde: Schwer, Weitreichend, Zweihändig
UPDATE core_weapons 
SET data = json_set(data, '$.properties', json('["heavy", "reach", "two-handed"]'))
WHERE name = 'Hellebarde';

-- Kriegshammer: Vielseitig (1W10)
UPDATE core_weapons 
SET data = json_set(json_set(data, '$.properties', json('["versatile"]')), '$.versatile_damage', '1W10')
WHERE name = 'Kriegshammer';

-- Kriegspicke: Vielseitig (1W10)
UPDATE core_weapons 
SET data = json_set(json_set(data, '$.properties', json('["versatile"]')), '$.versatile_damage', '1W10')
WHERE name = 'Kriegspicke';

-- Krummsäbel: Finesse, Leicht
UPDATE core_weapons 
SET data = json_set(data, '$.properties', json('["finesse", "light"]'))
WHERE name = 'Krummsäbel';

-- Kurzschwert: Finesse, Leicht
UPDATE core_weapons 
SET data = json_set(data, '$.properties', json('["finesse", "light"]'))
WHERE name = 'Kurzschwert';

-- Langschwert: Vielseitig (1W10)
UPDATE core_weapons 
SET data = json_set(json_set(data, '$.properties', json('["versatile"]')), '$.versatile_damage', '1W10')
WHERE name = 'Langschwert';

-- Lanze: Schwer, Weitreichend, Zweihändig (sofern nicht beritten)
UPDATE core_weapons 
SET data = json_set(data, '$.properties', json('["heavy", "reach", "two-handed"]'))
WHERE name = 'Lanze';

-- Morgenstern: (keine besonderen Eigenschaften)
UPDATE core_weapons 
SET data = json_set(data, '$.properties', json('[]'))
WHERE name = 'Morgenstern';

-- Peitsche: Finesse, Weitreichend
UPDATE core_weapons 
SET data = json_set(data, '$.properties', json('["finesse", "reach"]'))
WHERE name = 'Peitsche';

-- Pike: Schwer, Weitreichend, Zweihändig
UPDATE core_weapons 
SET data = json_set(data, '$.properties', json('["heavy", "reach", "two-handed"]'))
WHERE name = 'Pike';

-- Rapier: Finesse
UPDATE core_weapons 
SET data = json_set(data, '$.properties', json('["finesse"]'))
WHERE name = 'Rapier';

-- Streitaxt: Vielseitig (1W10)
UPDATE core_weapons 
SET data = json_set(json_set(data, '$.properties', json('["versatile"]')), '$.versatile_damage', '1W10')
WHERE name = 'Streitaxt';

-- Zweihandaxt: Schwer, Zweihändig
UPDATE core_weapons 
SET data = json_set(data, '$.properties', json('["heavy", "two-handed"]'))
WHERE name = 'Zweihandaxt';

-- Zweihandhammer: Schwer, Zweihändig
UPDATE core_weapons 
SET data = json_set(data, '$.properties', json('["heavy", "two-handed"]'))
WHERE name = 'Zweihandhammer';

-- Zweihandschwert: Schwer, Zweihändig
UPDATE core_weapons 
SET data = json_set(data, '$.properties', json('["heavy", "two-handed"]'))
WHERE name = 'Zweihandschwert';

-- FERNKAMPF KRIEGSWAFFEN

-- Blasrohr: Geschosse (Reichweite 7,5/30, Blasrohrpfeil), Laden
UPDATE core_weapons 
SET data = json_set(json_set(json_set(json_set(data, '$.properties', json('["ammunition", "loading"]')), '$.range', json('{"normal": 7.5, "max": 30}')), '$.ammunition_type', 'Blasrohrpfeil'), '$.source_page', 213)
WHERE name = 'Blasrohr';

-- Handarmbrust: Geschosse (Reichweite 9/36, Bolzen), Leicht, Laden
UPDATE core_weapons 
SET data = json_set(json_set(json_set(json_set(json_set(data, '$.properties', json('["ammunition", "light", "loading"]')), '$.range', json('{"normal": 9, "max": 36}')), '$.ammunition_type', 'Bolzen'), '$.source_page', 213), '$.property_details', json('{}'))
WHERE name = 'Handarmbrust';

-- Langbogen: Geschosse (Reichweite 45/180, Pfeil), Schwer, Zweihändig
UPDATE core_weapons 
SET data = json_set(json_set(json_set(json_set(json_set(data, '$.properties', json('["ammunition", "heavy", "two-handed"]')), '$.range', json('{"normal": 45, "max": 180}')), '$.ammunition_type', 'Pfeil'), '$.source_page', 213), '$.property_details', json('{}'))
WHERE name = 'Langbogen';

-- Muskete: Geschosse (Reichweite 12/36, Kugel), Laden, Zweihändig
UPDATE core_weapons 
SET data = json_set(json_set(json_set(json_set(json_set(data, '$.properties', json('["ammunition", "loading", "two-handed"]')), '$.range', json('{"normal": 12, "max": 36}')), '$.ammunition_type', 'Kugel'), '$.source_page', 213), '$.property_details', json('{}'))
WHERE name = 'Muskete';

-- Pistole: Geschosse (Reichweite 9/27, Kugel), Laden
UPDATE core_weapons 
SET data = json_set(json_set(json_set(json_set(data, '$.properties', json('["ammunition", "loading"]')), '$.range', json('{"normal": 9, "max": 27}')), '$.ammunition_type', 'Kugel'), '$.source_page', 213)
WHERE name = 'Pistole';

-- Schwere Armbrust: Geschosse (Reichweite 30/120), Laden, Schwer, Zweihändig
UPDATE core_weapons 
SET data = json_set(json_set(json_set(json_set(json_set(data, '$.properties', json('["ammunition", "loading", "heavy", "two-handed"]')), '$.range', json('{"normal": 30, "max": 120}')), '$.ammunition_type', 'Bolzen'), '$.source_page', 213), '$.property_details', json('{}'))
WHERE name = 'Schwere Armbrust';

-- Stelle sicher, dass source_page für alle Waffen gesetzt ist
UPDATE core_weapons 
SET data = json_set(data, '$.source_page', 213)
WHERE json_extract(data, '$.source_page') IS NULL;
