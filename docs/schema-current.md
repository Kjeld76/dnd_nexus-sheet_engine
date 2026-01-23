^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^|           title            |
|----------------------------|
| # Database Schema Overview |
| '' |
|----|
|    |
| 'Generated at: ' || datetime('now') |
|-------------------------------------|
| Generated at: 2026-01-20 14:23:20   |
| '' |
|----|
|    |
|  section  |
|-----------|
| ## Tables |
| '' |
|----|
|    |
|              name               |                             sql                              |
|---------------------------------|--------------------------------------------------------------|
| armor_properties                | CREATE TABLE armor_properties (                              |
|                                 |             id TEXT PRIMARY KEY,                             |
|                                 |             name TEXT NOT NULL,                              |
|                                 |             description TEXT NOT NULL,                       |
|                                 |             affects_field TEXT,  -- z.B. strength_requiremen |
|                                 | t, stealth_disadvantage, ac_bonus                            |
|                                 |             data TEXT                                        |
|                                 |         )                                                    |
| armor_property_mappings         | CREATE TABLE armor_property_mappings (                       |
|                                 |             armor_id TEXT NOT NULL,                          |
|                                 |             property_id TEXT NOT NULL,                       |
|                                 |             parameter_value TEXT,  -- JSON für komplexe Para |
|                                 | meter (z.B. strength_requirement, ac_bonus, damage_type)     |
|                                 |                                                              |
|                                 |             PRIMARY KEY (armor_id, property_id),             |
|                                 |             FOREIGN KEY (property_id) REFERENCES armor_prope |
|                                 | rties(id) ON DELETE CASCADE                                  |
|                                 |         )                                                    |
| background_starting_equipment   | CREATE TABLE background_starting_equipment (                 |
|                                 |             id INTEGER PRIMARY KEY AUTOINCREMENT,            |
|                                 |             background_id TEXT NOT NULL,                     |
|                                 |             option_label TEXT,  -- 'A', 'B', oder NULL für f |
|                                 | este Items                                                   |
|                                 |             item_name TEXT NOT NULL,  -- Name des Items (z.B |
|                                 | . 'Sichel', 'Buch (Gebete)', 'GOLD')                         |
|                                 |             item_id TEXT,  -- FK zu core_items/custom_items  |
|                                 | (falls gefunden)                                             |
|                                 |             tool_id TEXT,  -- FK zu core_tools/custom_tools  |
|                                 | (falls Tool)                                                 |
|                                 |             weapon_id TEXT,  -- FK zu core_weapons/custom_we |
|                                 | apons (falls Waffe)                                          |
|                                 |             quantity INTEGER DEFAULT 1,                      |
|                                 |             is_variant BOOLEAN DEFAULT 0,  -- TRUE für Varia |
|                                 | nten wie 'Buch (Gebete)'                                     |
|                                 |             base_item_name TEXT,  -- Basis-Name ohne Variant |
|                                 | e (z.B. 'Buch' für 'Buch (Gebete)')                          |
|                                 |             variant_suffix TEXT,  -- Varianten-Suffix (z.B.  |
|                                 | '(Gebete)' für 'Buch (Gebete)')                              |
|                                 |             gold REAL,  -- Gold-Menge (nur wenn item_name =  |
|                                 | 'GOLD')                                                      |
|                                 |             is_gold BOOLEAN DEFAULT 0,  -- TRUE wenn dies ei |
|                                 | n Gold-Eintrag ist                                           |
|                                 |             created_at INTEGER DEFAULT (unixepoch()),        |
|                                 |             FOREIGN KEY (background_id) REFERENCES core_back |
|                                 | grounds(id) ON DELETE CASCADE,                               |
|                                 |             FOREIGN KEY (item_id) REFERENCES core_items(id)  |
|                                 | ON DELETE SET NULL,                                          |
|                                 |             FOREIGN KEY (tool_id) REFERENCES core_tools(id)  |
|                                 | ON DELETE SET NULL,                                          |
|                                 |             FOREIGN KEY (weapon_id) REFERENCES core_weapons( |
|                                 | id) ON DELETE SET NULL                                       |
|                                 |         )                                                    |
| character_inventory             | CREATE TABLE character_inventory (                           |
|                                 |             id TEXT PRIMARY KEY,                             |
|                                 |             character_id TEXT NOT NULL,                      |
|                                 |             item_id TEXT NOT NULL,                           |
|                                 |             item_type TEXT NOT NULL CHECK(item_type IN ('cor |
|                                 | e_item', 'custom_item', 'core_weapon', 'custom_weapon', 'cor |
|                                 | e_armor', 'custom_armor', 'core_magic_item', 'custom_magic_i |
|                                 | tem')),                                                      |
|                                 |             quantity INTEGER NOT NULL DEFAULT 1,             |
|                                 |             is_equipped BOOLEAN NOT NULL DEFAULT 0,          |
|                                 |             container_id TEXT, -- For nested containers      |
|                                 |             custom_name TEXT,                                |
|                                 |             custom_description TEXT,                         |
|                                 |             data JSON,        -- Container-specific data or  |
|                                 | overrides                                                    |
|                                 |             created_at INTEGER DEFAULT (unixepoch()),        |
|                                 |             updated_at INTEGER DEFAULT (unixepoch()),        |
|                                 |             FOREIGN KEY (character_id) REFERENCES characters |
|                                 | (id) ON DELETE CASCADE,                                      |
|                                 |             FOREIGN KEY (container_id) REFERENCES character_ |
|                                 | inventory(id) ON DELETE SET NULL                             |
|                                 |         )                                                    |
| characters                      | CREATE TABLE characters (                                    |
|                                 |             id TEXT PRIMARY KEY,                             |
|                                 |             data TEXT NOT NULL,                              |
|                                 |             created_at INTEGER DEFAULT (unixepoch()),        |
|                                 |             updated_at INTEGER DEFAULT (unixepoch())         |
|                                 |         )                                                    |
| class_starting_equipment        | CREATE TABLE class_starting_equipment (                      |
|                                 |             id INTEGER PRIMARY KEY AUTOINCREMENT,            |
|                                 |             class_id TEXT NOT NULL,                          |
|                                 |             option_label TEXT,  -- 'A', 'B', 'C' oder NULL f |
|                                 | ür feste Items                                               |
|                                 |             item_name TEXT NOT NULL,  -- Name des Items (z.B |
|                                 | . 'Lederrüstung', 'Zweihandaxt', 'GOLD')                     |
|                                 |             item_id TEXT,  -- FK zu core_items/custom_items  |
|                                 | (falls gefunden)                                             |
|                                 |             tool_id TEXT,  -- FK zu core_tools/custom_tools  |
|                                 | (falls Tool)                                                 |
|                                 |             weapon_id TEXT,  -- FK zu core_weapons/custom_we |
|                                 | apons (falls Waffe)                                          |
|                                 |             armor_id TEXT,  -- FK zu core_armors/custom_armo |
|                                 | rs (falls Rüstung)                                           |
|                                 |             quantity INTEGER DEFAULT 1,                      |
|                                 |             is_variant BOOLEAN DEFAULT 0,  -- TRUE für Varia |
|                                 | nten wie 'Dolch (x5)'                                        |
|                                 |             base_item_name TEXT,  -- Basis-Name ohne Variant |
|                                 | e                                                            |
|                                 |             variant_suffix TEXT,  -- Varianten-Suffix (z.B.  |
|                                 | '(x5)')                                                      |
|                                 |             gold REAL,  -- Gold-Menge (nur wenn item_name =  |
|                                 | 'GOLD')                                                      |
|                                 |             is_gold BOOLEAN DEFAULT 0,  -- TRUE wenn dies ei |
|                                 | n Gold-Eintrag ist                                           |
|                                 |             created_at INTEGER DEFAULT (unixepoch()), is_cus |
|                                 | tom BOOLEAN DEFAULT 0,                                       |
|                                 |             FOREIGN KEY (class_id) REFERENCES core_classes(i |
|                                 | d) ON DELETE CASCADE,                                        |
|                                 |             FOREIGN KEY (item_id) REFERENCES core_items(id)  |
|                                 | ON DELETE SET NULL,                                          |
|                                 |             FOREIGN KEY (tool_id) REFERENCES core_tools(id)  |
|                                 | ON DELETE SET NULL,                                          |
|                                 |             FOREIGN KEY (weapon_id) REFERENCES core_weapons( |
|                                 | id) ON DELETE SET NULL,                                      |
|                                 |             FOREIGN KEY (armor_id) REFERENCES core_armors(id |
|                                 | ) ON DELETE SET NULL                                         |
|                                 |         )                                                    |
| core_armor_property_mappings    | CREATE TABLE core_armor_property_mappings (                  |
|                                 |             armor_id TEXT NOT NULL,                          |
|                                 |             property_id TEXT NOT NULL,                       |
|                                 |             parameter_value TEXT,                            |
|                                 |             PRIMARY KEY (armor_id, property_id),             |
|                                 |             FOREIGN KEY (armor_id) REFERENCES core_armors(id |
|                                 | ) ON DELETE CASCADE,                                         |
|                                 |             FOREIGN KEY (property_id) REFERENCES armor_prope |
|                                 | rties(id) ON DELETE CASCADE                                  |
|                                 |         )                                                    |
| core_armors                     | CREATE TABLE core_armors (                                   |
|                                 |             id TEXT PRIMARY KEY,                             |
|                                 |             name TEXT NOT NULL,                              |
|                                 |             category TEXT NOT NULL CHECK(category IN ('leich |
|                                 | te_ruestung', 'mittelschwere_ruestung', 'schwere_ruestung',  |
|                                 | 'schild')),                                                  |
|                                 |             base_ac INTEGER,  -- NULL für Formeln (z.B. 11 + |
|                                 |  GES)                                                        |
|                                 |             ac_bonus INTEGER DEFAULT 0,  -- NEU: Für Schilde |
|                                 |  (+2)                                                        |
|                                 |             ac_formula TEXT,  -- NEU: z.B. 11 + DEX, 12 + DE |
|                                 | X (max. 2), 14                                               |
|                                 |             strength_requirement INTEGER,  -- STÄ 13 oder ST |
|                                 | Ä 15                                                         |
|                                 |             stealth_disadvantage BOOLEAN NOT NULL DEFAULT 0, |
|                                 |             don_time_minutes INTEGER,  -- NEU: Anlegezeit in |
|                                 |  Minuten                                                     |
|                                 |             doff_time_minutes INTEGER,  -- NEU: Ablegezeit i |
|                                 | n Minuten                                                    |
|                                 |             weight_kg REAL NOT NULL,                         |
|                                 |             cost_gp REAL NOT NULL,                           |
|                                 |             data JSON NOT NULL,                              |
|                                 |             created_at INTEGER DEFAULT (unixepoch())         |
|                                 |         , category_label TEXT)                               |
| core_backgrounds                | CREATE TABLE core_backgrounds (id TEXT PRIMARY KEY, name TEX |
|                                 | T NOT NULL, data TEXT NOT NULL, created_at INTEGER DEFAULT ( |
|                                 | unixepoch()))                                                |
| core_class_features             | CREATE TABLE core_class_features (                           |
|                                 |       id TEXT PRIMARY KEY,                                   |
|                                 |       class_id TEXT NOT NULL,                                |
|                                 |       subclass_id TEXT,                                      |
|                                 |       name TEXT NOT NULL,                                    |
|                                 |       description TEXT NOT NULL,                             |
|                                 |       level INTEGER NOT NULL,                                |
|                                 |       feature_type TEXT NOT NULL CHECK(feature_type IN (     |
|                                 |         'passive', 'active', 'progression', 'choice', 'react |
|                                 | ion', 'bonus_action'                                         |
|                                 |       )),                                                    |
|                                 |       effects JSON NOT NULL,                                 |
|                                 |       conditions JSON,                                       |
|                                 |       uses_per_rest TEXT,                                    |
|                                 |       rest_type TEXT CHECK(rest_type IN ('short', 'long', NU |
|                                 | LL)),                                                        |
|                                 |       created_at INTEGER DEFAULT (unixepoch()),              |
|                                 |       FOREIGN KEY (class_id) REFERENCES core_classes(id) ON  |
|                                 | DELETE CASCADE                                               |
|                                 |     )                                                        |
| core_classes                    | CREATE TABLE core_classes (id TEXT PRIMARY KEY, name TEXT NO |
|                                 | T NULL, data TEXT NOT NULL)                                  |
| core_equipment                  | CREATE TABLE core_equipment (                                |
|                                 |     id TEXT PRIMARY KEY,                                     |
|                                 |     name TEXT NOT NULL,                                      |
|                                 |     description TEXT NOT NULL,                               |
|                                 |     total_cost_gp REAL,                                      |
|                                 |     total_weight_kg REAL,                                    |
|                                 |     items JSON NOT NULL,                                     |
|                                 |     tools JSON,                                              |
|                                 |     data JSON,                                               |
|                                 |     created_at INTEGER DEFAULT (unixepoch())                 |
|                                 | )                                                            |
| core_equipment_items            | CREATE TABLE core_equipment_items (                          |
|                                 |             equipment_id TEXT NOT NULL,                      |
|                                 |             item_id TEXT NOT NULL,                           |
|                                 |             quantity INTEGER NOT NULL DEFAULT 1,             |
|                                 |             PRIMARY KEY (equipment_id, item_id),             |
|                                 |             FOREIGN KEY (equipment_id) REFERENCES core_equip |
|                                 | ment(id) ON DELETE CASCADE,                                  |
|                                 |             FOREIGN KEY (item_id) REFERENCES core_items(id)  |
|                                 | ON DELETE CASCADE                                            |
|                                 |         )                                                    |
| core_equipment_tools            | CREATE TABLE core_equipment_tools (                          |
|                                 |             equipment_id TEXT NOT NULL,                      |
|                                 |             tool_id TEXT NOT NULL,                           |
|                                 |             quantity INTEGER NOT NULL DEFAULT 1,             |
|                                 |             source_table TEXT NOT NULL CHECK(source_table IN |
|                                 |  ('core_tools', 'custom_tools')),                            |
|                                 |             PRIMARY KEY (equipment_id, tool_id, source_table |
|                                 | ),                                                           |
|                                 |             FOREIGN KEY (equipment_id) REFERENCES core_equip |
|                                 | ment(id) ON DELETE CASCADE                                   |
|                                 |         )                                                    |
| core_feats                      | CREATE TABLE core_feats (id TEXT PRIMARY KEY, name TEXT NOT  |
|                                 | NULL, category TEXT NOT NULL, data JSON NOT NULL, created_at |
|                                 |  INTEGER DEFAULT (unixepoch()))                              |
| core_feature_options            | CREATE TABLE core_feature_options (                          |
|                                 |             id TEXT PRIMARY KEY,                             |
|                                 |             feature_id TEXT NOT NULL,                        |
|                                 |             option_name TEXT NOT NULL,                       |
|                                 |             option_description TEXT NOT NULL,                |
|                                 |             display_order INTEGER NOT NULL DEFAULT 0,        |
|                                 |             created_at INTEGER DEFAULT (unixepoch()),        |
|                                 |             FOREIGN KEY (feature_id) REFERENCES core_class_f |
|                                 | eatures(id) ON DELETE CASCADE                                |
|                                 |         )                                                    |
| core_gear                       | CREATE TABLE core_gear (                                     |
|                                 |             id TEXT PRIMARY KEY,                             |
|                                 |             name TEXT NOT NULL,                              |
|                                 |             description TEXT NOT NULL,                       |
|                                 |             cost_gp REAL NOT NULL,                           |
|                                 |             weight_kg REAL NOT NULL,                         |
|                                 |             data JSON,                                       |
|                                 |             created_at INTEGER DEFAULT (unixepoch())         |
|                                 |         )                                                    |
| core_items                      | CREATE TABLE core_items (                                    |
|                                 |     id TEXT PRIMARY KEY,                                     |
|                                 |     name TEXT NOT NULL,                                      |
|                                 |     description TEXT NOT NULL,                               |
|                                 |     cost_gp REAL NOT NULL,                                   |
|                                 |     weight_kg REAL NOT NULL,                                 |
|                                 |     category TEXT,                                           |
|                                 |     data JSON,                                               |
|                                 |     created_at INTEGER DEFAULT (unixepoch())                 |
|                                 | )                                                            |
| core_mag_armor                  | CREATE TABLE core_mag_armor (                                |
|                                 |             item_base_id TEXT PRIMARY KEY,                   |
|                                 |             armor_type TEXT,                                 |
|                                 |             ac_bonus INTEGER,                                |
|                                 |             FOREIGN KEY (item_base_id) REFERENCES core_mag_i |
|                                 | tems_base(id) ON DELETE CASCADE                              |
|                                 |         )                                                    |
| core_mag_consumables            | CREATE TABLE core_mag_consumables (                          |
|                                 |             item_base_id TEXT PRIMARY KEY,                   |
|                                 |             type TEXT NOT NULL,                              |
|                                 |             FOREIGN KEY (item_base_id) REFERENCES core_mag_i |
|                                 | tems_base(id) ON DELETE CASCADE                              |
|                                 |         )                                                    |
| core_mag_focus_items            | CREATE TABLE core_mag_focus_items (                          |
|                                 |             item_base_id TEXT PRIMARY KEY,                   |
|                                 |             focus_type TEXT NOT NULL,                        |
|                                 |             charges_max INTEGER,                             |
|                                 |             recharge TEXT,                                   |
|                                 |             FOREIGN KEY (item_base_id) REFERENCES core_mag_i |
|                                 | tems_base(id) ON DELETE CASCADE                              |
|                                 |         )                                                    |
| core_mag_item_crafting          | CREATE TABLE core_mag_item_crafting (                        |
|                                 |             item_base_id TEXT NOT NULL,                      |
|                                 |             tool_id TEXT NOT NULL,                           |
|                                 |             source_table TEXT NOT NULL CHECK(source_table IN |
|                                 |  ('core_tools', 'custom_tools')),                            |
|                                 |             PRIMARY KEY (item_base_id, tool_id, source_table |
|                                 | ),                                                           |
|                                 |             FOREIGN KEY (item_base_id) REFERENCES core_mag_i |
|                                 | tems_base(id) ON DELETE CASCADE                              |
|                                 |         )                                                    |
| core_mag_items_base             | CREATE TABLE core_mag_items_base (                           |
|                                 |             id TEXT PRIMARY KEY,                             |
|                                 |             name TEXT NOT NULL,                              |
|                                 |             rarity TEXT NOT NULL,                            |
|                                 |             category TEXT NOT NULL,                          |
|                                 |             source_book TEXT,                                |
|                                 |             source_page INTEGER,                             |
|                                 |             requires_attunement BOOLEAN NOT NULL DEFAULT 0,  |
|                                 |             facts_json TEXT NOT NULL,                        |
|                                 |             created_at INTEGER DEFAULT (unixepoch())         |
|                                 |         , data JSON)                                         |
| core_mag_jewelry                | CREATE TABLE core_mag_jewelry (                              |
|                                 |             item_base_id TEXT PRIMARY KEY,                   |
|                                 |             type TEXT NOT NULL,                              |
|                                 |             FOREIGN KEY (item_base_id) REFERENCES core_mag_i |
|                                 | tems_base(id) ON DELETE CASCADE                              |
|                                 |         )                                                    |
| core_mag_weapons                | CREATE TABLE core_mag_weapons (                              |
|                                 |             item_base_id TEXT PRIMARY KEY,                   |
|                                 |             weapon_type TEXT,                                |
|                                 |             attack_bonus INTEGER,                            |
|                                 |             damage_bonus INTEGER,                            |
|                                 |             FOREIGN KEY (item_base_id) REFERENCES core_mag_i |
|                                 | tems_base(id) ON DELETE CASCADE                              |
|                                 |         )                                                    |
| core_mag_wondrous               | CREATE TABLE core_mag_wondrous (                             |
|                                 |             item_base_id TEXT PRIMARY KEY,                   |
|                                 |             FOREIGN KEY (item_base_id) REFERENCES core_mag_i |
|                                 | tems_base(id) ON DELETE CASCADE                              |
|                                 |         )                                                    |
| core_progression_tables         | CREATE TABLE core_progression_tables (                       |
|                                 |       id INTEGER PRIMARY KEY AUTOINCREMENT,                  |
|                                 |       class_id TEXT NOT NULL,                                |
|                                 |       level INTEGER NOT NULL,                                |
|                                 |       proficiency_bonus INTEGER NOT NULL,                    |
|                                 |       feature_names TEXT,                                    |
|                                 |       class_specific_data JSON,                              |
|                                 |       created_at INTEGER DEFAULT (unixepoch()),              |
|                                 |       UNIQUE(class_id, level),                               |
|                                 |       FOREIGN KEY (class_id) REFERENCES core_classes(id) ON  |
|                                 | DELETE CASCADE                                               |
|                                 |     )                                                        |
| core_skills                     | CREATE TABLE core_skills (id TEXT PRIMARY KEY, name TEXT NOT |
|                                 |  NULL, ability TEXT NOT NULL, description TEXT NOT NULL, cre |
|                                 | ated_at INTEGER DEFAULT (unixepoch()))                       |
| core_species                    | CREATE TABLE core_species (id TEXT PRIMARY KEY, name TEXT NO |
|                                 | T NULL, data TEXT NOT NULL)                                  |
| core_spells                     | CREATE TABLE core_spells (id TEXT PRIMARY KEY, name TEXT NOT |
|                                 |  NULL, level INTEGER NOT NULL, school TEXT NOT NULL, casting |
|                                 | _time TEXT NOT NULL, range TEXT NOT NULL, components TEXT NO |
|                                 | T NULL, material_components TEXT, duration TEXT NOT NULL, co |
|                                 | ncentration BOOLEAN DEFAULT 0, ritual BOOLEAN DEFAULT 0, des |
|                                 | cription TEXT NOT NULL, higher_levels TEXT, classes TEXT NOT |
|                                 |  NULL, data JSON NOT NULL)                                   |
| core_subclasses                 | CREATE TABLE core_subclasses (                               |
|                                 |       id TEXT PRIMARY KEY,                                   |
|                                 |       class_id TEXT NOT NULL,                                |
|                                 |       name TEXT NOT NULL,                                    |
|                                 |       description TEXT NOT NULL,                             |
|                                 |       level INTEGER NOT NULL,                                |
|                                 |       created_at INTEGER DEFAULT (unixepoch()),              |
|                                 |       FOREIGN KEY (class_id) REFERENCES core_classes(id) ON  |
|                                 | DELETE CASCADE                                               |
|                                 |     )                                                        |
| core_tools                      | CREATE TABLE core_tools (                                    |
|                                 |             id TEXT PRIMARY KEY,                             |
|                                 |             name TEXT NOT NULL,                              |
|                                 |             category TEXT NOT NULL,                          |
|                                 |             cost_gp REAL NOT NULL,                           |
|                                 |             weight_kg REAL NOT NULL,                         |
|                                 |             data JSON NOT NULL, -- JSON: { abilities, use_ac |
|                                 | tions, crafting_items, parent_tool }                         |
|                                 |             created_at INTEGER DEFAULT (unixepoch())         |
|                                 |         )                                                    |
| core_weapon_property_mappings   | CREATE TABLE core_weapon_property_mappings (                 |
|                                 |             weapon_id TEXT NOT NULL,                         |
|                                 |             property_id TEXT NOT NULL,                       |
|                                 |             parameter_value TEXT,                            |
|                                 |             PRIMARY KEY (weapon_id, property_id),            |
|                                 |             FOREIGN KEY (weapon_id) REFERENCES core_weapons( |
|                                 | id) ON DELETE CASCADE,                                       |
|                                 |             FOREIGN KEY (property_id) REFERENCES weapon_prop |
|                                 | erties(id) ON DELETE CASCADE                                 |
|                                 |         )                                                    |
| core_weapons                    | CREATE TABLE core_weapons (id TEXT PRIMARY KEY, name TEXT NO |
|                                 | T NULL, category TEXT NOT NULL, weapon_type TEXT NOT NULL, d |
|                                 | amage_dice TEXT NOT NULL, damage_type TEXT NOT NULL, weight_ |
|                                 | kg REAL NOT NULL, cost_gp REAL NOT NULL, data JSON NOT NULL, |
|                                 |  created_at INTEGER DEFAULT (unixepoch()), mastery_id TEXT,  |
|                                 | category_label TEXT, weapon_subtype TEXT)                    |
| custom_armor_property_mappings  | CREATE TABLE custom_armor_property_mappings (                |
|                                 |             armor_id TEXT NOT NULL,                          |
|                                 |             property_id TEXT NOT NULL,                       |
|                                 |             parameter_value TEXT,                            |
|                                 |             PRIMARY KEY (armor_id, property_id),             |
|                                 |             FOREIGN KEY (armor_id) REFERENCES custom_armors( |
|                                 | id) ON DELETE CASCADE,                                       |
|                                 |             FOREIGN KEY (property_id) REFERENCES armor_prope |
|                                 | rties(id) ON DELETE CASCADE                                  |
|                                 |         )                                                    |
| custom_armors                   | CREATE TABLE custom_armors (                                 |
|                                 |             id TEXT PRIMARY KEY,                             |
|                                 |             name TEXT NOT NULL,                              |
|                                 |             category TEXT NOT NULL CHECK(category IN ('leich |
|                                 | te_ruestung', 'mittelschwere_ruestung', 'schwere_ruestung',  |
|                                 | 'schild')),                                                  |
|                                 |             base_ac INTEGER,  -- NULL für Formeln (z.B. 11 + |
|                                 |  GES)                                                        |
|                                 |             ac_bonus INTEGER DEFAULT 0,  -- NEU: Für Schilde |
|                                 |  (+2)                                                        |
|                                 |             ac_formula TEXT,  -- NEU: z.B. 11 + DEX, 12 + DE |
|                                 | X (max. 2), 14                                               |
|                                 |             strength_requirement INTEGER,  -- STÄ 13 oder ST |
|                                 | Ä 15                                                         |
|                                 |             stealth_disadvantage BOOLEAN NOT NULL DEFAULT 0, |
|                                 |             don_time_minutes INTEGER,  -- NEU: Anlegezeit in |
|                                 |  Minuten                                                     |
|                                 |             doff_time_minutes INTEGER,  -- NEU: Ablegezeit i |
|                                 | n Minuten                                                    |
|                                 |             weight_kg REAL NOT NULL,                         |
|                                 |             cost_gp REAL NOT NULL,                           |
|                                 |             data JSON NOT NULL,                              |
|                                 |             parent_id TEXT,                                  |
|                                 |             is_homebrew BOOLEAN DEFAULT 1,                   |
|                                 |             created_at INTEGER DEFAULT (unixepoch()),        |
|                                 |             updated_at INTEGER DEFAULT (unixepoch()), catego |
|                                 | ry_label TEXT,                                               |
|                                 |             FOREIGN KEY (parent_id) REFERENCES core_armors(i |
|                                 | d) ON DELETE CASCADE                                         |
|                                 |         )                                                    |
| custom_backgrounds              | CREATE TABLE custom_backgrounds (id TEXT PRIMARY KEY, name T |
|                                 | EXT NOT NULL, data TEXT NOT NULL, parent_id TEXT, is_homebre |
|                                 | w BOOLEAN DEFAULT 1, created_at INTEGER DEFAULT (unixepoch() |
|                                 | ), updated_at INTEGER DEFAULT (unixepoch()), FOREIGN KEY (pa |
|                                 | rent_id) REFERENCES core_backgrounds(id))                    |
| custom_class_features           | CREATE TABLE custom_class_features (id TEXT PRIMARY KEY, cla |
|                                 | ss_id TEXT NOT NULL, class_source TEXT NOT NULL CHECK(class_ |
|                                 | source IN ('core', 'custom')), subclass_id TEXT, subclass_so |
|                                 | urce TEXT CHECK(subclass_source IN ('core', 'custom', NULL)) |
|                                 | , parent_id TEXT, name TEXT NOT NULL, description TEXT NOT N |
|                                 | ULL, level INTEGER NOT NULL, feature_type TEXT NOT NULL CHEC |
|                                 | K(feature_type IN ('passive', 'active', 'progression', 'choi |
|                                 | ce', 'reaction', 'bonus_action')), effects JSON NOT NULL, co |
|                                 | nditions JSON, uses_per_rest TEXT, rest_type TEXT CHECK(rest |
|                                 | _type IN ('short', 'long', NULL)), created_at INTEGER DEFAUL |
|                                 | T (unixepoch()), updated_at INTEGER DEFAULT (unixepoch()), F |
|                                 | OREIGN KEY (parent_id) REFERENCES core_class_features(id) ON |
|                                 |  DELETE SET NULL)                                            |
| custom_classes                  | CREATE TABLE custom_classes (                                |
|                                 |             id TEXT PRIMARY KEY,                             |
|                                 |             name TEXT NOT NULL,                              |
|                                 |             data TEXT NOT NULL,                              |
|                                 |             parent_id TEXT,                                  |
|                                 |             is_homebrew BOOLEAN DEFAULT 1,                   |
|                                 |             created_at INTEGER DEFAULT (unixepoch()),        |
|                                 |             updated_at INTEGER DEFAULT (unixepoch()),        |
|                                 |             FOREIGN KEY (parent_id) REFERENCES core_classes( |
|                                 | id)                                                          |
|                                 |         )                                                    |
| custom_equipment                | CREATE TABLE custom_equipment (                              |
|                                 |     id TEXT PRIMARY KEY,                                     |
|                                 |     name TEXT NOT NULL,                                      |
|                                 |     description TEXT NOT NULL,                               |
|                                 |     total_cost_gp REAL,                                      |
|                                 |     total_weight_kg REAL,                                    |
|                                 |     items JSON NOT NULL,                                     |
|                                 |     tools JSON,                                              |
|                                 |     data JSON,                                               |
|                                 |     parent_id TEXT,                                          |
|                                 |     is_homebrew BOOLEAN DEFAULT 1,                           |
|                                 |     created_at INTEGER DEFAULT (unixepoch()),                |
|                                 |     updated_at INTEGER DEFAULT (unixepoch()),                |
|                                 |     FOREIGN KEY (parent_id) REFERENCES core_equipment(id)    |
|                                 | )                                                            |
| custom_equipment_items          | CREATE TABLE custom_equipment_items (                        |
|                                 |             equipment_id TEXT NOT NULL,                      |
|                                 |             item_id TEXT NOT NULL,                           |
|                                 |             quantity INTEGER NOT NULL DEFAULT 1,             |
|                                 |             PRIMARY KEY (equipment_id, item_id),             |
|                                 |             FOREIGN KEY (equipment_id) REFERENCES custom_equ |
|                                 | ipment(id) ON DELETE CASCADE,                                |
|                                 |             FOREIGN KEY (item_id) REFERENCES core_items(id)  |
|                                 | ON DELETE CASCADE                                            |
|                                 |         )                                                    |
| custom_equipment_tools          | CREATE TABLE custom_equipment_tools (                        |
|                                 |             equipment_id TEXT NOT NULL,                      |
|                                 |             tool_id TEXT NOT NULL,                           |
|                                 |             quantity INTEGER NOT NULL DEFAULT 1,             |
|                                 |             source_table TEXT NOT NULL CHECK(source_table IN |
|                                 |  ('core_tools', 'custom_tools')),                            |
|                                 |             PRIMARY KEY (equipment_id, tool_id, source_table |
|                                 | ),                                                           |
|                                 |             FOREIGN KEY (equipment_id) REFERENCES custom_equ |
|                                 | ipment(id) ON DELETE CASCADE                                 |
|                                 |         )                                                    |
| custom_feats                    | CREATE TABLE custom_feats (id TEXT PRIMARY KEY, name TEXT NO |
|                                 | T NULL, category TEXT NOT NULL, data JSON NOT NULL, parent_i |
|                                 | d TEXT, is_homebrew BOOLEAN DEFAULT 1, created_at INTEGER DE |
|                                 | FAULT (unixepoch()), updated_at INTEGER DEFAULT (unixepoch() |
|                                 | ), FOREIGN KEY (parent_id) REFERENCES core_feats(id))        |
| custom_feature_options          | CREATE TABLE custom_feature_options (                        |
|                                 |             id TEXT PRIMARY KEY,                             |
|                                 |             feature_id TEXT NOT NULL,                        |
|                                 |             option_name TEXT NOT NULL,                       |
|                                 |             option_description TEXT NOT NULL,                |
|                                 |             display_order INTEGER NOT NULL DEFAULT 0,        |
|                                 |             parent_id TEXT,                                  |
|                                 |             created_at INTEGER DEFAULT (unixepoch()),        |
|                                 |             updated_at INTEGER DEFAULT (unixepoch()),        |
|                                 |             FOREIGN KEY (feature_id) REFERENCES custom_class |
|                                 | _features(id) ON DELETE CASCADE,                             |
|                                 |             FOREIGN KEY (parent_id) REFERENCES core_feature_ |
|                                 | options(id) ON DELETE SET NULL                               |
|                                 |         )                                                    |
| custom_gear                     | CREATE TABLE custom_gear (                                   |
|                                 |             id TEXT PRIMARY KEY,                             |
|                                 |             name TEXT NOT NULL,                              |
|                                 |             description TEXT NOT NULL,                       |
|                                 |             cost_gp REAL NOT NULL,                           |
|                                 |             weight_kg REAL NOT NULL,                         |
|                                 |             data JSON,                                       |
|                                 |             parent_id TEXT,                                  |
|                                 |             is_homebrew BOOLEAN DEFAULT 1,                   |
|                                 |             created_at INTEGER DEFAULT (unixepoch()),        |
|                                 |             updated_at INTEGER DEFAULT (unixepoch()),        |
|                                 |             FOREIGN KEY (parent_id) REFERENCES core_gear(id) |
|                                 |         )                                                    |
| custom_items                    | CREATE TABLE custom_items (                                  |
|                                 |     id TEXT PRIMARY KEY,                                     |
|                                 |     name TEXT NOT NULL,                                      |
|                                 |     description TEXT NOT NULL,                               |
|                                 |     cost_gp REAL NOT NULL,                                   |
|                                 |     weight_kg REAL NOT NULL,                                 |
|                                 |     category TEXT,                                           |
|                                 |     data JSON,                                               |
|                                 |     parent_id TEXT,                                          |
|                                 |     is_homebrew BOOLEAN DEFAULT 1,                           |
|                                 |     created_at INTEGER DEFAULT (unixepoch()),                |
|                                 |     updated_at INTEGER DEFAULT (unixepoch()),                |
|                                 |     FOREIGN KEY (parent_id) REFERENCES core_items(id)        |
|                                 | )                                                            |
| custom_mag_armor                | CREATE TABLE custom_mag_armor (                              |
|                                 |             item_base_id TEXT PRIMARY KEY,                   |
|                                 |             armor_type TEXT,                                 |
|                                 |             ac_bonus INTEGER,                                |
|                                 |             FOREIGN KEY (item_base_id) REFERENCES custom_mag |
|                                 | _items_base(id) ON DELETE CASCADE                            |
|                                 |         )                                                    |
| custom_mag_consumables          | CREATE TABLE custom_mag_consumables (                        |
|                                 |             item_base_id TEXT PRIMARY KEY,                   |
|                                 |             type TEXT NOT NULL,                              |
|                                 |             FOREIGN KEY (item_base_id) REFERENCES custom_mag |
|                                 | _items_base(id) ON DELETE CASCADE                            |
|                                 |         )                                                    |
| custom_mag_focus_items          | CREATE TABLE custom_mag_focus_items (                        |
|                                 |             item_base_id TEXT PRIMARY KEY,                   |
|                                 |             focus_type TEXT NOT NULL,                        |
|                                 |             charges_max INTEGER,                             |
|                                 |             recharge TEXT,                                   |
|                                 |             FOREIGN KEY (item_base_id) REFERENCES custom_mag |
|                                 | _items_base(id) ON DELETE CASCADE                            |
|                                 |         )                                                    |
| custom_mag_item_crafting        | CREATE TABLE custom_mag_item_crafting (                      |
|                                 |             item_base_id TEXT NOT NULL,                      |
|                                 |             tool_id TEXT NOT NULL,                           |
|                                 |             source_table TEXT NOT NULL CHECK(source_table IN |
|                                 |  ('core_tools', 'custom_tools')),                            |
|                                 |             PRIMARY KEY (item_base_id, tool_id, source_table |
|                                 | ),                                                           |
|                                 |             FOREIGN KEY (item_base_id) REFERENCES custom_mag |
|                                 | _items_base(id) ON DELETE CASCADE                            |
|                                 |         )                                                    |
| custom_mag_items_base           | CREATE TABLE custom_mag_items_base (                         |
|                                 |             id TEXT PRIMARY KEY,                             |
|                                 |             name TEXT NOT NULL,                              |
|                                 |             rarity TEXT NOT NULL,                            |
|                                 |             category TEXT NOT NULL,                          |
|                                 |             source_book TEXT,                                |
|                                 |             source_page INTEGER,                             |
|                                 |             requires_attunement BOOLEAN NOT NULL DEFAULT 0,  |
|                                 |             facts_json TEXT NOT NULL,                        |
|                                 |             parent_id TEXT,                                  |
|                                 |             is_homebrew BOOLEAN DEFAULT 1,                   |
|                                 |             created_at INTEGER DEFAULT (unixepoch()),        |
|                                 |             updated_at INTEGER DEFAULT (unixepoch()), data J |
|                                 | SON,                                                         |
|                                 |             FOREIGN KEY (parent_id) REFERENCES core_mag_item |
|                                 | s_base(id) ON DELETE CASCADE                                 |
|                                 |         )                                                    |
| custom_mag_jewelry              | CREATE TABLE custom_mag_jewelry (                            |
|                                 |             item_base_id TEXT PRIMARY KEY,                   |
|                                 |             type TEXT NOT NULL,                              |
|                                 |             FOREIGN KEY (item_base_id) REFERENCES custom_mag |
|                                 | _items_base(id) ON DELETE CASCADE                            |
|                                 |         )                                                    |
| custom_mag_weapons              | CREATE TABLE custom_mag_weapons (                            |
|                                 |             item_base_id TEXT PRIMARY KEY,                   |
|                                 |             weapon_type TEXT,                                |
|                                 |             attack_bonus INTEGER,                            |
|                                 |             damage_bonus INTEGER,                            |
|                                 |             FOREIGN KEY (item_base_id) REFERENCES custom_mag |
|                                 | _items_base(id) ON DELETE CASCADE                            |
|                                 |         )                                                    |
| custom_mag_wondrous             | CREATE TABLE custom_mag_wondrous (                           |
|                                 |             item_base_id TEXT PRIMARY KEY,                   |
|                                 |             FOREIGN KEY (item_base_id) REFERENCES custom_mag |
|                                 | _items_base(id) ON DELETE CASCADE                            |
|                                 |         )                                                    |
| custom_progression_tables       | CREATE TABLE custom_progression_tables (id INTEGER PRIMARY K |
|                                 | EY AUTOINCREMENT, class_id TEXT NOT NULL, level INTEGER NOT  |
|                                 | NULL, proficiency_bonus INTEGER NOT NULL, feature_names TEXT |
|                                 | , class_specific_data JSON, created_at INTEGER DEFAULT (unix |
|                                 | epoch()), UNIQUE(class_id, level), FOREIGN KEY (class_id) RE |
|                                 | FERENCES custom_classes(id) ON DELETE CASCADE)               |
| custom_species                  | CREATE TABLE custom_species (                                |
|                                 |             id TEXT PRIMARY KEY,                             |
|                                 |             name TEXT NOT NULL,                              |
|                                 |             data TEXT NOT NULL,                              |
|                                 |             parent_id TEXT,                                  |
|                                 |             is_homebrew BOOLEAN DEFAULT 1,                   |
|                                 |             created_at INTEGER DEFAULT (unixepoch()),        |
|                                 |             updated_at INTEGER DEFAULT (unixepoch()),        |
|                                 |             FOREIGN KEY (parent_id) REFERENCES core_species( |
|                                 | id)                                                          |
|                                 |         )                                                    |
| custom_spells                   | CREATE TABLE custom_spells (                                 |
|                                 |             id TEXT PRIMARY KEY,                             |
|                                 |             name TEXT NOT NULL,                              |
|                                 |             level INTEGER NOT NULL,                          |
|                                 |             school TEXT NOT NULL,                            |
|                                 |             casting_time TEXT NOT NULL,                      |
|                                 |             range TEXT NOT NULL,                             |
|                                 |             components TEXT NOT NULL,                        |
|                                 |             material_components TEXT,                        |
|                                 |             duration TEXT NOT NULL,                          |
|                                 |             concentration BOOLEAN DEFAULT 0,                 |
|                                 |             ritual BOOLEAN DEFAULT 0,                        |
|                                 |             description TEXT NOT NULL,                       |
|                                 |             higher_levels TEXT,                              |
|                                 |             classes TEXT NOT NULL,                           |
|                                 |             data JSON NOT NULL,                              |
|                                 |             parent_id TEXT, -- References core_spells.id if  |
|                                 | it's an override                                             |
|                                 |             is_homebrew BOOLEAN DEFAULT 1,                   |
|                                 |             created_at INTEGER DEFAULT (unixepoch()),        |
|                                 |             updated_at INTEGER DEFAULT (unixepoch()),        |
|                                 |             FOREIGN KEY (parent_id) REFERENCES core_spells(i |
|                                 | d)                                                           |
|                                 |         )                                                    |
| custom_subclasses               | CREATE TABLE custom_subclasses (id TEXT PRIMARY KEY, class_i |
|                                 | d TEXT NOT NULL, class_source TEXT NOT NULL CHECK(class_sour |
|                                 | ce IN ('core', 'custom')), parent_id TEXT, name TEXT NOT NUL |
|                                 | L, description TEXT NOT NULL, level INTEGER NOT NULL, create |
|                                 | d_at INTEGER DEFAULT (unixepoch()), updated_at INTEGER DEFAU |
|                                 | LT (unixepoch()), FOREIGN KEY (parent_id) REFERENCES core_su |
|                                 | bclasses(id) ON DELETE SET NULL)                             |
| custom_tools                    | CREATE TABLE custom_tools (                                  |
|                                 |             id TEXT PRIMARY KEY,                             |
|                                 |             name TEXT NOT NULL,                              |
|                                 |             category TEXT NOT NULL,                          |
|                                 |             cost_gp REAL NOT NULL,                           |
|                                 |             weight_kg REAL NOT NULL,                         |
|                                 |             data JSON NOT NULL,                              |
|                                 |             parent_id TEXT,                                  |
|                                 |             is_homebrew BOOLEAN DEFAULT 1,                   |
|                                 |             created_at INTEGER DEFAULT (unixepoch()),        |
|                                 |             updated_at INTEGER DEFAULT (unixepoch()),        |
|                                 |             FOREIGN KEY (parent_id) REFERENCES core_tools(id |
|                                 | )                                                            |
|                                 |         )                                                    |
| custom_weapon_property_mappings | CREATE TABLE custom_weapon_property_mappings (               |
|                                 |             weapon_id TEXT NOT NULL,                         |
|                                 |             property_id TEXT NOT NULL,                       |
|                                 |             parameter_value TEXT,                            |
|                                 |             PRIMARY KEY (weapon_id, property_id),            |
|                                 |             FOREIGN KEY (weapon_id) REFERENCES custom_weapon |
|                                 | s(id) ON DELETE CASCADE,                                     |
|                                 |             FOREIGN KEY (property_id) REFERENCES weapon_prop |
|                                 | erties(id) ON DELETE CASCADE                                 |
|                                 |         )                                                    |
| custom_weapons                  | CREATE TABLE custom_weapons (id TEXT PRIMARY KEY, name TEXT  |
|                                 | NOT NULL, category TEXT NOT NULL, weapon_type TEXT NOT NULL, |
|                                 |  damage_dice TEXT NOT NULL, damage_type TEXT NOT NULL, weigh |
|                                 | t_kg REAL NOT NULL, cost_gp REAL NOT NULL, data JSON NOT NUL |
|                                 | L, parent_id TEXT, is_homebrew BOOLEAN DEFAULT 1, created_at |
|                                 |  INTEGER DEFAULT (unixepoch()), updated_at INTEGER DEFAULT ( |
|                                 | unixepoch()), mastery_id TEXT, category_label TEXT, weapon_s |
|                                 | ubtype TEXT, FOREIGN KEY (parent_id) REFERENCES core_weapons |
|                                 | (id))                                                        |
| feature_prerequisites           | CREATE TABLE feature_prerequisites (                         |
|                                 |             id INTEGER PRIMARY KEY AUTOINCREMENT,            |
|                                 |             feature_id TEXT NOT NULL,                        |
|                                 |             prerequisite_type TEXT NOT NULL CHECK(prerequisi |
|                                 | te_type IN (                                                 |
|                                 |                 'feature', 'level', 'attribute', 'class', 's |
|                                 | ubclass'                                                     |
|                                 |             )),                                              |
|                                 |             prerequisite_value TEXT NOT NULL,                |
|                                 |             created_at INTEGER DEFAULT (unixepoch())         |
|                                 |         )                                                    |
| settings                        | CREATE TABLE settings (                                      |
|                                 |             key TEXT PRIMARY KEY,                            |
|                                 |             value TEXT NOT NULL                              |
|                                 |         )                                                    |
| weapon_masteries                | CREATE TABLE weapon_masteries (id TEXT PRIMARY KEY, name TEX |
|                                 | T NOT NULL, description TEXT NOT NULL, data TEXT)            |
| weapon_properties               | CREATE TABLE weapon_properties (id TEXT PRIMARY KEY, name TE |
|                                 | XT NOT NULL, description TEXT NOT NULL, data TEXT, has_param |
|                                 | eter BOOLEAN DEFAULT 0, parameter_type TEXT CHECK(parameter_ |
|                                 | type IN ('range', 'damage', 'ammo', 'range+ammo', 'bonus', ' |
|                                 | special')), parameter_required BOOLEAN DEFAULT 0)            |
| weapon_property_mappings        | CREATE TABLE weapon_property_mappings (                      |
|                                 |             weapon_id TEXT NOT NULL,                         |
|                                 |             property_id TEXT NOT NULL,                       |
|                                 |             parameter_value TEXT,                            |
|                                 |                                                              |
|                                 |             PRIMARY KEY (weapon_id, property_id),            |
|                                 |             FOREIGN KEY (property_id) REFERENCES weapon_prop |
|                                 | erties(id) ON DELETE CASCADE                                 |
|                                 |         )                                                    |
| '' |
|----|
|    |
| section  |
|----------|
| ## Views |
| '' |
|----|
|    |
|               name               |                             sql                              |
|----------------------------------|--------------------------------------------------------------|
| all_armors                       | CREATE VIEW all_armors AS                                    |
|                                  |         SELECT COALESCE(c.id, core.id) as id, COALESCE(c.nam |
|                                  | e, core.name) as name, COALESCE(c.category, core.category) a |
|                                  | s category,                                                  |
|                                  |                COALESCE(c.category_label, core.category_labe |
|                                  | l) as category_label,                                        |
|                                  |                COALESCE(c.base_ac, core.base_ac) as base_ac, |
|                                  |  COALESCE(c.ac_bonus, core.ac_bonus) as ac_bonus,            |
|                                  |                COALESCE(c.ac_formula, core.ac_formula) as ac |
|                                  | _formula, COALESCE(c.strength_requirement, core.strength_req |
|                                  | uirement) as strength_requirement,                           |
|                                  |                COALESCE(c.stealth_disadvantage, core.stealth |
|                                  | _disadvantage) as stealth_disadvantage,                      |
|                                  |                COALESCE(c.don_time_minutes, core.don_time_mi |
|                                  | nutes) as don_time_minutes,                                  |
|                                  |                COALESCE(c.doff_time_minutes, core.doff_time_ |
|                                  | minutes) as doff_time_minutes,                               |
|                                  |                COALESCE(c.weight_kg, core.weight_kg) as weig |
|                                  | ht_kg,                                                       |
|                                  |                COALESCE(c.cost_gp, core.cost_gp) as cost_gp, |
|                                  |  COALESCE(c.data, core.data) as data,                        |
|                                  |                CASE WHEN c.parent_id IS NOT NULL THEN 'overr |
|                                  | ide' WHEN c.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END  |
|                                  | as source                                                    |
|                                  |         FROM core_armors core LEFT JOIN custom_armors c ON c |
|                                  | .parent_id = core.id                                         |
|                                  |         UNION                                                |
|                                  |         SELECT id, name, category, category_label, base_ac,  |
|                                  | ac_bonus, ac_formula, strength_requirement, stealth_disadvan |
|                                  | tage,                                                        |
|                                  |                don_time_minutes, doff_time_minutes, weight_k |
|                                  | g, cost_gp, data,                                            |
|                                  |                CASE WHEN is_homebrew = 1 THEN 'homebrew' ELS |
|                                  | E 'core' END as source                                       |
|                                  |         FROM custom_armors WHERE parent_id IS NULL           |
| all_backgrounds                  | CREATE VIEW all_backgrounds AS                               |
|                                  |         SELECT COALESCE(c.id, core.id) as id, COALESCE(c.nam |
|                                  | e, core.name) as name, COALESCE(c.data, core.data) as data,  |
|                                  |                CASE WHEN c.parent_id IS NOT NULL THEN 'overr |
|                                  | ide' WHEN c.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END  |
|                                  | as source                                                    |
|                                  |         FROM core_backgrounds core LEFT JOIN custom_backgrou |
|                                  | nds c ON c.parent_id = core.id                               |
|                                  |         UNION                                                |
|                                  |         SELECT id, name, data, CASE WHEN is_homebrew = 1 THE |
|                                  | N 'homebrew' ELSE 'core' END as source                       |
|                                  |         FROM custom_backgrounds WHERE parent_id IS NULL      |
| all_class_features               | CREATE VIEW all_class_features AS                            |
|                                  |         SELECT                                               |
|                                  |             id,                                              |
|                                  |             class_id,                                        |
|                                  |             NULL as class_source,                            |
|                                  |             subclass_id,                                     |
|                                  |             NULL as subclass_source,                         |
|                                  |             NULL as parent_id,                               |
|                                  |             name,                                            |
|                                  |             description,                                     |
|                                  |             level,                                           |
|                                  |             feature_type,                                    |
|                                  |             effects,                                         |
|                                  |             conditions,                                      |
|                                  |             uses_per_rest,                                   |
|                                  |             rest_type,                                       |
|                                  |             'core' as source,                                |
|                                  |             created_at,                                      |
|                                  |             NULL as updated_at                               |
|                                  |         FROM core_class_features                             |
|                                  |                                                              |
|                                  |         UNION ALL                                            |
|                                  |                                                              |
|                                  |         SELECT                                               |
|                                  |             id,                                              |
|                                  |             class_id,                                        |
|                                  |             class_source,                                    |
|                                  |             subclass_id,                                     |
|                                  |             subclass_source,                                 |
|                                  |             parent_id,                                       |
|                                  |             name,                                            |
|                                  |             description,                                     |
|                                  |             level,                                           |
|                                  |             feature_type,                                    |
|                                  |             effects,                                         |
|                                  |             conditions,                                      |
|                                  |             uses_per_rest,                                   |
|                                  |             rest_type,                                       |
|                                  |             CASE                                             |
|                                  |                 WHEN parent_id IS NOT NULL THEN 'override'   |
|                                  |                 ELSE 'custom'                                |
|                                  |             END as source,                                   |
|                                  |             created_at,                                      |
|                                  |             updated_at                                       |
|                                  |         FROM custom_class_features                           |
| all_classes                      | CREATE VIEW all_classes AS                                   |
|                                  |         SELECT COALESCE(c.id, core.id) as id, COALESCE(c.nam |
|                                  | e, core.name) as name, COALESCE(c.data, core.data) as data,  |
|                                  |                CASE WHEN c.parent_id IS NOT NULL THEN 'overr |
|                                  | ide' WHEN c.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END  |
|                                  | as source                                                    |
|                                  |         FROM core_classes core LEFT JOIN custom_classes c ON |
|                                  |  c.parent_id = core.id                                       |
|                                  |         UNION                                                |
|                                  |         SELECT id, name, data, CASE WHEN is_homebrew = 1 THE |
|                                  | N 'homebrew' ELSE 'core' END as source                       |
|                                  |         FROM custom_classes WHERE parent_id IS NULL          |
| all_equipment                    | CREATE VIEW all_equipment AS                                 |
|                                  |         SELECT                                               |
|                                  |             COALESCE(c.id, core.id) as id,                   |
|                                  |             COALESCE(c.name, core.name) as name,             |
|                                  |             COALESCE(c.description, core.description) as des |
|                                  | cription,                                                    |
|                                  |             COALESCE(c.total_cost_gp, core.total_cost_gp) as |
|                                  |  total_cost_gp,                                              |
|                                  |             COALESCE(c.total_weight_kg, core.total_weight_kg |
|                                  | ) as total_weight_kg,                                        |
|                                  |             COALESCE(c.data, core.data) as data,             |
|                                  |             CASE                                             |
|                                  |                 WHEN c.parent_id IS NOT NULL THEN 'override' |
|                                  |                                                              |
|                                  |                 WHEN c.is_homebrew = 1 THEN 'homebrew'       |
|                                  |                 ELSE 'core'                                  |
|                                  |             END as source                                    |
|                                  |         FROM core_equipment core                             |
|                                  |         LEFT JOIN custom_equipment c ON c.parent_id = core.i |
|                                  | d                                                            |
|                                  |         UNION                                                |
|                                  |         SELECT                                               |
|                                  |             id, name, description, total_cost_gp, total_weig |
|                                  | ht_kg, data,                                                 |
|                                  |             CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE ' |
|                                  | core' END as source                                          |
|                                  |         FROM custom_equipment                                |
|                                  |         WHERE parent_id IS NULL                              |
| all_feats                        | CREATE VIEW all_feats AS                                     |
|                                  |         SELECT COALESCE(c.id, core.id) as id, COALESCE(c.nam |
|                                  | e, core.name) as name, COALESCE(c.category, core.category) a |
|                                  | s category, COALESCE(c.data, core.data) as data,             |
|                                  |                CASE WHEN c.parent_id IS NOT NULL THEN 'overr |
|                                  | ide' WHEN c.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END  |
|                                  | as source                                                    |
|                                  |         FROM core_feats core LEFT JOIN custom_feats c ON c.p |
|                                  | arent_id = core.id                                           |
|                                  |         UNION                                                |
|                                  |         SELECT id, name, category, data, CASE WHEN is_homebr |
|                                  | ew = 1 THEN 'homebrew' ELSE 'core' END as source             |
|                                  |         FROM custom_feats WHERE parent_id IS NULL            |
| all_feature_options              | CREATE VIEW all_feature_options AS                           |
|                                  |         SELECT                                               |
|                                  |             COALESCE(c.id, core.id) as id,                   |
|                                  |             COALESCE(c.feature_id, core.feature_id) as featu |
|                                  | re_id,                                                       |
|                                  |             COALESCE(c.option_name, core.option_name) as opt |
|                                  | ion_name,                                                    |
|                                  |             COALESCE(c.option_description, core.option_descr |
|                                  | iption) as option_description,                               |
|                                  |             COALESCE(c.display_order, core.display_order) as |
|                                  |  display_order,                                              |
|                                  |             CASE                                             |
|                                  |                 WHEN c.parent_id IS NOT NULL THEN 'override' |
|                                  |                 WHEN c.id IS NOT NULL THEN 'custom'          |
|                                  |                 ELSE 'core'                                  |
|                                  |             END as source                                    |
|                                  |         FROM core_feature_options core                       |
|                                  |         LEFT JOIN custom_feature_options c ON c.parent_id =  |
|                                  | core.id                                                      |
|                                  |         UNION ALL                                            |
|                                  |         SELECT                                               |
|                                  |             id, feature_id, option_name, option_description, |
|                                  |  display_order,                                              |
|                                  |             'custom' as source                               |
|                                  |         FROM custom_feature_options                          |
|                                  |         WHERE parent_id IS NULL                              |
| all_gear                         | CREATE VIEW all_gear AS                                      |
|                                  |         SELECT COALESCE(c.id, core.id) as id, COALESCE(c.nam |
|                                  | e, core.name) as name, COALESCE(c.description, core.descript |
|                                  | ion) as description,                                         |
|                                  |                COALESCE(c.cost_gp, core.cost_gp) as cost_gp, |
|                                  |  COALESCE(c.weight_kg, core.weight_kg) as weight_kg, COALESC |
|                                  | E(c.data, core.data) as data,                                |
|                                  |                CASE WHEN c.parent_id IS NOT NULL THEN 'overr |
|                                  | ide' WHEN c.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END  |
|                                  | as source                                                    |
|                                  |         FROM core_gear core LEFT JOIN custom_gear c ON c.par |
|                                  | ent_id = core.id                                             |
|                                  |         UNION                                                |
|                                  |         SELECT id, name, description, cost_gp, weight_kg, da |
|                                  | ta, CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' EN |
|                                  | D as source                                                  |
|                                  |         FROM custom_gear WHERE parent_id IS NULL             |
| all_items                        | CREATE VIEW all_items AS                                     |
|                                  |         SELECT COALESCE(c.id, core.id) as id, COALESCE(c.nam |
|                                  | e, core.name) as name, COALESCE(c.description, core.descript |
|                                  | ion) as description,                                         |
|                                  |                COALESCE(c.cost_gp, core.cost_gp) as cost_gp, |
|                                  |  COALESCE(c.weight_kg, core.weight_kg) as weight_kg,         |
|                                  |                COALESCE(c.category, core.category) as catego |
|                                  | ry, COALESCE(c.data, core.data) as data,                     |
|                                  |                CASE WHEN c.parent_id IS NOT NULL THEN 'overr |
|                                  | ide' WHEN c.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END  |
|                                  | as source                                                    |
|                                  |         FROM core_items core LEFT JOIN custom_items c ON c.p |
|                                  | arent_id = core.id                                           |
|                                  |         UNION                                                |
|                                  |         SELECT id, name, description, cost_gp, weight_kg, ca |
|                                  | tegory, data, CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE |
|                                  |  'core' END as source                                        |
|                                  |         FROM custom_items WHERE parent_id IS NULL            |
| all_items_minimal                | CREATE VIEW all_items_minimal AS                             |
|                                  |         SELECT                                               |
|                                  |             id,                                              |
|                                  |             name,                                            |
|                                  |             category,                                        |
|                                  |             cost_gp,                                         |
|                                  |             weight_kg,                                       |
|                                  |             source                                           |
|                                  |         FROM all_items                                       |
| all_mag_armor                    | CREATE VIEW all_mag_armor AS                                 |
|                                  |         SELECT                                               |
|                                  |             COALESCE(c.item_base_id, core.item_base_id) as i |
|                                  | tem_base_id,                                                 |
|                                  |             COALESCE(c.armor_type, core.armor_type) as armor |
|                                  | _type,                                                       |
|                                  |             COALESCE(c.ac_bonus, core.ac_bonus) as ac_bonus, |
|                                  |             CASE                                             |
|                                  |                 WHEN c.item_base_id IS NOT NULL THEN         |
|                                  |                     (SELECT source FROM all_mag_items_base W |
|                                  | HERE id = c.item_base_id)                                    |
|                                  |                 ELSE                                         |
|                                  |                     (SELECT source FROM all_mag_items_base W |
|                                  | HERE id = core.item_base_id)                                 |
|                                  |             END as source                                    |
|                                  |         FROM core_mag_armor core                             |
|                                  |         LEFT JOIN custom_mag_armor c ON c.item_base_id = cor |
|                                  | e.item_base_id                                               |
|                                  |         UNION                                                |
|                                  |         SELECT                                               |
|                                  |             item_base_id, armor_type, ac_bonus,              |
|                                  |             (SELECT source FROM all_mag_items_base WHERE id  |
|                                  | = item_base_id) as source                                    |
|                                  |         FROM custom_mag_armor                                |
|                                  |         WHERE item_base_id NOT IN (SELECT item_base_id FROM  |
|                                  | core_mag_armor)                                              |
| all_mag_consumables              | CREATE VIEW all_mag_consumables AS                           |
|                                  |         SELECT                                               |
|                                  |             COALESCE(c.item_base_id, core.item_base_id) as i |
|                                  | tem_base_id,                                                 |
|                                  |             COALESCE(c.type, core.type) as type,             |
|                                  |             CASE                                             |
|                                  |                 WHEN c.item_base_id IS NOT NULL THEN         |
|                                  |                     (SELECT source FROM all_mag_items_base W |
|                                  | HERE id = c.item_base_id)                                    |
|                                  |                 ELSE                                         |
|                                  |                     (SELECT source FROM all_mag_items_base W |
|                                  | HERE id = core.item_base_id)                                 |
|                                  |             END as source                                    |
|                                  |         FROM core_mag_consumables core                       |
|                                  |         LEFT JOIN custom_mag_consumables c ON c.item_base_id |
|                                  |  = core.item_base_id                                         |
|                                  |         UNION                                                |
|                                  |         SELECT                                               |
|                                  |             item_base_id, type,                              |
|                                  |             (SELECT source FROM all_mag_items_base WHERE id  |
|                                  | = item_base_id) as source                                    |
|                                  |         FROM custom_mag_consumables                          |
|                                  |         WHERE item_base_id NOT IN (SELECT item_base_id FROM  |
|                                  | core_mag_consumables)                                        |
| all_mag_focus_items              | CREATE VIEW all_mag_focus_items AS                           |
|                                  |         SELECT                                               |
|                                  |             COALESCE(c.item_base_id, core.item_base_id) as i |
|                                  | tem_base_id,                                                 |
|                                  |             COALESCE(c.focus_type, core.focus_type) as focus |
|                                  | _type,                                                       |
|                                  |             COALESCE(c.charges_max, core.charges_max) as cha |
|                                  | rges_max,                                                    |
|                                  |             COALESCE(c.recharge, core.recharge) as recharge, |
|                                  |             CASE                                             |
|                                  |                 WHEN c.item_base_id IS NOT NULL THEN         |
|                                  |                     (SELECT source FROM all_mag_items_base W |
|                                  | HERE id = c.item_base_id)                                    |
|                                  |                 ELSE                                         |
|                                  |                     (SELECT source FROM all_mag_items_base W |
|                                  | HERE id = core.item_base_id)                                 |
|                                  |             END as source                                    |
|                                  |         FROM core_mag_focus_items core                       |
|                                  |         LEFT JOIN custom_mag_focus_items c ON c.item_base_id |
|                                  |  = core.item_base_id                                         |
|                                  |         UNION                                                |
|                                  |         SELECT                                               |
|                                  |             item_base_id, focus_type, charges_max, recharge, |
|                                  |             (SELECT source FROM all_mag_items_base WHERE id  |
|                                  | = item_base_id) as source                                    |
|                                  |         FROM custom_mag_focus_items                          |
|                                  |         WHERE item_base_id NOT IN (SELECT item_base_id FROM  |
|                                  | core_mag_focus_items)                                        |
| all_mag_items_base               | CREATE VIEW all_mag_items_base AS                            |
|                                  |         SELECT                                               |
|                                  |             COALESCE(c.id, core.id) as id,                   |
|                                  |             COALESCE(c.name, core.name) as name,             |
|                                  |             COALESCE(c.rarity, core.rarity) as rarity,       |
|                                  |             COALESCE(c.category, core.category) as category, |
|                                  |             COALESCE(c.source_book, core.source_book) as sou |
|                                  | rce_book,                                                    |
|                                  |             COALESCE(c.source_page, core.source_page) as sou |
|                                  | rce_page,                                                    |
|                                  |             COALESCE(c.requires_attunement, core.requires_at |
|                                  | tunement) as requires_attunement,                            |
|                                  |             COALESCE(c.facts_json, core.facts_json) as facts |
|                                  | _json,                                                       |
|                                  |             COALESCE(c.data, core.data) as data,             |
|                                  |             COALESCE(c.created_at, core.created_at) as creat |
|                                  | ed_at,                                                       |
|                                  |             CASE                                             |
|                                  |                 WHEN c.parent_id IS NOT NULL THEN 'override' |
|                                  |                                                              |
|                                  |                 WHEN c.is_homebrew = 1 THEN 'homebrew'       |
|                                  |                 ELSE 'core'                                  |
|                                  |             END as source                                    |
|                                  |         FROM core_mag_items_base core                        |
|                                  |         LEFT JOIN custom_mag_items_base c ON c.parent_id = c |
|                                  | ore.id                                                       |
|                                  |         UNION                                                |
|                                  |         SELECT                                               |
|                                  |             id, name, rarity, category, source_book, source_ |
|                                  | page,                                                        |
|                                  |             requires_attunement, facts_json, created_at,     |
|                                  |             CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE ' |
|                                  | core' END as source                                          |
|                                  |         FROM custom_mag_items_base                           |
|                                  |         WHERE parent_id IS NULL                              |
| all_mag_jewelry                  | CREATE VIEW all_mag_jewelry AS                               |
|                                  |         SELECT                                               |
|                                  |             COALESCE(c.item_base_id, core.item_base_id) as i |
|                                  | tem_base_id,                                                 |
|                                  |             COALESCE(c.type, core.type) as type,             |
|                                  |             CASE                                             |
|                                  |                 WHEN c.item_base_id IS NOT NULL THEN         |
|                                  |                     (SELECT source FROM all_mag_items_base W |
|                                  | HERE id = c.item_base_id)                                    |
|                                  |                 ELSE                                         |
|                                  |                     (SELECT source FROM all_mag_items_base W |
|                                  | HERE id = core.item_base_id)                                 |
|                                  |             END as source                                    |
|                                  |         FROM core_mag_jewelry core                           |
|                                  |         LEFT JOIN custom_mag_jewelry c ON c.item_base_id = c |
|                                  | ore.item_base_id                                             |
|                                  |         UNION                                                |
|                                  |         SELECT                                               |
|                                  |             item_base_id, type,                              |
|                                  |             (SELECT source FROM all_mag_items_base WHERE id  |
|                                  | = item_base_id) as source                                    |
|                                  |         FROM custom_mag_jewelry                              |
|                                  |         WHERE item_base_id NOT IN (SELECT item_base_id FROM  |
|                                  | core_mag_jewelry)                                            |
| all_mag_weapons                  | CREATE VIEW all_mag_weapons AS                               |
|                                  |         SELECT                                               |
|                                  |             COALESCE(c.item_base_id, core.item_base_id) as i |
|                                  | tem_base_id,                                                 |
|                                  |             COALESCE(c.weapon_type, core.weapon_type) as wea |
|                                  | pon_type,                                                    |
|                                  |             COALESCE(c.attack_bonus, core.attack_bonus) as a |
|                                  | ttack_bonus,                                                 |
|                                  |             COALESCE(c.damage_bonus, core.damage_bonus) as d |
|                                  | amage_bonus,                                                 |
|                                  |             CASE                                             |
|                                  |                 WHEN c.item_base_id IS NOT NULL THEN         |
|                                  |                     (SELECT source FROM all_mag_items_base W |
|                                  | HERE id = c.item_base_id)                                    |
|                                  |                 ELSE                                         |
|                                  |                     (SELECT source FROM all_mag_items_base W |
|                                  | HERE id = core.item_base_id)                                 |
|                                  |             END as source                                    |
|                                  |         FROM core_mag_weapons core                           |
|                                  |         LEFT JOIN custom_mag_weapons c ON c.item_base_id = c |
|                                  | ore.item_base_id                                             |
|                                  |         UNION                                                |
|                                  |         SELECT                                               |
|                                  |             item_base_id, weapon_type, attack_bonus, damage_ |
|                                  | bonus,                                                       |
|                                  |             (SELECT source FROM all_mag_items_base WHERE id  |
|                                  | = item_base_id) as source                                    |
|                                  |         FROM custom_mag_weapons                              |
|                                  |         WHERE item_base_id NOT IN (SELECT item_base_id FROM  |
|                                  | core_mag_weapons)                                            |
| all_mag_wondrous                 | CREATE VIEW all_mag_wondrous AS                              |
|                                  |         SELECT                                               |
|                                  |             COALESCE(c.item_base_id, core.item_base_id) as i |
|                                  | tem_base_id,                                                 |
|                                  |             CASE                                             |
|                                  |                 WHEN c.item_base_id IS NOT NULL THEN         |
|                                  |                     (SELECT source FROM all_mag_items_base W |
|                                  | HERE id = c.item_base_id)                                    |
|                                  |                 ELSE                                         |
|                                  |                     (SELECT source FROM all_mag_items_base W |
|                                  | HERE id = core.item_base_id)                                 |
|                                  |             END as source                                    |
|                                  |         FROM core_mag_wondrous core                          |
|                                  |         LEFT JOIN custom_mag_wondrous c ON c.item_base_id =  |
|                                  | core.item_base_id                                            |
|                                  |         UNION                                                |
|                                  |         SELECT                                               |
|                                  |             item_base_id,                                    |
|                                  |             (SELECT source FROM all_mag_items_base WHERE id  |
|                                  | = item_base_id) as source                                    |
|                                  |         FROM custom_mag_wondrous                             |
|                                  |         WHERE item_base_id NOT IN (SELECT item_base_id FROM  |
|                                  | core_mag_wondrous)                                           |
| all_progression_tables           | CREATE VIEW all_progression_tables AS                        |
|                                  |         SELECT                                               |
|                                  |             id,                                              |
|                                  |             class_id,                                        |
|                                  |             level,                                           |
|                                  |             proficiency_bonus,                               |
|                                  |             feature_names,                                   |
|                                  |             class_specific_data,                             |
|                                  |             'core' as source,                                |
|                                  |             created_at                                       |
|                                  |         FROM core_progression_tables                         |
|                                  |                                                              |
|                                  |         UNION ALL                                            |
|                                  |                                                              |
|                                  |         SELECT                                               |
|                                  |             id,                                              |
|                                  |             class_id,                                        |
|                                  |             level,                                           |
|                                  |             proficiency_bonus,                               |
|                                  |             feature_names,                                   |
|                                  |             class_specific_data,                             |
|                                  |             'custom' as source,                              |
|                                  |             created_at                                       |
|                                  |         FROM custom_progression_tables                       |
| all_skills                       | CREATE VIEW all_skills AS SELECT id, name, ability, descript |
|                                  | ion, 'core' as source FROM core_skills                       |
| all_species                      | CREATE VIEW all_species AS                                   |
|                                  |         SELECT COALESCE(c.id, core.id) as id, COALESCE(c.nam |
|                                  | e, core.name) as name, COALESCE(c.data, core.data) as data,  |
|                                  |                CASE WHEN c.parent_id IS NOT NULL THEN 'overr |
|                                  | ide' WHEN c.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END  |
|                                  | as source                                                    |
|                                  |         FROM core_species core LEFT JOIN custom_species c ON |
|                                  |  c.parent_id = core.id                                       |
|                                  |         UNION                                                |
|                                  |         SELECT id, name, data, CASE WHEN is_homebrew = 1 THE |
|                                  | N 'homebrew' ELSE 'core' END as source                       |
|                                  |         FROM custom_species WHERE parent_id IS NULL          |
| all_spells                       | CREATE VIEW all_spells AS                                    |
|                                  |         SELECT                                               |
|                                  |             COALESCE(c.id, core.id) as id, COALESCE(c.name,  |
|                                  | core.name) as name, COALESCE(c.level, core.level) as level,  |
|                                  |             COALESCE(c.school, core.school) as school, COALE |
|                                  | SCE(c.casting_time, core.casting_time) as casting_time,      |
|                                  |             COALESCE(c.range, core.range) as range, COALESCE |
|                                  | (c.components, core.components) as components,               |
|                                  |             COALESCE(c.material_components, core.material_co |
|                                  | mponents) as material_components,                            |
|                                  |             COALESCE(c.duration, core.duration) as duration, |
|                                  |  COALESCE(c.concentration, core.concentration) as concentrat |
|                                  | ion,                                                         |
|                                  |             COALESCE(c.ritual, core.ritual) as ritual, COALE |
|                                  | SCE(c.description, core.description) as description,         |
|                                  |             COALESCE(c.higher_levels, core.higher_levels) as |
|                                  |  higher_levels, COALESCE(c.classes, core.classes) as classes |
|                                  | ,                                                            |
|                                  |             COALESCE(c.data, core.data) as data,             |
|                                  |             CASE                                             |
|                                  |                 WHEN c.parent_id IS NOT NULL THEN 'override' |
|                                  |                                                              |
|                                  |                 WHEN c.is_homebrew = 1 THEN 'homebrew'       |
|                                  |                 ELSE 'core'                                  |
|                                  |             END as source                                    |
|                                  |         FROM core_spells core LEFT JOIN custom_spells c ON c |
|                                  | .parent_id = core.id                                         |
|                                  |         UNION                                                |
|                                  |         SELECT id, name, level, school, casting_time, range, |
|                                  |  components, material_components, duration, concentration, r |
|                                  | itual, description, higher_levels, classes, data,            |
|                                  |                CASE WHEN is_homebrew = 1 THEN 'homebrew' ELS |
|                                  | E 'core' END as source                                       |
|                                  |         FROM custom_spells WHERE parent_id IS NULL           |
| all_spells_minimal               | CREATE VIEW all_spells_minimal AS                            |
|                                  |         SELECT                                               |
|                                  |             id,                                              |
|                                  |             name,                                            |
|                                  |             level,                                           |
|                                  |             school,                                          |
|                                  |             casting_time,                                    |
|                                  |             source                                           |
|                                  |         FROM all_spells                                      |
| all_subclasses                   | CREATE VIEW all_subclasses AS                                |
|                                  |         SELECT                                               |
|                                  |             id,                                              |
|                                  |             class_id,                                        |
|                                  |             'core' as class_source,                          |
|                                  |             NULL as parent_id,                               |
|                                  |             name,                                            |
|                                  |             description,                                     |
|                                  |             level,                                           |
|                                  |             'core' as source,                                |
|                                  |             created_at,                                      |
|                                  |             NULL as updated_at                               |
|                                  |         FROM core_subclasses                                 |
|                                  |                                                              |
|                                  |         UNION ALL                                            |
|                                  |                                                              |
|                                  |         SELECT                                               |
|                                  |             id,                                              |
|                                  |             class_id,                                        |
|                                  |             class_source,                                    |
|                                  |             parent_id,                                       |
|                                  |             name,                                            |
|                                  |             description,                                     |
|                                  |             level,                                           |
|                                  |             CASE                                             |
|                                  |                 WHEN parent_id IS NOT NULL THEN 'override'   |
|                                  |                 ELSE 'custom'                                |
|                                  |             END as source,                                   |
|                                  |             created_at,                                      |
|                                  |             updated_at                                       |
|                                  |         FROM custom_subclasses                               |
| all_tools                        | CREATE VIEW all_tools AS                                     |
|                                  |         SELECT COALESCE(c.id, core.id) as id, COALESCE(c.nam |
|                                  | e, core.name) as name, COALESCE(c.category, core.category) a |
|                                  | s category,                                                  |
|                                  |                COALESCE(c.cost_gp, core.cost_gp) as cost_gp, |
|                                  |  COALESCE(c.weight_kg, core.weight_kg) as weight_kg, COALESC |
|                                  | E(c.data, core.data) as data,                                |
|                                  |                CASE WHEN c.parent_id IS NOT NULL THEN 'overr |
|                                  | ide' WHEN c.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END  |
|                                  | as source                                                    |
|                                  |         FROM core_tools core LEFT JOIN custom_tools c ON c.p |
|                                  | arent_id = core.id                                           |
|                                  |         UNION                                                |
|                                  |         SELECT id, name, category, cost_gp, weight_kg, data, |
|                                  |  CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END a |
|                                  | s source                                                     |
|                                  |         FROM custom_tools WHERE parent_id IS NULL            |
| all_weapons                      | CREATE VIEW all_weapons AS                                   |
|                                  |         SELECT COALESCE(cw.id, core.id) as id, COALESCE(cw.n |
|                                  | ame, core.name) as name, COALESCE(cw.category, core.category |
|                                  | ) as category,                                               |
|                                  |                COALESCE(cw.category_label, core.category_lab |
|                                  | el) as category_label,                                       |
|                                  |                COALESCE(cw.weapon_type, core.weapon_type) as |
|                                  |  weapon_type,                                                |
|                                  |                COALESCE(cw.weapon_subtype, core.weapon_subty |
|                                  | pe) as weapon_subtype,                                       |
|                                  |                COALESCE(cw.damage_dice, core.damage_dice) as |
|                                  |  damage_dice,                                                |
|                                  |                COALESCE(cw.damage_type, core.damage_type) as |
|                                  |  damage_type, COALESCE(cw.weight_kg, core.weight_kg) as weig |
|                                  | ht_kg,                                                       |
|                                  |                COALESCE(cw.cost_gp, core.cost_gp) as cost_gp |
|                                  | , COALESCE(cw.data, core.data) as data,                      |
|                                  |                CASE WHEN cw.parent_id IS NOT NULL THEN 'over |
|                                  | ride' WHEN cw.is_homebrew = 1 THEN 'homebrew' ELSE 'core' EN |
|                                  | D as source                                                  |
|                                  |         FROM core_weapons core LEFT JOIN custom_weapons cw O |
|                                  | N cw.parent_id = core.id                                     |
|                                  |         UNION                                                |
|                                  |         SELECT id, name, category, category_label, weapon_ty |
|                                  | pe, weapon_subtype, damage_dice, damage_type, weight_kg, cos |
|                                  | t_gp, data, CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE ' |
|                                  | core' END as source                                          |
|                                  |         FROM custom_weapons WHERE parent_id IS NULL          |
| all_weapons_minimal              | CREATE VIEW all_weapons_minimal AS                           |
|                                  |         SELECT                                               |
|                                  |             id,                                              |
|                                  |             name,                                            |
|                                  |             category,                                        |
|                                  |             damage_dice,                                     |
|                                  |             damage_type,                                     |
|                                  |             cost_gp,                                         |
|                                  |             source                                           |
|                                  |         FROM all_weapons_unified                             |
| all_weapons_unified              | CREATE VIEW all_weapons_unified AS                           |
|                                  |         SELECT COALESCE(cw.id, core.id) as id, COALESCE(cw.n |
|                                  | ame, core.name) as name, COALESCE(cw.category, core.category |
|                                  | ) as category,                                               |
|                                  |                COALESCE(cw.category_label, core.category_lab |
|                                  | el) as category_label,                                       |
|                                  |                COALESCE(cw.weapon_subtype, core.weapon_subty |
|                                  | pe) as weapon_subtype,                                       |
|                                  |                COALESCE(cw.mastery_id, core.mastery_id) as m |
|                                  | astery_id, COALESCE(cw.damage_dice, core.damage_dice) as dam |
|                                  | age_dice,                                                    |
|                                  |                COALESCE(cw.damage_type, core.damage_type) as |
|                                  |  damage_type, COALESCE(cw.weight_kg, core.weight_kg) as weig |
|                                  | ht_kg,                                                       |
|                                  |                COALESCE(cw.cost_gp, core.cost_gp) as cost_gp |
|                                  | , COALESCE(cw.data, core.data) as data,                      |
|                                  |                CASE WHEN cw.parent_id IS NOT NULL THEN 'over |
|                                  | ride' WHEN cw.is_homebrew = 1 THEN 'homebrew' ELSE 'core' EN |
|                                  | D as source                                                  |
|                                  |         FROM core_weapons core LEFT JOIN custom_weapons cw O |
|                                  | N cw.parent_id = core.id                                     |
|                                  |         UNION                                                |
|                                  |         SELECT id, name, category, category_label, weapon_su |
|                                  | btype, mastery_id, damage_dice, damage_type, weight_kg, cost |
|                                  | _gp, data, CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'c |
|                                  | ore' END as source                                           |
|                                  |         FROM custom_weapons WHERE parent_id IS NULL          |
| armor_property_mappings_unified  | CREATE VIEW armor_property_mappings_unified AS               |
|                                  |         SELECT armor_id, property_id, parameter_value, 'core |
|                                  | ' as source                                                  |
|                                  |         FROM core_armor_property_mappings                    |
|                                  |         UNION ALL                                            |
|                                  |         SELECT armor_id, property_id, parameter_value, 'cust |
|                                  | om' as source                                                |
|                                  |         FROM custom_armor_property_mappings                  |
| weapon_property_mappings_unified | CREATE VIEW weapon_property_mappings_unified AS              |
|                                  |         SELECT weapon_id, property_id, parameter_value, 'cor |
|                                  | e' as source                                                 |
|                                  |         FROM core_weapon_property_mappings                   |
|                                  |         UNION ALL                                            |
|                                  |         SELECT weapon_id, property_id, parameter_value, 'cus |
|                                  | tom' as source                                               |
|                                  |         FROM custom_weapon_property_mappings                 |
| '' |
|----|
|    |
|  section   |
|------------|
| ## Indexes |
| '' |
|----|
|    |
|                  name                  |           tbl_name            |                             sql                              |
|----------------------------------------|-------------------------------|--------------------------------------------------------------|
| idx_armor_mappings_armor               | armor_property_mappings       | CREATE INDEX idx_armor_mappings_armor                        |
|                                        |                               |           ON armor_property_mappings(armor_id)               |
| idx_armor_property_armor               | armor_property_mappings       | CREATE INDEX idx_armor_property_armor ON armor_property_mapp |
|                                        |                               | ings(armor_id)                                               |
| idx_armor_property_property            | armor_property_mappings       | CREATE INDEX idx_armor_property_property ON armor_property_m |
|                                        |                               | appings(property_id)                                         |
| idx_bg_equipment_bg                    | background_starting_equipment | CREATE INDEX idx_bg_equipment_bg ON background_starting_equi |
|                                        |                               | pment(background_id)                                         |
| idx_bg_equipment_bg_option             | background_starting_equipment | CREATE INDEX idx_bg_equipment_bg_option                      |
|                                        |                               |           ON background_starting_equipment(background_id, op |
|                                        |                               | tion_label)                                                  |
| idx_bg_equipment_item                  | background_starting_equipment | CREATE INDEX idx_bg_equipment_item ON background_starting_eq |
|                                        |                               | uipment(item_id)                                             |
| idx_bg_equipment_option                | background_starting_equipment | CREATE INDEX idx_bg_equipment_option ON background_starting_ |
|                                        |                               | equipment(background_id, option_label)                       |
| idx_inv_character                      | character_inventory           | CREATE INDEX idx_inv_character ON character_inventory(charac |
|                                        |                               | ter_id)                                                      |
| idx_inv_container                      | character_inventory           | CREATE INDEX idx_inv_container ON character_inventory(contai |
|                                        |                               | ner_id)                                                      |
| idx_characters_updated                 | characters                    | CREATE INDEX idx_characters_updated ON characters(updated_at |
|                                        |                               | )                                                            |
| idx_class_equipment_armor              | class_starting_equipment      | CREATE INDEX idx_class_equipment_armor ON class_starting_equ |
|                                        |                               | ipment(armor_id)                                             |
| idx_class_equipment_class              | class_starting_equipment      | CREATE INDEX idx_class_equipment_class ON class_starting_equ |
|                                        |                               | ipment(class_id)                                             |
| idx_class_equipment_class_custom       | class_starting_equipment      | CREATE INDEX idx_class_equipment_class_custom ON class_start |
|                                        |                               | ing_equipment(class_id, is_custom)                           |
| idx_class_equipment_is_custom          | class_starting_equipment      | CREATE INDEX idx_class_equipment_is_custom ON class_starting |
|                                        |                               | _equipment(is_custom)                                        |
| idx_class_equipment_item               | class_starting_equipment      | CREATE INDEX idx_class_equipment_item ON class_starting_equi |
|                                        |                               | pment(item_id)                                               |
| idx_class_equipment_option             | class_starting_equipment      | CREATE INDEX idx_class_equipment_option ON class_starting_eq |
|                                        |                               | uipment(class_id, option_label)                              |
| idx_class_equipment_weapon             | class_starting_equipment      | CREATE INDEX idx_class_equipment_weapon ON class_starting_eq |
|                                        |                               | uipment(weapon_id)                                           |
| idx_core_armors_name                   | core_armors                   | CREATE INDEX idx_core_armors_name ON core_armors(name)       |
| idx_core_features_class_level          | core_class_features           | CREATE INDEX idx_core_features_class_level ON core_class_fea |
|                                        |                               | tures(class_id, level)                                       |
| idx_core_features_subclass             | core_class_features           | CREATE INDEX idx_core_features_subclass ON core_class_featur |
|                                        |                               | es(subclass_id)                                              |
| idx_core_equipment_items_eq            | core_equipment_items          | CREATE INDEX idx_core_equipment_items_eq ON core_equipment_i |
|                                        |                               | tems(equipment_id)                                           |
| idx_core_equipment_items_item          | core_equipment_items          | CREATE INDEX idx_core_equipment_items_item ON core_equipment |
|                                        |                               | _items(item_id)                                              |
| idx_equipment_items_equipment          | core_equipment_items          | CREATE INDEX idx_equipment_items_equipment ON core_equipment |
|                                        |                               | _items(equipment_id)                                         |
| idx_equipment_items_item               | core_equipment_items          | CREATE INDEX idx_equipment_items_item ON core_equipment_item |
|                                        |                               | s(item_id)                                                   |
| idx_core_equipment_tools_eq            | core_equipment_tools          | CREATE INDEX idx_core_equipment_tools_eq ON core_equipment_t |
|                                        |                               | ools(equipment_id)                                           |
| idx_equipment_tools_equipment          | core_equipment_tools          | CREATE INDEX idx_equipment_tools_equipment ON core_equipment |
|                                        |                               | _tools(equipment_id)                                         |
| idx_equipment_tools_tool               | core_equipment_tools          | CREATE INDEX idx_equipment_tools_tool ON core_equipment_tool |
|                                        |                               | s(tool_id)                                                   |
| idx_core_feature_options_feature       | core_feature_options          | CREATE INDEX idx_core_feature_options_feature ON core_featur |
|                                        |                               | e_options(feature_id)                                        |
| idx_mag_crafting_item                  | core_mag_item_crafting        | CREATE INDEX idx_mag_crafting_item ON core_mag_item_crafting |
|                                        |                               | (item_base_id)                                               |
| idx_mag_crafting_tool                  | core_mag_item_crafting        | CREATE INDEX idx_mag_crafting_tool ON core_mag_item_crafting |
|                                        |                               | (tool_id)                                                    |
| idx_core_mag_items_category            | core_mag_items_base           | CREATE INDEX idx_core_mag_items_category ON core_mag_items_b |
|                                        |                               | ase(category)                                                |
| idx_core_mag_items_name                | core_mag_items_base           | CREATE INDEX idx_core_mag_items_name ON core_mag_items_base( |
|                                        |                               | name)                                                        |
| idx_core_mag_items_rarity              | core_mag_items_base           | CREATE INDEX idx_core_mag_items_rarity ON core_mag_items_bas |
|                                        |                               | e(rarity)                                                    |
| idx_mag_items_category                 | core_mag_items_base           | CREATE INDEX idx_mag_items_category ON core_mag_items_base(c |
|                                        |                               | ategory)                                                     |
| idx_mag_items_rarity                   | core_mag_items_base           | CREATE INDEX idx_mag_items_rarity ON core_mag_items_base(rar |
|                                        |                               | ity)                                                         |
| idx_core_progression_class_level       | core_progression_tables       | CREATE INDEX idx_core_progression_class_level ON core_progre |
|                                        |                               | ssion_tables(class_id, level)                                |
| idx_core_spells_level                  | core_spells                   | CREATE INDEX idx_core_spells_level ON core_spells(level)     |
| idx_core_spells_name                   | core_spells                   | CREATE UNIQUE INDEX idx_core_spells_name ON core_spells(name |
|                                        |                               | )                                                            |
| idx_core_subclasses_class              | core_subclasses               | CREATE INDEX idx_core_subclasses_class ON core_subclasses(cl |
|                                        |                               | ass_id)                                                      |
| idx_core_weapons_category              | core_weapons                  | CREATE INDEX idx_core_weapons_category ON core_weapons(categ |
|                                        |                               | ory)                                                         |
| idx_core_weapons_damage_type           | core_weapons                  | CREATE INDEX idx_core_weapons_damage_type ON core_weapons(da |
|                                        |                               | mage_type)                                                   |
| idx_core_weapons_name                  | core_weapons                  | CREATE INDEX idx_core_weapons_name ON core_weapons(name)     |
| idx_core_weapons_type                  | core_weapons                  | CREATE INDEX idx_core_weapons_type ON core_weapons(weapon_ty |
|                                        |                               | pe)                                                          |
| idx_custom_armors_name                 | custom_armors                 | CREATE INDEX idx_custom_armors_name ON custom_armors(name)   |
| idx_custom_features_class_level        | custom_class_features         | CREATE INDEX idx_custom_features_class_level ON custom_class |
|                                        |                               | _features(class_id, level)                                   |
| idx_custom_features_parent             | custom_class_features         | CREATE INDEX idx_custom_features_parent ON custom_class_feat |
|                                        |                               | ures(parent_id)                                              |
| idx_custom_features_subclass           | custom_class_features         | CREATE INDEX idx_custom_features_subclass ON custom_class_fe |
|                                        |                               | atures(subclass_id)                                          |
| idx_custom_equipment_items_eq          | custom_equipment_items        | CREATE INDEX idx_custom_equipment_items_eq ON custom_equipme |
|                                        |                               | nt_items(equipment_id)                                       |
| idx_custom_equipment_items_equipment   | custom_equipment_items        | CREATE INDEX idx_custom_equipment_items_equipment ON custom_ |
|                                        |                               | equipment_items(equipment_id)                                |
| idx_custom_equipment_items_item        | custom_equipment_items        | CREATE INDEX idx_custom_equipment_items_item ON custom_equip |
|                                        |                               | ment_items(item_id)                                          |
| idx_custom_equipment_tools_eq          | custom_equipment_tools        | CREATE INDEX idx_custom_equipment_tools_eq ON custom_equipme |
|                                        |                               | nt_tools(equipment_id)                                       |
| idx_custom_equipment_tools_equipment   | custom_equipment_tools        | CREATE INDEX idx_custom_equipment_tools_equipment ON custom_ |
|                                        |                               | equipment_tools(equipment_id)                                |
| idx_custom_equipment_tools_tool        | custom_equipment_tools        | CREATE INDEX idx_custom_equipment_tools_tool ON custom_equip |
|                                        |                               | ment_tools(tool_id)                                          |
| idx_custom_feature_options_feature     | custom_feature_options        | CREATE INDEX idx_custom_feature_options_feature ON custom_fe |
|                                        |                               | ature_options(feature_id)                                    |
| idx_custom_feature_options_parent      | custom_feature_options        | CREATE INDEX idx_custom_feature_options_parent ON custom_fea |
|                                        |                               | ture_options(parent_id)                                      |
| idx_custom_mag_crafting_item           | custom_mag_item_crafting      | CREATE INDEX idx_custom_mag_crafting_item ON custom_mag_item |
|                                        |                               | _crafting(item_base_id)                                      |
| idx_custom_mag_crafting_tool           | custom_mag_item_crafting      | CREATE INDEX idx_custom_mag_crafting_tool ON custom_mag_item |
|                                        |                               | _crafting(tool_id)                                           |
| idx_custom_mag_items_category          | custom_mag_items_base         | CREATE INDEX idx_custom_mag_items_category ON custom_mag_ite |
|                                        |                               | ms_base(category)                                            |
| idx_custom_mag_items_name              | custom_mag_items_base         | CREATE INDEX idx_custom_mag_items_name ON custom_mag_items_b |
|                                        |                               | ase(name)                                                    |
| idx_custom_mag_items_parent            | custom_mag_items_base         | CREATE INDEX idx_custom_mag_items_parent ON custom_mag_items |
|                                        |                               | _base(parent_id)                                             |
| idx_custom_mag_items_rarity            | custom_mag_items_base         | CREATE INDEX idx_custom_mag_items_rarity ON custom_mag_items |
|                                        |                               | _base(rarity)                                                |
| idx_custom_progression_class_level     | custom_progression_tables     | CREATE INDEX idx_custom_progression_class_level ON custom_pr |
|                                        |                               | ogression_tables(class_id, level)                            |
| idx_custom_spells_name                 | custom_spells                 | CREATE INDEX idx_custom_spells_name ON custom_spells(name)   |
| idx_custom_spells_parent               | custom_spells                 | CREATE INDEX idx_custom_spells_parent ON custom_spells(paren |
|                                        |                               | t_id)                                                        |
| idx_custom_subclasses_class            | custom_subclasses             | CREATE INDEX idx_custom_subclasses_class ON custom_subclasse |
|                                        |                               | s(class_id)                                                  |
| idx_custom_subclasses_parent           | custom_subclasses             | CREATE INDEX idx_custom_subclasses_parent ON custom_subclass |
|                                        |                               | es(parent_id)                                                |
| idx_custom_weapons_name                | custom_weapons                | CREATE INDEX idx_custom_weapons_name ON custom_weapons(name) |
| idx_custom_weapons_parent              | custom_weapons                | CREATE INDEX idx_custom_weapons_parent ON custom_weapons(par |
|                                        |                               | ent_id)                                                      |
| idx_feature_prerequisites_feature      | feature_prerequisites         | CREATE INDEX idx_feature_prerequisites_feature ON feature_pr |
|                                        |                               | erequisites(feature_id)                                      |
| idx_feature_prerequisites_feature_type | feature_prerequisites         | CREATE INDEX idx_feature_prerequisites_feature_type ON featu |
|                                        |                               | re_prerequisites(feature_id, prerequisite_type)              |
| idx_feature_prerequisites_type         | feature_prerequisites         | CREATE INDEX idx_feature_prerequisites_type ON feature_prere |
|                                        |                               | quisites(prerequisite_type)                                  |
| idx_weapon_mappings_weapon             | weapon_property_mappings      | CREATE INDEX idx_weapon_mappings_weapon                      |
|                                        |                               |           ON weapon_property_mappings(weapon_id)             |
| idx_weapon_property_property           | weapon_property_mappings      | CREATE INDEX idx_weapon_property_property ON weapon_property |
|                                        |                               | _mappings(property_id)                                       |
| idx_weapon_property_unique             | weapon_property_mappings      | CREATE UNIQUE INDEX idx_weapon_property_unique               |
|                                        |                               |         ON weapon_property_mappings(weapon_id, property_id)  |
| idx_weapon_property_weapon             | weapon_property_mappings      | CREATE INDEX idx_weapon_property_weapon ON weapon_property_m |
|                                        |                               | appings(weapon_id)                                           |
