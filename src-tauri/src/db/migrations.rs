use rusqlite::Connection;

pub fn run_migrations(conn: &Connection) -> Result<(), String> {
    // Spalten hinzufügen falls sie fehlen (ALTER TABLE ist nicht idempotent in SQLite)
    // Wir ignorieren Fehler, falls die Spalte bereits existiert
    let _ = conn.execute("ALTER TABLE core_mag_items_base ADD COLUMN data JSON", []);
    let _ = conn.execute("ALTER TABLE custom_mag_items_base ADD COLUMN data JSON", []);
    let _ = conn.execute("ALTER TABLE characters ADD COLUMN currency_cp INTEGER DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE characters ADD COLUMN currency_sp INTEGER DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE characters ADD COLUMN currency_ep INTEGER DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE characters ADD COLUMN currency_gp INTEGER DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE characters ADD COLUMN currency_pp INTEGER DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE character_inventory ADD COLUMN is_attuned BOOLEAN NOT NULL DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE character_inventory ADD COLUMN location TEXT DEFAULT 'Body'", []);
    let _ = conn.execute("ALTER TABLE character_inventory ADD COLUMN source TEXT DEFAULT 'manual'", []);
    let _ = conn.execute("ALTER TABLE character_inventory ADD COLUMN is_starting_equipment BOOLEAN DEFAULT 0", []);
    
    // Spell slots
    for i in 1..=9 {
        let _ = conn.execute(&format!("ALTER TABLE characters ADD COLUMN spell_slots_{} INTEGER DEFAULT 0", i), []);
        let _ = conn.execute(&format!("ALTER TABLE characters ADD COLUMN spell_slots_used_{} INTEGER DEFAULT 0", i), []);
    }

    // Attributes
    let _ = conn.execute("ALTER TABLE characters ADD COLUMN attr_str INTEGER DEFAULT 10", []);
    let _ = conn.execute("ALTER TABLE characters ADD COLUMN attr_dex INTEGER DEFAULT 10", []);
    let _ = conn.execute("ALTER TABLE characters ADD COLUMN attr_con INTEGER DEFAULT 10", []);
    let _ = conn.execute("ALTER TABLE characters ADD COLUMN attr_int INTEGER DEFAULT 10", []);
    let _ = conn.execute("ALTER TABLE characters ADD COLUMN attr_wis INTEGER DEFAULT 10", []);
    let _ = conn.execute("ALTER TABLE characters ADD COLUMN attr_cha INTEGER DEFAULT 10", []);

    // Health
    let _ = conn.execute("ALTER TABLE characters ADD COLUMN hp_current INTEGER DEFAULT 10", []);
    let _ = conn.execute("ALTER TABLE characters ADD COLUMN hp_max INTEGER DEFAULT 10", []);
    let _ = conn.execute("ALTER TABLE characters ADD COLUMN hp_temp INTEGER DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE characters ADD COLUMN hit_dice_max INTEGER DEFAULT 1", []);
    let _ = conn.execute("ALTER TABLE characters ADD COLUMN hit_dice_used INTEGER DEFAULT 0", []);

    // Death Saves
    let _ = conn.execute("ALTER TABLE characters ADD COLUMN death_saves_successes INTEGER DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE characters ADD COLUMN death_saves_failures INTEGER DEFAULT 0", []);

    conn.execute_batch(
        "BEGIN;
        
        -- Views neu erstellen (da diese sich oft ändern)
        DROP VIEW IF EXISTS all_spells;
        DROP VIEW IF EXISTS all_species;
        DROP VIEW IF EXISTS all_classes;
        DROP VIEW IF EXISTS all_gear;
        DROP VIEW IF EXISTS all_tools;
        DROP VIEW IF EXISTS all_items;
        DROP VIEW IF EXISTS all_equipment;
        DROP VIEW IF EXISTS all_weapons;
        DROP VIEW IF EXISTS all_weapons_unified;
        DROP VIEW IF EXISTS all_armors;
        DROP VIEW IF EXISTS all_feats;
        DROP VIEW IF EXISTS all_skills;
        DROP VIEW IF EXISTS all_backgrounds;
        DROP VIEW IF EXISTS all_mag_items_base;
        DROP VIEW IF EXISTS all_mag_weapons;
        DROP VIEW IF EXISTS all_mag_armor;
        DROP VIEW IF EXISTS all_mag_consumables;
        DROP VIEW IF EXISTS all_mag_focus_items;
        DROP VIEW IF EXISTS all_mag_jewelry;
        DROP VIEW IF EXISTS all_mag_wondrous;
        DROP VIEW IF EXISTS all_class_features;
        DROP VIEW IF EXISTS all_subclasses;
        DROP VIEW IF EXISTS all_progression_tables;
        DROP VIEW IF EXISTS all_feature_options;
        DROP VIEW IF EXISTS all_weapons_minimal;
        DROP VIEW IF EXISTS all_items_minimal;
        DROP VIEW IF EXISTS all_spells_minimal;

        -- Core Spells
        CREATE TABLE IF NOT EXISTS core_spells (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            level INTEGER NOT NULL,
            school TEXT NOT NULL,
            casting_time TEXT NOT NULL,
            range TEXT NOT NULL,
            components TEXT NOT NULL,
            material_components TEXT,
            duration TEXT NOT NULL,
            concentration BOOLEAN DEFAULT 0,
            ritual BOOLEAN DEFAULT 0,
            description TEXT NOT NULL,
            higher_levels TEXT,
            classes TEXT NOT NULL,
            data JSON NOT NULL,
            created_at INTEGER DEFAULT (unixepoch())
        );

        -- Custom Spells
        CREATE TABLE IF NOT EXISTS custom_spells (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            level INTEGER NOT NULL,
            school TEXT NOT NULL,
            casting_time TEXT NOT NULL,
            range TEXT NOT NULL,
            components TEXT NOT NULL,
            material_components TEXT,
            duration TEXT NOT NULL,
            concentration BOOLEAN DEFAULT 0,
            ritual BOOLEAN DEFAULT 0,
            description TEXT NOT NULL,
            higher_levels TEXT,
            classes TEXT NOT NULL,
            data JSON NOT NULL,
            parent_id TEXT,
            is_homebrew BOOLEAN DEFAULT 1,
            created_at INTEGER DEFAULT (unixepoch()),
            updated_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (parent_id) REFERENCES core_spells(id)
        );

        -- Species
        CREATE TABLE IF NOT EXISTS core_species (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            data TEXT NOT NULL,
            created_at INTEGER DEFAULT (unixepoch())
        );

        CREATE TABLE IF NOT EXISTS custom_species (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            data TEXT NOT NULL,
            parent_id TEXT,
            is_homebrew BOOLEAN DEFAULT 1,
            created_at INTEGER DEFAULT (unixepoch()),
            updated_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (parent_id) REFERENCES core_species(id)
        );

        -- Classes
        CREATE TABLE IF NOT EXISTS core_classes (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            data TEXT NOT NULL,
            created_at INTEGER DEFAULT (unixepoch())
        );

        CREATE TABLE IF NOT EXISTS custom_classes (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            data TEXT NOT NULL,
            parent_id TEXT,
            is_homebrew BOOLEAN DEFAULT 1,
            created_at INTEGER DEFAULT (unixepoch()),
            updated_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (parent_id) REFERENCES core_classes(id)
        );

        -- Gear
        CREATE TABLE IF NOT EXISTS core_gear (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            cost_gp REAL NOT NULL,
            weight_kg REAL NOT NULL,
            data JSON,
            created_at INTEGER DEFAULT (unixepoch())
        );

        CREATE TABLE IF NOT EXISTS custom_gear (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            cost_gp REAL NOT NULL,
            weight_kg REAL NOT NULL,
            data JSON,
            parent_id TEXT,
            is_homebrew BOOLEAN DEFAULT 1,
            created_at INTEGER DEFAULT (unixepoch()),
            updated_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (parent_id) REFERENCES core_gear(id)
        );

        -- Tools
        CREATE TABLE IF NOT EXISTS core_tools (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            cost_gp REAL NOT NULL,
            weight_kg REAL NOT NULL,
            data JSON NOT NULL,
            created_at INTEGER DEFAULT (unixepoch())
        );

        CREATE TABLE IF NOT EXISTS custom_tools (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            cost_gp REAL NOT NULL,
            weight_kg REAL NOT NULL,
            data JSON NOT NULL,
            parent_id TEXT,
            is_homebrew BOOLEAN DEFAULT 1,
            created_at INTEGER DEFAULT (unixepoch()),
            updated_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (parent_id) REFERENCES core_tools(id)
        );

        -- Weapons
        CREATE TABLE IF NOT EXISTS core_weapons (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            category_label TEXT,  -- NEU: Lesbare deutsche Bezeichnung (z.B. Einfache Waffen, Kriegswaffen)
            weapon_type TEXT,  -- DEPRECATED: Wird durch mastery_id ersetzt, bleibt für Rückwärtskompatibilität
            weapon_subtype TEXT,  -- NEU: Stangenwaffen, Fernkampfwaffen, Wurfwaffen, Nahkampfwaffen
            mastery_id TEXT,   -- NEU: Referenz zu weapon_masteries
            damage_dice TEXT NOT NULL,
            damage_type TEXT NOT NULL CHECK(damage_type IN ('hieb', 'stich', 'wucht')),
            weight_kg REAL NOT NULL,
            cost_gp REAL NOT NULL,
            data JSON NOT NULL,
            created_at INTEGER DEFAULT (unixepoch()),
            updated_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (mastery_id) REFERENCES weapon_masteries(id)
        );

        CREATE TABLE IF NOT EXISTS custom_weapons (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL CHECK(category IN ('simple_melee', 'simple_ranged', 'martial_melee', 'martial_ranged')),
            category_label TEXT,  -- NEU: Lesbare deutsche Bezeichnung
            weapon_type TEXT,  -- DEPRECATED: Wird durch mastery_id ersetzt, bleibt für Rückwärtskompatibilität
            weapon_subtype TEXT,  -- NEU: Stangenwaffen, Fernkampfwaffen, Wurfwaffen, Nahkampfwaffen
            mastery_id TEXT,   -- NEU: Referenz zu weapon_masteries
            damage_dice TEXT NOT NULL,
            damage_type TEXT NOT NULL CHECK(damage_type IN ('hieb', 'stich', 'wucht')),
            weight_kg REAL NOT NULL,
            cost_gp REAL NOT NULL,
            data JSON NOT NULL,
            parent_id TEXT,
            is_homebrew BOOLEAN DEFAULT 1,
            created_at INTEGER DEFAULT (unixepoch()),
            updated_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (parent_id) REFERENCES core_weapons(id) ON DELETE CASCADE,
            FOREIGN KEY (mastery_id) REFERENCES weapon_masteries(id)
        );

        -- Armor
        CREATE TABLE IF NOT EXISTS core_armors (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL CHECK(category IN ('leichte_ruestung', 'mittelschwere_ruestung', 'schwere_ruestung', 'schild')),
            category_label TEXT,  -- NEU: Lesbare deutsche Bezeichnung (z.B. Leichte Rüstung, Schilde)
            base_ac INTEGER,  -- NULL für Formeln (z.B. 11 + GES)
            ac_bonus INTEGER DEFAULT 0,  -- NEU: Für Schilde (+2)
            ac_formula TEXT,  -- NEU: z.B. 11 + DEX, 12 + DEX (max. 2), 14
            strength_requirement INTEGER,  -- STÄ 13 oder STÄ 15
            stealth_disadvantage BOOLEAN NOT NULL DEFAULT 0,
            don_time_minutes INTEGER,  -- NEU: Anlegezeit in Minuten
            doff_time_minutes INTEGER,  -- NEU: Ablegezeit in Minuten
            weight_kg REAL NOT NULL,
            cost_gp REAL NOT NULL,
            data JSON NOT NULL,
            created_at INTEGER DEFAULT (unixepoch())
        );

        CREATE TABLE IF NOT EXISTS custom_armors (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL CHECK(category IN ('leichte_ruestung', 'mittelschwere_ruestung', 'schwere_ruestung', 'schild')),
            category_label TEXT,  -- NEU: Lesbare deutsche Bezeichnung
            base_ac INTEGER,  -- NULL für Formeln (z.B. 11 + GES)
            ac_bonus INTEGER DEFAULT 0,  -- NEU: Für Schilde (+2)
            ac_formula TEXT,  -- NEU: z.B. 11 + DEX, 12 + DEX (max. 2), 14
            strength_requirement INTEGER,  -- STÄ 13 oder STÄ 15
            stealth_disadvantage BOOLEAN NOT NULL DEFAULT 0,
            don_time_minutes INTEGER,  -- NEU: Anlegezeit in Minuten
            doff_time_minutes INTEGER,  -- NEU: Ablegezeit in Minuten
            weight_kg REAL NOT NULL,
            cost_gp REAL NOT NULL,
            data JSON NOT NULL,
            parent_id TEXT,
            is_homebrew BOOLEAN DEFAULT 1,
            created_at INTEGER DEFAULT (unixepoch()),
            updated_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (parent_id) REFERENCES core_armors(id) ON DELETE CASCADE
        );

        -- Feats
        CREATE TABLE IF NOT EXISTS core_feats (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            data JSON NOT NULL,
            created_at INTEGER DEFAULT (unixepoch())
        );

        CREATE TABLE IF NOT EXISTS custom_feats (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            data JSON NOT NULL,
            parent_id TEXT,
            is_homebrew BOOLEAN DEFAULT 1,
            created_at INTEGER DEFAULT (unixepoch()),
            updated_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (parent_id) REFERENCES core_feats(id)
        );

        -- Skills
        CREATE TABLE IF NOT EXISTS core_skills (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            ability TEXT NOT NULL,
            description TEXT NOT NULL,
            created_at INTEGER DEFAULT (unixepoch())
        );

        -- Backgrounds
        CREATE TABLE IF NOT EXISTS core_backgrounds (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            data TEXT NOT NULL,
            created_at INTEGER DEFAULT (unixepoch())
        );

        CREATE TABLE IF NOT EXISTS custom_backgrounds (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            data TEXT NOT NULL,
            parent_id TEXT,
            is_homebrew BOOLEAN DEFAULT 1,
            created_at INTEGER DEFAULT (unixepoch()),
            updated_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (parent_id) REFERENCES core_backgrounds(id)
        );

        -- Other Tables
        CREATE TABLE IF NOT EXISTS weapon_properties (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            has_parameter BOOLEAN DEFAULT 0,
            parameter_type TEXT CHECK(parameter_type IN ('range', 'damage', 'ammo', 'range+ammo', 'bonus', 'special')),
            parameter_required BOOLEAN DEFAULT 0,
            data TEXT
        );

        CREATE TABLE IF NOT EXISTS weapon_masteries (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            data TEXT
        );

        -- Armor Properties (NEU - NOTWENDIG für magische Rüstungen)
        CREATE TABLE IF NOT EXISTS armor_properties (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            affects_field TEXT,  -- z.B. strength_requirement, stealth_disadvantage, ac_bonus
            data TEXT
        );

        -- Neue separate Mapping-Tabellen für bessere Integrität (Option B)
        CREATE TABLE IF NOT EXISTS core_armor_property_mappings (
            armor_id TEXT NOT NULL,
            property_id TEXT NOT NULL,
            parameter_value TEXT,
            PRIMARY KEY (armor_id, property_id),
            FOREIGN KEY (armor_id) REFERENCES core_armors(id) ON DELETE CASCADE,
            FOREIGN KEY (property_id) REFERENCES armor_properties(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS custom_armor_property_mappings (
            armor_id TEXT NOT NULL,
            property_id TEXT NOT NULL,
            parameter_value TEXT,
            PRIMARY KEY (armor_id, property_id),
            FOREIGN KEY (armor_id) REFERENCES custom_armors(id) ON DELETE CASCADE,
            FOREIGN KEY (property_id) REFERENCES armor_properties(id) ON DELETE CASCADE
        );

        -- View für Backward Compatibility (ersetzt die alte Tabelle armor_property_mappings langfristig)
        -- Wir behalten die alte Tabelle erst einmal bei, migrieren aber die Daten
        CREATE TABLE IF NOT EXISTS armor_property_mappings (
            armor_id TEXT NOT NULL,
            property_id TEXT NOT NULL,
            parameter_value TEXT,
            PRIMARY KEY (armor_id, property_id),
            FOREIGN KEY (property_id) REFERENCES armor_properties(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_armor_property_armor ON armor_property_mappings(armor_id);
        CREATE INDEX IF NOT EXISTS idx_armor_property_property ON armor_property_mappings(property_id);

        CREATE TABLE IF NOT EXISTS core_weapon_property_mappings (
            weapon_id TEXT NOT NULL,
            property_id TEXT NOT NULL,
            parameter_value TEXT,
            PRIMARY KEY (weapon_id, property_id),
            FOREIGN KEY (weapon_id) REFERENCES core_weapons(id) ON DELETE CASCADE,
            FOREIGN KEY (property_id) REFERENCES weapon_properties(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS custom_weapon_property_mappings (
            weapon_id TEXT NOT NULL,
            property_id TEXT NOT NULL,
            parameter_value TEXT,
            PRIMARY KEY (weapon_id, property_id),
            FOREIGN KEY (weapon_id) REFERENCES custom_weapons(id) ON DELETE CASCADE,
            FOREIGN KEY (property_id) REFERENCES weapon_properties(id) ON DELETE CASCADE
        );

        -- Migration 005: Weapon Property Mappings (Legacy Table)
        CREATE TABLE IF NOT EXISTS weapon_property_mappings (
            weapon_id TEXT NOT NULL,
            property_id TEXT NOT NULL,
            parameter_value TEXT,
            PRIMARY KEY (weapon_id, property_id),
            FOREIGN KEY (property_id) REFERENCES weapon_properties(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_weapon_property_weapon ON weapon_property_mappings(weapon_id);
        CREATE INDEX IF NOT EXISTS idx_weapon_property_property ON weapon_property_mappings(property_id);

        -- Datenmigration von weapon_property_mappings -> neue Tabellen
        INSERT OR IGNORE INTO core_weapon_property_mappings (weapon_id, property_id, parameter_value)
        SELECT weapon_id, property_id, parameter_value FROM weapon_property_mappings
        WHERE EXISTS (SELECT 1 FROM core_weapons WHERE id = weapon_id);

        INSERT OR IGNORE INTO custom_weapon_property_mappings (weapon_id, property_id, parameter_value)
        SELECT weapon_id, property_id, parameter_value FROM weapon_property_mappings
        WHERE EXISTS (SELECT 1 FROM custom_weapons WHERE id = weapon_id);

        -- View für vereinheitlichte Ansicht
        DROP VIEW IF EXISTS weapon_property_mappings_unified;
        CREATE VIEW weapon_property_mappings_unified AS
        SELECT weapon_id, property_id, parameter_value, 'core' as source
        FROM core_weapon_property_mappings
        UNION ALL
        SELECT weapon_id, property_id, parameter_value, 'custom' as source
        FROM custom_weapon_property_mappings;

        -- Trigger: Validiere weapon_id existiert in all_weapons_unified (wird nach View-Erstellung erstellt)

        CREATE TABLE IF NOT EXISTS characters (
            id TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            currency_cp INTEGER DEFAULT 0,
            currency_sp INTEGER DEFAULT 0,
            currency_ep INTEGER DEFAULT 0,
            currency_gp INTEGER DEFAULT 0,
            currency_pp INTEGER DEFAULT 0,
            created_at INTEGER DEFAULT (unixepoch()),
            updated_at INTEGER DEFAULT (unixepoch())
        );

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        -- Items
        CREATE TABLE IF NOT EXISTS core_items (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            cost_gp REAL NOT NULL,
            weight_kg REAL NOT NULL,
            category TEXT NOT NULL,
            data JSON NOT NULL,
            created_at INTEGER DEFAULT (unixepoch())
        );

        CREATE TABLE IF NOT EXISTS custom_items (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            cost_gp REAL NOT NULL,
            weight_kg REAL NOT NULL,
            category TEXT NOT NULL,
            data JSON NOT NULL,
            parent_id TEXT,
            is_homebrew BOOLEAN DEFAULT 1,
            created_at INTEGER DEFAULT (unixepoch()),
            updated_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (parent_id) REFERENCES core_items(id) ON DELETE CASCADE
        );

        -- Equipment Packages
        CREATE TABLE IF NOT EXISTS core_equipment (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            total_cost_gp REAL NOT NULL,
            total_weight_kg REAL NOT NULL,
            items JSON NOT NULL,
            tools JSON NOT NULL,
            data JSON NOT NULL,
            created_at INTEGER DEFAULT (unixepoch())
        );

        CREATE TABLE IF NOT EXISTS custom_equipment (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            total_cost_gp REAL NOT NULL,
            total_weight_kg REAL NOT NULL,
            items JSON NOT NULL,
            tools JSON NOT NULL,
            data JSON NOT NULL,
            parent_id TEXT,
            is_homebrew BOOLEAN DEFAULT 1,
            created_at INTEGER DEFAULT (unixepoch()),
            updated_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (parent_id) REFERENCES core_equipment(id) ON DELETE CASCADE
        );

        -- Equipment Items & Tools (normalisiert) - MUSS VOR Views erstellt werden
        CREATE TABLE IF NOT EXISTS core_equipment_items (
            equipment_id TEXT NOT NULL,
            item_id TEXT NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            PRIMARY KEY (equipment_id, item_id),
            FOREIGN KEY (equipment_id) REFERENCES core_equipment(id) ON DELETE CASCADE,
            FOREIGN KEY (item_id) REFERENCES core_items(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS custom_equipment_items (
            equipment_id TEXT NOT NULL,
            item_id TEXT NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            PRIMARY KEY (equipment_id, item_id),
            FOREIGN KEY (equipment_id) REFERENCES custom_equipment(id) ON DELETE CASCADE,
            FOREIGN KEY (item_id) REFERENCES core_items(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS core_equipment_tools (
            equipment_id TEXT NOT NULL,
            tool_id TEXT NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            source_table TEXT NOT NULL CHECK(source_table IN ('core_tools', 'custom_tools')),
            PRIMARY KEY (equipment_id, tool_id, source_table),
            FOREIGN KEY (equipment_id) REFERENCES core_equipment(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS custom_equipment_tools (
            equipment_id TEXT NOT NULL,
            tool_id TEXT NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            source_table TEXT NOT NULL CHECK(source_table IN ('core_tools', 'custom_tools')),
            PRIMARY KEY (equipment_id, tool_id, source_table),
            FOREIGN KEY (equipment_id) REFERENCES custom_equipment(id) ON DELETE CASCADE
        );

        -- Magische Gegenstände Tabellen - MUSS VOR Views erstellt werden
        CREATE TABLE IF NOT EXISTS core_mag_items_base (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            rarity TEXT NOT NULL,
            category TEXT NOT NULL,
            source_book TEXT,
            source_page INTEGER,
            requires_attunement BOOLEAN NOT NULL DEFAULT 0,
            facts_json TEXT NOT NULL,
            data JSON,  -- NEU: Vereinheitlichtes Datenfeld
            created_at INTEGER DEFAULT (unixepoch())
        );

        CREATE TABLE IF NOT EXISTS core_mag_weapons (
            item_base_id TEXT PRIMARY KEY,
            weapon_type TEXT,
            attack_bonus INTEGER,
            damage_bonus INTEGER,
            FOREIGN KEY (item_base_id) REFERENCES core_mag_items_base(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS core_mag_armor (
            item_base_id TEXT PRIMARY KEY,
            armor_type TEXT,
            ac_bonus INTEGER,
            FOREIGN KEY (item_base_id) REFERENCES core_mag_items_base(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS core_mag_consumables (
            item_base_id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            FOREIGN KEY (item_base_id) REFERENCES core_mag_items_base(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS core_mag_focus_items (
            item_base_id TEXT PRIMARY KEY,
            focus_type TEXT NOT NULL,
            charges_max INTEGER,
            recharge TEXT,
            FOREIGN KEY (item_base_id) REFERENCES core_mag_items_base(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS core_mag_jewelry (
            item_base_id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            FOREIGN KEY (item_base_id) REFERENCES core_mag_items_base(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS core_mag_wondrous (
            item_base_id TEXT PRIMARY KEY,
            FOREIGN KEY (item_base_id) REFERENCES core_mag_items_base(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS core_mag_item_crafting (
            item_base_id TEXT NOT NULL,
            tool_id TEXT NOT NULL,
            source_table TEXT NOT NULL CHECK(source_table IN ('core_tools', 'custom_tools')),
            PRIMARY KEY (item_base_id, tool_id, source_table),
            FOREIGN KEY (item_base_id) REFERENCES core_mag_items_base(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS custom_mag_items_base (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            rarity TEXT NOT NULL,
            category TEXT NOT NULL,
            source_book TEXT,
            source_page INTEGER,
            requires_attunement BOOLEAN NOT NULL DEFAULT 0,
            facts_json TEXT NOT NULL,
            data JSON,  -- NEU: Vereinheitlichtes Datenfeld
            parent_id TEXT,
            is_homebrew BOOLEAN DEFAULT 1,
            created_at INTEGER DEFAULT (unixepoch()),
            updated_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (parent_id) REFERENCES core_mag_items_base(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS custom_mag_weapons (
            item_base_id TEXT PRIMARY KEY,
            weapon_type TEXT,
            attack_bonus INTEGER,
            damage_bonus INTEGER,
            FOREIGN KEY (item_base_id) REFERENCES custom_mag_items_base(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS custom_mag_armor (
            item_base_id TEXT PRIMARY KEY,
            armor_type TEXT,
            ac_bonus INTEGER,
            FOREIGN KEY (item_base_id) REFERENCES custom_mag_items_base(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS custom_mag_consumables (
            item_base_id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            FOREIGN KEY (item_base_id) REFERENCES custom_mag_items_base(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS custom_mag_focus_items (
            item_base_id TEXT PRIMARY KEY,
            focus_type TEXT NOT NULL,
            charges_max INTEGER,
            recharge TEXT,
            FOREIGN KEY (item_base_id) REFERENCES custom_mag_items_base(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS custom_mag_jewelry (
            item_base_id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            FOREIGN KEY (item_base_id) REFERENCES custom_mag_items_base(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS custom_mag_wondrous (
            item_base_id TEXT PRIMARY KEY,
            FOREIGN KEY (item_base_id) REFERENCES custom_mag_items_base(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS custom_mag_item_crafting (
            item_base_id TEXT NOT NULL,
            tool_id TEXT NOT NULL,
            source_table TEXT NOT NULL CHECK(source_table IN ('core_tools', 'custom_tools')),
            PRIMARY KEY (item_base_id, tool_id, source_table),
            FOREIGN KEY (item_base_id) REFERENCES custom_mag_items_base(id) ON DELETE CASCADE
        );

        -- Views
        CREATE VIEW all_spells AS 
        SELECT 
            COALESCE(c.id, core.id) as id, COALESCE(c.name, core.name) as name, COALESCE(c.level, core.level) as level, 
            COALESCE(c.school, core.school) as school, COALESCE(c.casting_time, core.casting_time) as casting_time,
            COALESCE(c.range, core.range) as range, COALESCE(c.components, core.components) as components,
            COALESCE(c.material_components, core.material_components) as material_components,
            COALESCE(c.duration, core.duration) as duration, COALESCE(c.concentration, core.concentration) as concentration,
            COALESCE(c.ritual, core.ritual) as ritual, COALESCE(c.description, core.description) as description,
            COALESCE(c.higher_levels, core.higher_levels) as higher_levels, COALESCE(c.classes, core.classes) as classes,
            COALESCE(c.data, core.data) as data, 
            CASE 
                WHEN c.parent_id IS NOT NULL THEN 'override' 
                WHEN c.is_homebrew = 1 THEN 'homebrew' 
                ELSE 'core' 
            END as source 
        FROM core_spells core LEFT JOIN custom_spells c ON c.parent_id = core.id 
        UNION 
        SELECT id, name, level, school, casting_time, range, components, material_components, duration, concentration, ritual, description, higher_levels, classes, data, 
               CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM custom_spells WHERE parent_id IS NULL;

        CREATE VIEW all_species AS 
        SELECT COALESCE(c.id, core.id) as id, COALESCE(c.name, core.name) as name, COALESCE(c.data, core.data) as data, 
               CASE WHEN c.parent_id IS NOT NULL THEN 'override' WHEN c.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM core_species core LEFT JOIN custom_species c ON c.parent_id = core.id 
        UNION 
        SELECT id, name, data, CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM custom_species WHERE parent_id IS NULL;

        CREATE VIEW all_classes AS 
        SELECT COALESCE(c.id, core.id) as id, COALESCE(c.name, core.name) as name, COALESCE(c.data, core.data) as data, 
               CASE WHEN c.parent_id IS NOT NULL THEN 'override' WHEN c.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM core_classes core LEFT JOIN custom_classes c ON c.parent_id = core.id 
        UNION 
        SELECT id, name, data, CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM custom_classes WHERE parent_id IS NULL;

        CREATE VIEW all_gear AS 
        SELECT COALESCE(c.id, core.id) as id, COALESCE(c.name, core.name) as name, COALESCE(c.description, core.description) as description, 
               COALESCE(c.cost_gp, core.cost_gp) as cost_gp, COALESCE(c.weight_kg, core.weight_kg) as weight_kg, COALESCE(c.data, core.data) as data, 
               CASE WHEN c.parent_id IS NOT NULL THEN 'override' WHEN c.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM core_gear core LEFT JOIN custom_gear c ON c.parent_id = core.id 
        UNION 
        SELECT id, name, description, cost_gp, weight_kg, data, CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM custom_gear WHERE parent_id IS NULL;

        CREATE VIEW all_tools AS 
        SELECT COALESCE(c.id, core.id) as id, COALESCE(c.name, core.name) as name, COALESCE(c.category, core.category) as category, 
               COALESCE(c.cost_gp, core.cost_gp) as cost_gp, COALESCE(c.weight_kg, core.weight_kg) as weight_kg, COALESCE(c.data, core.data) as data, 
               CASE WHEN c.parent_id IS NOT NULL THEN 'override' WHEN c.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM core_tools core LEFT JOIN custom_tools c ON c.parent_id = core.id 
        UNION 
        SELECT id, name, category, cost_gp, weight_kg, data, CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM custom_tools WHERE parent_id IS NULL;

        CREATE VIEW all_weapons AS 
        SELECT COALESCE(cw.id, core.id) as id, COALESCE(cw.name, core.name) as name, COALESCE(cw.category, core.category) as category, 
               COALESCE(cw.category_label, core.category_label) as category_label,
               COALESCE(cw.weapon_type, core.weapon_type) as weapon_type, 
               COALESCE(cw.weapon_subtype, core.weapon_subtype) as weapon_subtype,
               COALESCE(cw.damage_dice, core.damage_dice) as damage_dice, 
               COALESCE(cw.damage_type, core.damage_type) as damage_type, COALESCE(cw.weight_kg, core.weight_kg) as weight_kg, 
               COALESCE(cw.cost_gp, core.cost_gp) as cost_gp, COALESCE(cw.data, core.data) as data, 
               CASE WHEN cw.parent_id IS NOT NULL THEN 'override' WHEN cw.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM core_weapons core LEFT JOIN custom_weapons cw ON cw.parent_id = core.id 
        UNION 
        SELECT id, name, category, category_label, weapon_type, weapon_subtype, damage_dice, damage_type, weight_kg, cost_gp, data, CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM custom_weapons WHERE parent_id IS NULL;

        CREATE VIEW all_weapons_unified AS 
        SELECT COALESCE(cw.id, core.id) as id, COALESCE(cw.name, core.name) as name, COALESCE(cw.category, core.category) as category, 
               COALESCE(cw.category_label, core.category_label) as category_label,
               COALESCE(cw.weapon_subtype, core.weapon_subtype) as weapon_subtype,
               COALESCE(cw.mastery_id, core.mastery_id) as mastery_id, COALESCE(cw.damage_dice, core.damage_dice) as damage_dice, 
               COALESCE(cw.damage_type, core.damage_type) as damage_type, COALESCE(cw.weight_kg, core.weight_kg) as weight_kg, 
               COALESCE(cw.cost_gp, core.cost_gp) as cost_gp, COALESCE(cw.data, core.data) as data, 
               CASE WHEN cw.parent_id IS NOT NULL THEN 'override' WHEN cw.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM core_weapons core LEFT JOIN custom_weapons cw ON cw.parent_id = core.id 
        UNION 
        SELECT id, name, category, category_label, weapon_subtype, mastery_id, damage_dice, damage_type, weight_kg, cost_gp, data, CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM custom_weapons WHERE parent_id IS NULL;

        CREATE VIEW all_armors AS 
        SELECT COALESCE(c.id, core.id) as id, COALESCE(c.name, core.name) as name, COALESCE(c.category, core.category) as category, 
               COALESCE(c.category_label, core.category_label) as category_label,
               COALESCE(c.base_ac, core.base_ac) as base_ac, COALESCE(c.ac_bonus, core.ac_bonus) as ac_bonus, 
               COALESCE(c.ac_formula, core.ac_formula) as ac_formula, COALESCE(c.strength_requirement, core.strength_requirement) as strength_requirement, 
               COALESCE(c.stealth_disadvantage, core.stealth_disadvantage) as stealth_disadvantage, 
               COALESCE(c.don_time_minutes, core.don_time_minutes) as don_time_minutes, 
               COALESCE(c.doff_time_minutes, core.doff_time_minutes) as doff_time_minutes, 
               COALESCE(c.weight_kg, core.weight_kg) as weight_kg, 
               COALESCE(c.cost_gp, core.cost_gp) as cost_gp, COALESCE(c.data, core.data) as data, 
               CASE WHEN c.parent_id IS NOT NULL THEN 'override' WHEN c.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM core_armors core LEFT JOIN custom_armors c ON c.parent_id = core.id 
        UNION 
        SELECT id, name, category, category_label, base_ac, ac_bonus, ac_formula, strength_requirement, stealth_disadvantage, 
               don_time_minutes, doff_time_minutes, weight_kg, cost_gp, data, 
               CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM custom_armors WHERE parent_id IS NULL;

        CREATE VIEW all_feats AS 
        SELECT COALESCE(c.id, core.id) as id, COALESCE(c.name, core.name) as name, COALESCE(c.category, core.category) as category, COALESCE(c.data, core.data) as data, 
               CASE WHEN c.parent_id IS NOT NULL THEN 'override' WHEN c.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM core_feats core LEFT JOIN custom_feats c ON c.parent_id = core.id 
        UNION 
        SELECT id, name, category, data, CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM custom_feats WHERE parent_id IS NULL;
        CREATE VIEW all_skills AS SELECT id, name, ability, description, 'core' as source FROM core_skills;

        CREATE VIEW all_backgrounds AS 
        SELECT COALESCE(c.id, core.id) as id, COALESCE(c.name, core.name) as name, COALESCE(c.data, core.data) as data, 
               CASE WHEN c.parent_id IS NOT NULL THEN 'override' WHEN c.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM core_backgrounds core LEFT JOIN custom_backgrounds c ON c.parent_id = core.id 
        UNION 
        SELECT id, name, data, CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM custom_backgrounds WHERE parent_id IS NULL;

        CREATE VIEW all_items AS 
        SELECT COALESCE(c.id, core.id) as id, COALESCE(c.name, core.name) as name, COALESCE(c.description, core.description) as description, 
               COALESCE(c.cost_gp, core.cost_gp) as cost_gp, COALESCE(c.weight_kg, core.weight_kg) as weight_kg, 
               COALESCE(c.category, core.category) as category, COALESCE(c.data, core.data) as data, 
               CASE WHEN c.parent_id IS NOT NULL THEN 'override' WHEN c.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM core_items core LEFT JOIN custom_items c ON c.parent_id = core.id 
        UNION 
        SELECT id, name, description, cost_gp, weight_kg, category, data, CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM custom_items WHERE parent_id IS NULL;

        CREATE VIEW all_equipment AS 
        SELECT 
            COALESCE(c.id, core.id) as id,
            COALESCE(c.name, core.name) as name,
            COALESCE(c.description, core.description) as description,
            COALESCE(c.total_cost_gp, core.total_cost_gp) as total_cost_gp,
            COALESCE(c.total_weight_kg, core.total_weight_kg) as total_weight_kg,
            COALESCE(c.data, core.data) as data,
            CASE 
                WHEN c.parent_id IS NOT NULL THEN 'override' 
                WHEN c.is_homebrew = 1 THEN 'homebrew' 
                ELSE 'core' 
            END as source
        FROM core_equipment core 
        LEFT JOIN custom_equipment c ON c.parent_id = core.id 
        UNION 
        SELECT 
            id, name, description, total_cost_gp, total_weight_kg, data,
            CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM custom_equipment 
        WHERE parent_id IS NULL;

        -- Views für magische Gegenstände
        CREATE VIEW all_mag_items_base AS 
        SELECT 
            COALESCE(c.id, core.id) as id,
            COALESCE(c.name, core.name) as name,
            COALESCE(c.rarity, core.rarity) as rarity,
            COALESCE(c.category, core.category) as category,
            COALESCE(c.source_book, core.source_book) as source_book,
            COALESCE(c.source_page, core.source_page) as source_page,
            COALESCE(c.requires_attunement, core.requires_attunement) as requires_attunement,
            COALESCE(c.facts_json, core.facts_json) as facts_json,
            COALESCE(c.data, core.data) as data,
            COALESCE(c.created_at, core.created_at) as created_at,
            CASE 
                WHEN c.parent_id IS NOT NULL THEN 'override' 
                WHEN c.is_homebrew = 1 THEN 'homebrew' 
                ELSE 'core' 
            END as source
        FROM core_mag_items_base core 
        LEFT JOIN custom_mag_items_base c ON c.parent_id = core.id 
        UNION 
        SELECT 
            id, name, rarity, category, source_book, source_page, 
            requires_attunement, facts_json, data, created_at,
            CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM custom_mag_items_base 
        WHERE parent_id IS NULL;

        CREATE VIEW all_mag_weapons AS
        SELECT 
            COALESCE(c.item_base_id, core.item_base_id) as item_base_id,
            COALESCE(c.weapon_type, core.weapon_type) as weapon_type,
            COALESCE(c.attack_bonus, core.attack_bonus) as attack_bonus,
            COALESCE(c.damage_bonus, core.damage_bonus) as damage_bonus,
            CASE 
                WHEN c.item_base_id IS NOT NULL THEN 
                    (SELECT source FROM all_mag_items_base WHERE id = c.item_base_id)
                ELSE 
                    (SELECT source FROM all_mag_items_base WHERE id = core.item_base_id)
            END as source
        FROM core_mag_weapons core 
        LEFT JOIN custom_mag_weapons c ON c.item_base_id = core.item_base_id
        UNION
        SELECT 
            item_base_id, weapon_type, attack_bonus, damage_bonus,
            (SELECT source FROM all_mag_items_base WHERE id = item_base_id) as source
        FROM custom_mag_weapons 
        WHERE item_base_id NOT IN (SELECT item_base_id FROM core_mag_weapons);

        CREATE VIEW all_mag_armor AS
        SELECT 
            COALESCE(c.item_base_id, core.item_base_id) as item_base_id,
            COALESCE(c.armor_type, core.armor_type) as armor_type,
            COALESCE(c.ac_bonus, core.ac_bonus) as ac_bonus,
            CASE 
                WHEN c.item_base_id IS NOT NULL THEN 
                    (SELECT source FROM all_mag_items_base WHERE id = c.item_base_id)
                ELSE 
                    (SELECT source FROM all_mag_items_base WHERE id = core.item_base_id)
            END as source
        FROM core_mag_armor core 
        LEFT JOIN custom_mag_armor c ON c.item_base_id = core.item_base_id
        UNION
        SELECT 
            item_base_id, armor_type, ac_bonus,
            (SELECT source FROM all_mag_items_base WHERE id = item_base_id) as source
        FROM custom_mag_armor 
        WHERE item_base_id NOT IN (SELECT item_base_id FROM core_mag_armor);

        CREATE VIEW all_mag_consumables AS
        SELECT 
            COALESCE(c.item_base_id, core.item_base_id) as item_base_id,
            COALESCE(c.type, core.type) as type,
            CASE 
                WHEN c.item_base_id IS NOT NULL THEN 
                    (SELECT source FROM all_mag_items_base WHERE id = c.item_base_id)
                ELSE 
                    (SELECT source FROM all_mag_items_base WHERE id = core.item_base_id)
            END as source
        FROM core_mag_consumables core 
        LEFT JOIN custom_mag_consumables c ON c.item_base_id = core.item_base_id
        UNION
        SELECT 
            item_base_id, type,
            (SELECT source FROM all_mag_items_base WHERE id = item_base_id) as source
        FROM custom_mag_consumables 
        WHERE item_base_id NOT IN (SELECT item_base_id FROM core_mag_consumables);

        CREATE VIEW all_mag_focus_items AS
        SELECT 
            COALESCE(c.item_base_id, core.item_base_id) as item_base_id,
            COALESCE(c.focus_type, core.focus_type) as focus_type,
            COALESCE(c.charges_max, core.charges_max) as charges_max,
            COALESCE(c.recharge, core.recharge) as recharge,
            CASE 
                WHEN c.item_base_id IS NOT NULL THEN 
                    (SELECT source FROM all_mag_items_base WHERE id = c.item_base_id)
                ELSE 
                    (SELECT source FROM all_mag_items_base WHERE id = core.item_base_id)
            END as source
        FROM core_mag_focus_items core 
        LEFT JOIN custom_mag_focus_items c ON c.item_base_id = core.item_base_id
        UNION
        SELECT 
            item_base_id, focus_type, charges_max, recharge,
            (SELECT source FROM all_mag_items_base WHERE id = item_base_id) as source
        FROM custom_mag_focus_items 
        WHERE item_base_id NOT IN (SELECT item_base_id FROM core_mag_focus_items);

        CREATE VIEW all_mag_jewelry AS
        SELECT 
            COALESCE(c.item_base_id, core.item_base_id) as item_base_id,
            COALESCE(c.type, core.type) as type,
            CASE 
                WHEN c.item_base_id IS NOT NULL THEN 
                    (SELECT source FROM all_mag_items_base WHERE id = c.item_base_id)
                ELSE 
                    (SELECT source FROM all_mag_items_base WHERE id = core.item_base_id)
            END as source
        FROM core_mag_jewelry core 
        LEFT JOIN custom_mag_jewelry c ON c.item_base_id = core.item_base_id
        UNION
        SELECT 
            item_base_id, type,
            (SELECT source FROM all_mag_items_base WHERE id = item_base_id) as source
        FROM custom_mag_jewelry 
        WHERE item_base_id NOT IN (SELECT item_base_id FROM core_mag_jewelry);

        CREATE VIEW all_mag_wondrous AS
        SELECT 
            COALESCE(c.item_base_id, core.item_base_id) as item_base_id,
            CASE 
                WHEN c.item_base_id IS NOT NULL THEN 
                    (SELECT source FROM all_mag_items_base WHERE id = c.item_base_id)
                ELSE 
                    (SELECT source FROM all_mag_items_base WHERE id = core.item_base_id)
            END as source
        FROM core_mag_wondrous core 
        LEFT JOIN custom_mag_wondrous c ON c.item_base_id = core.item_base_id
        UNION
        SELECT 
            item_base_id,
            (SELECT source FROM all_mag_items_base WHERE id = item_base_id) as source
        FROM custom_mag_wondrous 
        WHERE item_base_id NOT IN (SELECT item_base_id FROM core_mag_wondrous);

        -- Indizes für Performance (Checklist 6: < 10ms Lookups)
        CREATE INDEX IF NOT EXISTS idx_core_spells_name ON core_spells(name);
        CREATE INDEX IF NOT EXISTS idx_custom_spells_name ON custom_spells(name);
        CREATE INDEX IF NOT EXISTS idx_custom_spells_parent ON custom_spells(parent_id);
        
        CREATE INDEX IF NOT EXISTS idx_core_weapons_name ON core_weapons(name);
        CREATE INDEX IF NOT EXISTS idx_custom_weapons_name ON custom_weapons(name);
        
        CREATE INDEX IF NOT EXISTS idx_core_armors_name ON core_armors(name);
        CREATE INDEX IF NOT EXISTS idx_custom_armors_name ON custom_armors(name);

        CREATE INDEX IF NOT EXISTS idx_characters_updated ON characters(updated_at);

        CREATE INDEX IF NOT EXISTS idx_core_equipment_items_eq ON core_equipment_items(equipment_id);
        CREATE INDEX IF NOT EXISTS idx_core_equipment_items_item ON core_equipment_items(item_id);
        CREATE INDEX IF NOT EXISTS idx_custom_equipment_items_eq ON custom_equipment_items(equipment_id);
        CREATE INDEX IF NOT EXISTS idx_custom_equipment_items_item ON custom_equipment_items(item_id);
        CREATE INDEX IF NOT EXISTS idx_core_equipment_tools_eq ON core_equipment_tools(equipment_id);
        CREATE INDEX IF NOT EXISTS idx_custom_equipment_tools_eq ON custom_equipment_tools(equipment_id);

        CREATE INDEX IF NOT EXISTS idx_core_mag_items_name ON core_mag_items_base(name);
        CREATE INDEX IF NOT EXISTS idx_core_mag_items_category ON core_mag_items_base(category);
        CREATE INDEX IF NOT EXISTS idx_core_mag_items_rarity ON core_mag_items_base(rarity);
        CREATE INDEX IF NOT EXISTS idx_custom_mag_items_name ON custom_mag_items_base(name);
        CREATE INDEX IF NOT EXISTS idx_custom_mag_items_parent ON custom_mag_items_base(parent_id);

        -- Magic Item Data Migration & Sync Triggers
        -- Schritt 1: Spalten hinzufügen (falls noch nicht da)
        -- SQLite ignoriert Fehler bei bereits existierenden Spalten nicht, daher try-catch Logik via BEGIN/END nicht möglich in execute_batch
        -- Wir nutzen PRAGMA table_info um Spalten zu prüfen? Nein, in SQL schwierig.
        -- Aber ALTER TABLE ADD COLUMN ist idempotent if handled correctly, or we just rely on the fact that migrations run once.
        
        -- Da rusqlite execute_batch verwendet, können wir ALTER TABLE nur bedingt absichern.
        -- Wir führen es einfach aus, rusqlite wird einen Fehler werfen wenn die Spalte schon da ist, 
        -- was in diesem spezifischen Setup (alles in einem Batch) problematisch sein könnte.
        -- BESSER: Wir nutzen 'IF NOT EXISTS' Logik für Spalten gibt es in SQLite nicht.
        
        -- WORKAROUND: Wir machen es wie bei den Tabellen, 'CREATE TABLE IF NOT EXISTS' hat sie oben schon.
        -- Für bestehende Datenbanken führen wir das Update aus wenn data NULL ist.
        UPDATE core_mag_items_base SET data = json(facts_json) WHERE data IS NULL;
        UPDATE custom_mag_items_base SET data = json(facts_json) WHERE data IS NULL;

        -- Trigger für Magic Item Data Sync
        DROP TRIGGER IF EXISTS sync_mag_item_data_core;
        CREATE TRIGGER sync_mag_item_data_core
        AFTER INSERT ON core_mag_items_base
        FOR EACH ROW
        WHEN NEW.data IS NOT NULL
        BEGIN
            UPDATE core_mag_items_base SET facts_json = json(NEW.data) WHERE id = NEW.id;
        END;

        DROP TRIGGER IF EXISTS sync_mag_item_data_custom;
        CREATE TRIGGER sync_mag_item_data_custom
        AFTER INSERT ON custom_mag_items_base
        FOR EACH ROW
        WHEN NEW.data IS NOT NULL
        BEGIN
            UPDATE custom_mag_items_base SET facts_json = json(NEW.data) WHERE id = NEW.id;
        END;

        -- Zusätzliche Performance Indizes (wie vom User angefragt)
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
        CREATE VIEW IF NOT EXISTS all_weapons_minimal AS
        SELECT 
            id, 
            name, 
            category, 
            damage_dice, 
            damage_type, 
            cost_gp,
            source
        FROM all_weapons_unified;

        CREATE VIEW IF NOT EXISTS all_items_minimal AS
        SELECT 
            id,
            name,
            category,
            cost_gp,
            weight_kg,
            source
        FROM all_items;

        CREATE VIEW IF NOT EXISTS all_spells_minimal AS
        SELECT
            id,
            name,
            level,
            school,
            casting_time,
            source
        FROM all_spells;

        -- Trigger: Validiere weapon_id existiert in all_weapons_unified
        -- WICHTIG: Muss nach View-Erstellung kommen
        DROP TRIGGER IF EXISTS validate_weapon_id;
        CREATE TRIGGER validate_weapon_id
        BEFORE INSERT ON weapon_property_mappings
        BEGIN
            SELECT CASE
                WHEN NOT EXISTS (SELECT 1 FROM all_weapons_unified WHERE id = NEW.weapon_id)
                THEN RAISE(ABORT, 'weapon_id must exist in all_weapons_unified (core_weapons or custom_weapons)')
            END;
        END;

        -- Trigger: Validiere parameter_value ist gültiges JSON (wenn gesetzt)
        DROP TRIGGER IF EXISTS validate_property_parameter;
        CREATE TRIGGER validate_property_parameter
        BEFORE INSERT ON weapon_property_mappings
        WHEN NEW.parameter_value IS NOT NULL
        BEGIN
            SELECT CASE
                WHEN json_valid(NEW.parameter_value) = 0
                THEN RAISE(ABORT, 'parameter_value must be valid JSON')
            END;
        END;

        -- Trigger: Prüfe parameter_required
        DROP TRIGGER IF EXISTS check_property_parameter_requirement;
        CREATE TRIGGER check_property_parameter_requirement
        BEFORE INSERT ON weapon_property_mappings
        BEGIN
            SELECT CASE
                WHEN EXISTS (
                    SELECT 1 FROM weapon_properties 
                    WHERE id = NEW.property_id 
                    AND parameter_required = 1
                ) AND NEW.parameter_value IS NULL
                THEN RAISE(ABORT, 'parameter_value is required for this property')
            END;
        END;

        -- Trigger: Validiere magische Bonus-Struktur (für magisch/verzaubert Properties)
        DROP TRIGGER IF EXISTS validate_magical_bonus_structure;
        CREATE TRIGGER validate_magical_bonus_structure
        BEFORE INSERT ON weapon_property_mappings
        WHEN NEW.property_id IN ('magisch', 'verzaubert') AND NEW.parameter_value IS NOT NULL
        BEGIN
            SELECT CASE
                WHEN json_extract(NEW.parameter_value, '$.bonus_type') IS NULL
                THEN RAISE(ABORT, 'magical property parameter_value must have bonus_type field')
                WHEN json_extract(NEW.parameter_value, '$.bonus_type') NOT IN ('flat', 'dice')
                THEN RAISE(ABORT, 'bonus_type must be flat or dice')
                WHEN json_extract(NEW.parameter_value, '$.attack_bonus') IS NULL
                THEN RAISE(ABORT, 'magical property parameter_value must have attack_bonus field')
            END;
        END;

        -- Trigger: Validiere armor_property_mappings (Legacy)
        DROP TRIGGER IF EXISTS validate_armor_id;
        CREATE TRIGGER validate_armor_id
        BEFORE INSERT ON armor_property_mappings
        BEGIN
            SELECT CASE
                WHEN NOT EXISTS (SELECT 1 FROM all_armors WHERE id = NEW.armor_id)
                THEN RAISE(ABORT, 'armor_id must exist in all_armors (core_armors or custom_armors)')
            END;
        END;

        -- Datenmigration von armor_property_mappings -> neue Tabellen
        INSERT OR IGNORE INTO core_armor_property_mappings (armor_id, property_id, parameter_value)
        SELECT armor_id, property_id, parameter_value FROM armor_property_mappings
        WHERE EXISTS (SELECT 1 FROM core_armors WHERE id = armor_id);

        INSERT OR IGNORE INTO custom_armor_property_mappings (armor_id, property_id, parameter_value)
        SELECT armor_id, property_id, parameter_value FROM armor_property_mappings
        WHERE EXISTS (SELECT 1 FROM custom_armors WHERE id = armor_id);

        -- View für vereinheitlichte Ansicht
        DROP VIEW IF EXISTS armor_property_mappings_unified;
        CREATE VIEW armor_property_mappings_unified AS
        SELECT armor_id, property_id, parameter_value, 'core' as source
        FROM core_armor_property_mappings
        UNION ALL
        SELECT armor_id, property_id, parameter_value, 'custom' as source
        FROM custom_armor_property_mappings;

        -- Trigger: Validiere parameter_value ist gültiges JSON (wenn gesetzt)
        DROP TRIGGER IF EXISTS validate_armor_property_parameter;
        CREATE TRIGGER validate_armor_property_parameter
        BEFORE INSERT ON armor_property_mappings
        WHEN NEW.parameter_value IS NOT NULL
        BEGIN
            SELECT CASE
                WHEN json_valid(NEW.parameter_value) = 0
                THEN RAISE(ABORT, 'parameter_value must be valid JSON')
            END;
        END;

        -- Background Starting Equipment Migration (strukturierte Tabelle)
        CREATE TABLE IF NOT EXISTS background_starting_equipment (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            background_id TEXT NOT NULL,
            option_label TEXT,  -- 'A', 'B', oder NULL für feste Items
            item_name TEXT NOT NULL,  -- Name des Items (z.B. 'Sichel', 'Buch (Gebete)', 'GOLD')
            item_id TEXT,  -- FK zu core_items/custom_items (falls gefunden)
            tool_id TEXT,  -- FK zu core_tools/custom_tools (falls Tool)
            weapon_id TEXT,  -- FK zu core_weapons/custom_weapons (falls Waffe)
            quantity INTEGER DEFAULT 1,
            is_variant BOOLEAN DEFAULT 0,  -- TRUE für Varianten wie 'Buch (Gebete)'
            base_item_name TEXT,  -- Basis-Name ohne Variante (z.B. 'Buch' für 'Buch (Gebete)')
            variant_suffix TEXT,  -- Varianten-Suffix (z.B. '(Gebete)' für 'Buch (Gebete)')
            gold REAL,  -- Gold-Menge (nur wenn item_name = 'GOLD')
            is_gold BOOLEAN DEFAULT 0,  -- TRUE wenn dies ein Gold-Eintrag ist
            created_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (background_id) REFERENCES core_backgrounds(id) ON DELETE CASCADE,
            FOREIGN KEY (item_id) REFERENCES core_items(id) ON DELETE SET NULL,
            FOREIGN KEY (tool_id) REFERENCES core_tools(id) ON DELETE SET NULL,
            FOREIGN KEY (weapon_id) REFERENCES core_weapons(id) ON DELETE SET NULL
        );

        CREATE INDEX IF NOT EXISTS idx_bg_equipment_bg ON background_starting_equipment(background_id);
        CREATE INDEX IF NOT EXISTS idx_bg_equipment_option ON background_starting_equipment(background_id, option_label);
        CREATE INDEX IF NOT EXISTS idx_bg_equipment_item ON background_starting_equipment(item_id);
        
        -- Class Starting Equipment Migration (strukturierte Tabelle)
        -- Unterstützt sowohl core_classes als auch custom_classes (kein harter FK auf class_id)
        CREATE TABLE IF NOT EXISTS class_starting_equipment (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            class_id TEXT NOT NULL,
            is_custom BOOLEAN DEFAULT 0,  -- TRUE wenn class_id zu custom_classes gehört
            option_label TEXT,  -- 'A', 'B', 'C' oder NULL für feste Items
            item_name TEXT NOT NULL,  -- Name des Items (z.B. 'Lederrüstung', 'Zweihandaxt', 'GOLD')
            item_id TEXT,  -- FK zu core_items/custom_items (falls gefunden)
            tool_id TEXT,  -- FK zu core_tools/custom_tools (falls Tool)
            weapon_id TEXT,  -- FK zu core_weapons/custom_weapons (falls Waffe)
            armor_id TEXT,  -- FK zu core_armors/custom_armors (falls Rüstung)
            quantity INTEGER DEFAULT 1,
            is_variant BOOLEAN DEFAULT 0,  -- TRUE für Varianten wie 'Dolch (x5)'
            base_item_name TEXT,  -- Basis-Name ohne Variante
            variant_suffix TEXT,  -- Varianten-Suffix (z.B. '(x5)')
            gold REAL,  -- Gold-Menge (nur wenn item_name = 'GOLD')
            is_gold BOOLEAN DEFAULT 0,  -- TRUE wenn dies ein Gold-Eintrag ist
            created_at INTEGER DEFAULT (unixepoch()),
            -- Kein FK auf class_id: unterstützt sowohl core_classes als auch custom_classes
            FOREIGN KEY (item_id) REFERENCES core_items(id) ON DELETE SET NULL,
            FOREIGN KEY (tool_id) REFERENCES core_tools(id) ON DELETE SET NULL,
            FOREIGN KEY (weapon_id) REFERENCES core_weapons(id) ON DELETE SET NULL,
            FOREIGN KEY (armor_id) REFERENCES core_armors(id) ON DELETE SET NULL
        );

        CREATE INDEX IF NOT EXISTS idx_class_equipment_class ON class_starting_equipment(class_id);
        CREATE INDEX IF NOT EXISTS idx_class_equipment_is_custom ON class_starting_equipment(is_custom);
        CREATE INDEX IF NOT EXISTS idx_class_equipment_class_custom ON class_starting_equipment(class_id, is_custom);
        CREATE INDEX IF NOT EXISTS idx_class_equipment_option ON class_starting_equipment(class_id, option_label);
        CREATE INDEX IF NOT EXISTS idx_class_equipment_item ON class_starting_equipment(item_id);
        CREATE INDEX IF NOT EXISTS idx_class_equipment_weapon ON class_starting_equipment(weapon_id);
        CREATE INDEX IF NOT EXISTS idx_class_equipment_armor ON class_starting_equipment(armor_id);
        
        -- Trigger: Validiere class_id existiert in core_classes ODER custom_classes
        DROP TRIGGER IF EXISTS validate_class_id_exists;
        CREATE TRIGGER validate_class_id_exists
        BEFORE INSERT ON class_starting_equipment
        BEGIN
            SELECT CASE
                WHEN NOT EXISTS (
                    SELECT 1 FROM core_classes WHERE id = NEW.class_id
                ) AND NOT EXISTS (
                    SELECT 1 FROM custom_classes WHERE id = NEW.class_id
                )
                THEN RAISE(ABORT, 'class_id must exist in core_classes or custom_classes')
            END;
        END;
        
        -- Trigger: Validiere is_custom Flag korrekt gesetzt ist
        DROP TRIGGER IF EXISTS validate_class_is_custom_flag;
        CREATE TRIGGER validate_class_is_custom_flag
        BEFORE INSERT ON class_starting_equipment
        BEGIN
            SELECT CASE
                WHEN (NEW.is_custom = 0 AND NOT EXISTS (SELECT 1 FROM core_classes WHERE id = NEW.class_id))
                THEN RAISE(ABORT, 'is_custom=0 but class_id not found in core_classes')
                WHEN (NEW.is_custom = 1 AND NOT EXISTS (SELECT 1 FROM custom_classes WHERE id = NEW.class_id))
                THEN RAISE(ABORT, 'is_custom=1 but class_id not found in custom_classes')
            END;
        END;
        
        -- Trigger: Validiere custom_class_features Referenzen
        DROP TRIGGER IF EXISTS validate_custom_feature_class_reference;
        CREATE TRIGGER validate_custom_feature_class_reference
        BEFORE INSERT ON custom_class_features
        FOR EACH ROW
        BEGIN
            SELECT CASE
                WHEN NEW.class_source = 'core' AND 
                     (SELECT COUNT(*) FROM core_classes WHERE id = NEW.class_id) = 0
                THEN RAISE(ABORT, 'class_id must exist in core_classes when class_source=core')
                
                WHEN NEW.class_source = 'custom' AND 
                     (SELECT COUNT(*) FROM custom_classes WHERE id = NEW.class_id) = 0
                THEN RAISE(ABORT, 'class_id must exist in custom_classes when class_source=custom')
            END;
        END;

        -- Trigger: Validiere custom_subclasses Referenzen
        DROP TRIGGER IF EXISTS validate_custom_subclass_reference;
        CREATE TRIGGER validate_custom_subclass_reference
        BEFORE INSERT ON custom_subclasses
        FOR EACH ROW
        BEGIN
            SELECT CASE
                WHEN NEW.class_source = 'core' AND 
                     (SELECT COUNT(*) FROM core_classes WHERE id = NEW.class_id) = 0
                THEN RAISE(ABORT, 'class_id must exist in core_classes')
                
                WHEN NEW.class_source = 'custom' AND 
                     (SELECT COUNT(*) FROM custom_classes WHERE id = NEW.class_id) = 0
                THEN RAISE(ABORT, 'class_id must exist in custom_classes')
            END;
        END;

        -- Trigger: Validiere Feature-Effekte JSON-Struktur (Core)
        DROP TRIGGER IF EXISTS validate_feature_effects;
        CREATE TRIGGER validate_feature_effects
        BEFORE INSERT ON core_class_features
        FOR EACH ROW
        BEGIN
            SELECT CASE
                WHEN json_type(NEW.effects) != 'object'
                THEN RAISE(ABORT, 'effects must be a JSON object')
                WHEN json_extract(NEW.effects, '$.when_active') IS NOT NULL 
                     AND json_type(json_extract(NEW.effects, '$.when_active')) != 'array'
                THEN RAISE(ABORT, 'when_active must be an array')
                WHEN json_extract(NEW.effects, '$.when_passive') IS NOT NULL 
                     AND json_type(json_extract(NEW.effects, '$.when_passive')) != 'array'
                THEN RAISE(ABORT, 'when_passive must be an array')
            END;
        END;

        -- Trigger: Validiere Feature-Effekte JSON-Struktur (Custom)
        DROP TRIGGER IF EXISTS validate_feature_effects_custom;
        CREATE TRIGGER validate_feature_effects_custom
        BEFORE INSERT ON custom_class_features
        FOR EACH ROW
        BEGIN
            SELECT CASE
                WHEN json_type(NEW.effects) != 'object'
                THEN RAISE(ABORT, 'effects must be a JSON object')
                WHEN json_extract(NEW.effects, '$.when_active') IS NOT NULL 
                     AND json_type(json_extract(NEW.effects, '$.when_active')) != 'array'
                THEN RAISE(ABORT, 'when_active must be an array')
                WHEN json_extract(NEW.effects, '$.when_passive') IS NOT NULL 
                     AND json_type(json_extract(NEW.effects, '$.when_passive')) != 'array'
                THEN RAISE(ABORT, 'when_passive must be an array')
            END;
        END;

        -- Feature Prerequisites (für Feature-Abhängigkeiten)
        CREATE TABLE IF NOT EXISTS feature_prerequisites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            feature_id TEXT NOT NULL,
            prerequisite_type TEXT NOT NULL CHECK(prerequisite_type IN (
                'feature', 'level', 'attribute', 'class', 'subclass'
            )),
            prerequisite_value TEXT NOT NULL,
            created_at INTEGER DEFAULT (unixepoch())
        );

        CREATE INDEX IF NOT EXISTS idx_feature_prerequisites_feature ON feature_prerequisites(feature_id);
        CREATE INDEX IF NOT EXISTS idx_feature_prerequisites_type ON feature_prerequisites(prerequisite_type);
        CREATE INDEX IF NOT EXISTS idx_feature_prerequisites_feature_type ON feature_prerequisites(feature_id, prerequisite_type);
        
        -- Core Class Features
        CREATE TABLE IF NOT EXISTS core_class_features (
            id TEXT PRIMARY KEY,
            class_id TEXT NOT NULL,
            subclass_id TEXT,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            level INTEGER NOT NULL,
            feature_type TEXT NOT NULL CHECK(feature_type IN (
                'passive', 'active', 'progression', 'choice', 'reaction', 'bonus_action'
            )),
            effects JSON NOT NULL,
            conditions JSON,
            uses_per_rest TEXT,
            rest_type TEXT CHECK(rest_type IN ('short', 'long', NULL)),
            created_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (class_id) REFERENCES core_classes(id) ON DELETE CASCADE
        );

        -- Custom Class Features
        CREATE TABLE IF NOT EXISTS custom_class_features (
            id TEXT PRIMARY KEY,
            class_id TEXT NOT NULL,
            class_source TEXT NOT NULL CHECK(class_source IN ('core', 'custom')),
            subclass_id TEXT,
            subclass_source TEXT CHECK(subclass_source IN ('core', 'custom', NULL)),
            parent_id TEXT,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            level INTEGER NOT NULL,
            feature_type TEXT NOT NULL CHECK(feature_type IN (
                'passive', 'active', 'progression', 'choice', 'reaction', 'bonus_action'
            )),
            effects JSON NOT NULL,
            conditions JSON,
            uses_per_rest TEXT,
            rest_type TEXT CHECK(rest_type IN ('short', 'long', NULL)),
            created_at INTEGER DEFAULT (unixepoch()),
            updated_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (parent_id) REFERENCES core_class_features(id) ON DELETE SET NULL
        );

        -- Core Subclasses
        CREATE TABLE IF NOT EXISTS core_subclasses (
            id TEXT PRIMARY KEY,
            class_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            level INTEGER NOT NULL,
            created_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (class_id) REFERENCES core_classes(id) ON DELETE CASCADE
        );

        -- Custom Subclasses
        CREATE TABLE IF NOT EXISTS custom_subclasses (
            id TEXT PRIMARY KEY,
            class_id TEXT NOT NULL,
            class_source TEXT NOT NULL CHECK(class_source IN ('core', 'custom')),
            parent_id TEXT,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            level INTEGER NOT NULL,
            created_at INTEGER DEFAULT (unixepoch()),
            updated_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (parent_id) REFERENCES core_subclasses(id) ON DELETE SET NULL
        );

        -- Core Progression Tables
        CREATE TABLE IF NOT EXISTS core_progression_tables (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            class_id TEXT NOT NULL,
            level INTEGER NOT NULL,
            proficiency_bonus INTEGER NOT NULL,
            feature_names TEXT,
            class_specific_data JSON,
            created_at INTEGER DEFAULT (unixepoch()),
            UNIQUE(class_id, level),
            FOREIGN KEY (class_id) REFERENCES core_classes(id) ON DELETE CASCADE
        );

        -- Custom Progression Tables
        CREATE TABLE IF NOT EXISTS custom_progression_tables (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            class_id TEXT NOT NULL,
            level INTEGER NOT NULL,
            proficiency_bonus INTEGER NOT NULL,
            feature_names TEXT,
            class_specific_data JSON,
            created_at INTEGER DEFAULT (unixepoch()),
            UNIQUE(class_id, level),
            FOREIGN KEY (class_id) REFERENCES custom_classes(id) ON DELETE CASCADE
        );

        -- View: all_class_features (MUSS NACH Tabellen-Erstellung kommen)
        CREATE VIEW all_class_features AS
        SELECT 
            id,
            class_id,
            NULL as class_source,
            subclass_id,
            NULL as subclass_source,
            NULL as parent_id,
            name,
            description,
            level,
            feature_type,
            effects,
            conditions,
            uses_per_rest,
            rest_type,
            'core' as source,
            created_at,
            NULL as updated_at
        FROM core_class_features

        UNION ALL

        SELECT 
            id,
            class_id,
            class_source,
            subclass_id,
            subclass_source,
            parent_id,
            name,
            description,
            level,
            feature_type,
            effects,
            conditions,
            uses_per_rest,
            rest_type,
            CASE 
                WHEN parent_id IS NOT NULL THEN 'override'
                ELSE 'custom'
            END as source,
            created_at,
            updated_at
        FROM custom_class_features;

        -- View: all_subclasses (MUSS NACH Tabellen-Erstellung kommen)
        CREATE VIEW all_subclasses AS
        SELECT 
            id,
            class_id,
            'core' as class_source,
            NULL as parent_id,
            name,
            description,
            level,
            'core' as source,
            created_at,
            NULL as updated_at
        FROM core_subclasses

        UNION ALL

        SELECT 
            id,
            class_id,
            class_source,
            parent_id,
            name,
            description,
            level,
            CASE 
                WHEN parent_id IS NOT NULL THEN 'override'
                ELSE 'custom'
            END as source,
            created_at,
            updated_at
        FROM custom_subclasses;

        -- View: all_progression_tables (MUSS NACH Tabellen-Erstellung kommen)
        CREATE VIEW all_progression_tables AS
        SELECT 
            id,
            class_id,
            level,
            proficiency_bonus,
            feature_names,
            class_specific_data,
            'core' as source,
            created_at
        FROM core_progression_tables

        UNION ALL

        SELECT 
            id,
            class_id,
            level,
            proficiency_bonus,
            feature_names,
            class_specific_data,
            'custom' as source,
            created_at
        FROM custom_progression_tables;

        -- Class Features Indizes (MUSS NACH Tabellen-Erstellung kommen)
        CREATE INDEX IF NOT EXISTS idx_core_features_class_level ON core_class_features(class_id, level);
        CREATE INDEX IF NOT EXISTS idx_core_features_subclass ON core_class_features(subclass_id);
        CREATE INDEX IF NOT EXISTS idx_custom_features_class_level ON custom_class_features(class_id, level);
        CREATE INDEX IF NOT EXISTS idx_custom_features_subclass ON custom_class_features(subclass_id);
        CREATE INDEX IF NOT EXISTS idx_custom_features_parent ON custom_class_features(parent_id);

        -- Feature Options (für Choice-Features mit Optionen)
        CREATE TABLE IF NOT EXISTS core_feature_options (
            id TEXT PRIMARY KEY,
            feature_id TEXT NOT NULL,
            option_name TEXT NOT NULL,
            option_description TEXT NOT NULL,
            display_order INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (feature_id) REFERENCES core_class_features(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS custom_feature_options (
            id TEXT PRIMARY KEY,
            feature_id TEXT NOT NULL,
            option_name TEXT NOT NULL,
            option_description TEXT NOT NULL,
            display_order INTEGER NOT NULL DEFAULT 0,
            parent_id TEXT,
            created_at INTEGER DEFAULT (unixepoch()),
            updated_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (feature_id) REFERENCES custom_class_features(id) ON DELETE CASCADE,
            FOREIGN KEY (parent_id) REFERENCES core_feature_options(id) ON DELETE SET NULL
        );

        CREATE VIEW all_feature_options AS
        SELECT 
            COALESCE(c.id, core.id) as id,
            COALESCE(c.feature_id, core.feature_id) as feature_id,
            COALESCE(c.option_name, core.option_name) as option_name,
            COALESCE(c.option_description, core.option_description) as option_description,
            COALESCE(c.display_order, core.display_order) as display_order,
            CASE 
                WHEN c.parent_id IS NOT NULL THEN 'override'
                WHEN c.id IS NOT NULL THEN 'custom'
                ELSE 'core'
            END as source
        FROM core_feature_options core
        LEFT JOIN custom_feature_options c ON c.parent_id = core.id
        UNION ALL
        SELECT 
            id, feature_id, option_name, option_description, display_order,
            'custom' as source
        FROM custom_feature_options
        WHERE parent_id IS NULL;

        -- Subclasses Indizes (MUSS NACH Tabellen-Erstellung kommen)
        CREATE INDEX IF NOT EXISTS idx_core_subclasses_class ON core_subclasses(class_id);
        CREATE INDEX IF NOT EXISTS idx_custom_subclasses_class ON custom_subclasses(class_id);
        CREATE INDEX IF NOT EXISTS idx_custom_subclasses_parent ON custom_subclasses(parent_id);

        -- Feature Options Indizes
        CREATE INDEX IF NOT EXISTS idx_core_feature_options_feature ON core_feature_options(feature_id);
        CREATE INDEX IF NOT EXISTS idx_custom_feature_options_feature ON custom_feature_options(feature_id);
        CREATE INDEX IF NOT EXISTS idx_custom_feature_options_parent ON custom_feature_options(parent_id);

        -- Progression Tables Indizes (MUSS NACH Tabellen-Erstellung kommen)
        CREATE INDEX IF NOT EXISTS idx_core_progression_class_level ON core_progression_tables(class_id, level);
        CREATE INDEX IF NOT EXISTS idx_custom_progression_class_level ON custom_progression_tables(class_id, level);
        
        -- Aktualisiere category_label für Waffen
        UPDATE core_weapons SET category_label = 
            CASE category
                WHEN 'simple_melee' THEN 'Einfache Waffen'
                WHEN 'simple_ranged' THEN 'Einfache Waffen'
                WHEN 'martial_melee' THEN 'Kriegswaffen'
                WHEN 'martial_ranged' THEN 'Kriegswaffen'
                ELSE category
            END
        WHERE category_label IS NULL;
        
        UPDATE custom_weapons SET category_label = 
            CASE category
                WHEN 'simple_melee' THEN 'Einfache Waffen'
                WHEN 'simple_ranged' THEN 'Einfache Waffen'
                WHEN 'martial_melee' THEN 'Kriegswaffen'
                WHEN 'martial_ranged' THEN 'Kriegswaffen'
                ELSE category
            END
        WHERE category_label IS NULL;
        
        -- Aktualisiere category_label für Rüstungen
        UPDATE core_armors SET category_label = 
            CASE category
                WHEN 'leichte_ruestung' THEN 'Leichte Rüstung'
                WHEN 'mittelschwere_ruestung' THEN 'Mittelschwere Rüstung'
                WHEN 'schwere_ruestung' THEN 'Schwere Rüstung'
                WHEN 'schild' THEN 'Schilde'
                ELSE category
            END
        WHERE category_label IS NULL;
        
        UPDATE custom_armors SET category_label = 
            CASE category
                WHEN 'leichte_ruestung' THEN 'Leichte Rüstung'
                WHEN 'mittelschwere_ruestung' THEN 'Mittelschwere Rüstung'
                WHEN 'schwere_ruestung' THEN 'Schwere Rüstung'
                WHEN 'schild' THEN 'Schilde'
                ELSE category
            END
        WHERE category_label IS NULL;

        -- Update weapon property descriptions with complete PHB 2024 information
        UPDATE weapon_properties SET description = 'Wenn du mit Finesse-Waffen angreifst, hast du bei Angriffs- und Schadenswürfen die Wahl zwischen deinem Stärke- und deinem Geschicklichkeitsmodifikator. Du musst allerdings bei beiden Würfen denselben Modifikator verwenden.' WHERE id = 'finesse';
        UPDATE weapon_properties SET description = 'Du kannst Waffen mit der Eigenschaft Geschosse nur für Fernkampfangriffe verwenden, wenn du über entsprechende Geschosse verfügst. Die Art der erforderlichen Geschosse ist jeweils bei der Reichweite der Waffe angegeben. Jeder Angriff verbraucht ein Geschoss. Es ist Teil des Angriffs, die Waffe mit Geschossen zu laden (bei Einhandwaffen muss dazu eine Hand frei sein). Nach einem Kampf kannst du eine Minute damit verbringen, die Hälfte der Geschosse (abgerundet) zu bergen, die du im Kampf verbraucht hast. Der Rest geht verloren.' WHERE id = 'ammunition';
        UPDATE weapon_properties SET description = 'Du kannst mit einer Aktion, Bonusaktion oder Reaktion immer nur ein Geschoss aus einer Waffe mit der Eigenschaft Laden abfeuern, egal, wie viele Angriffe dir zur Verfügung stehen.' WHERE id = 'loading';
        UPDATE weapon_properties SET description = 'Wenn du in deinem Zug die Angriffsaktion ausführst und mit einer leichten Waffe angreifst, kannst du später im selben Zug als Bonusaktion einen zusätzlichen Angriff ausführen. Dieser zusätzliche Angriff muss mit einer anderen leichten Waffe ausgeführt werden, und du kannst dem Schaden des zusätzlichen Angriffs nicht deinen Attributsmodifikator hinzufügen, sofern dieser Modifikator nicht negativ ist.' WHERE id = 'light';
        UPDATE weapon_properties SET description = 'Die Reichweite von Fernkampfwaffen ist nach den Eigenschaften Geschosse oder Wurfwaffe aufgeführt. Sie umfasst zwei Werte: Der erste ist die Grundreichweite der Waffe in Metern, der zweite die Maximalreichweite. Wenn du ein Ziel außerhalb der Grundreichweite angreifst, bist du beim Angriffswurf im Nachteil. Du kannst keine Ziele außerhalb der Maximalreichweite angreifen.' WHERE id = 'range';
        UPDATE weapon_properties SET description = 'Du bist bei Angriffswürfen mit schweren Waffen im Nachteil, wenn du bei Nahkampfwaffen einen Stärkewert von weniger als 13 und bei Fernkampfwaffen einen Geschicklichkeitswert von weniger als 13 hast.' WHERE id = 'heavy';
        UPDATE weapon_properties SET description = 'Waffen mit der Eigenschaft Vielseitig können mit einer Hand oder mit zwei Händen geführt werden. Mit der Eigenschaft wird ein Schadenswert in Klammern genannt. Diesen Schaden bewirkt die Waffe, wenn sie mit zwei Händen geführt wird, um einen Nahkampfangriff auszuführen.' WHERE id = 'versatile';
        UPDATE weapon_properties SET description = 'Bei Waffen mit der Eigenschaft Weitreichend ist die normale Angriffsreichweite um 1,5 Meter erhöht. Dies gilt auch bei Gelegenheitsangriffen.' WHERE id = 'reach';
        UPDATE weapon_properties SET description = 'Waffen mit der Eigenschaft Wurfwaffe können geworfen werden, um Fernkampfangriffe auszuführen, und sie können als Teil des Angriffs gezogen werden. Wenn es sich um eine Nahkampfwaffe handelt, die du wirfst, verwendest du bei Angriffs- und Schadenswürfen den gleichen Attributsmodifikator wie bei Nahkampfangriffen mit der Waffe.' WHERE id = 'thrown';
        UPDATE weapon_properties SET description = 'Waffen mit der Eigenschaft Zweihändig müssen mit zwei Händen geführt werden.' WHERE id = 'two-handed';
        
        -- Update weapon mastery descriptions with complete PHB 2024 information
        UPDATE weapon_masteries SET description = 'Wenn du eine Kreatur mit dieser Waffe triffst, ist diese Kreatur bei ihrem nächsten Angriffswurf vor Beginn deines nächsten Zugs im Nachteil.' WHERE id = 'sap';
        UPDATE weapon_masteries SET description = 'Wenn du den zusätzlichen Angriff der Eigenschaft Leicht ausführst, kannst du dies als Teil der Angriffsaktion statt als Bonusaktion tun. Du kannst diesen zusätzlichen Angriff nur einmal pro Zug ausführen.' WHERE id = 'nick';
        UPDATE weapon_masteries SET description = 'Wenn du eine Kreatur mit dieser Waffe triffst und ihr Schaden zufügst, bist du beim nächsten Angriffswurf gegen diese Kreatur vor Ende deines nächsten Zugs im Vorteil.' WHERE id = 'vex';
        UPDATE weapon_masteries SET description = 'Wenn du eine Kreatur mit einem Nahkampfangriffswurf triffst, den du mit dieser Waffe ausführst, kannst du mit der Waffe einen weiteren Nahkampfangriff auf eine zweite Kreatur im Abstand von bis zu 1,5 Metern von der ersten ausführen, sofern die zweite sich ebenfalls in Reichweite befindet. Bei einem Treffer erleidet die Kreatur den Waffenschaden. Du fügst dem Schaden jedoch nicht deinen Attributsmodifikator hinzu, sofern dieser Modifikator nicht negativ ist. Du kannst diesen zusätzlichen Angriff nur einmal pro Zug ausführen.' WHERE id = 'cleave';
        UPDATE weapon_masteries SET description = 'Wenn du eine Kreatur mit dieser Waffe triffst, kannst du sie bis zu drei Meter weit in gerader Linie von dir wegstoßen, sofern sie von höchstens großer Größe ist.' WHERE id = 'push';
        UPDATE weapon_masteries SET description = 'Wenn dein Angriffswurf mit dieser Waffe eine Kreatur verfehlt, kannst du der Kreatur Schaden in Höhe des Attributsmodifikators zufügen, den du für den Angriffswurf verwendet hast. Die Schadensart entspricht der Waffe. Der Schaden kann nur durch Erhöhen des Attributsmodifikators erhöht werden.' WHERE id = 'graze';
        UPDATE weapon_masteries SET description = 'Wenn du eine Kreatur mit dieser Waffe triffst, kannst du sie zu einem Konstitutionsrettungswurf (SG 8 plus Attributsmodifikator für den Angriffswurf plus dein Übungsbonus) zwingen. Scheitert der Wurf, so wird die Kreatur umgestoßen.' WHERE id = 'topple';
        UPDATE weapon_masteries SET description = 'Wenn du eine Kreatur mit dieser Waffe triffst und ihr Schaden zufügst, kannst du ihre Bewegungsrate bis zum Beginn deines nächsten Zugs um drei Meter verringern. Wird die Kreatur mehrfach von Waffen mit dieser Eigenschaft getroffen, so wird ihre Bewegungsrate dennoch nur um drei Meter verringert.' WHERE id = 'slow';
        
        -- Update weapon data with complete information from PHB 2024
        -- EINFACHE NAHKAMPFWAFFEN
        UPDATE core_weapons SET data = json_set(json_set(json_set(data, '$.properties', json('[\"light\", \"thrown\"]')), '$.thrown_range', json('{\"normal\": 6, \"max\": 18}')), '$.source_page', 213) WHERE name = 'Beil';
        UPDATE core_weapons SET data = json_set(json_set(json_set(json_set(data, '$.properties', json('[\"finesse\", \"light\", \"thrown\"]')), '$.thrown_range', json('{\"normal\": 6, \"max\": 18}')), '$.source_page', 213), '$.property_details', json('{}')) WHERE name = 'Dolch';
        UPDATE core_weapons SET data = json_set(json_set(data, '$.properties', json('[\"versatile\"]')), '$.versatile_damage', '1W8') WHERE name = 'Kampfstab';
        UPDATE core_weapons SET data = json_set(data, '$.properties', json('[\"light\"]')) WHERE name = 'Knüppel';
        UPDATE core_weapons SET data = json_set(json_set(json_set(data, '$.properties', json('[\"light\", \"thrown\"]')), '$.thrown_range', json('{\"normal\": 6, \"max\": 18}')), '$.source_page', 213) WHERE name IN ('Leichter Hammer', 'leichter Hammer');
        UPDATE core_weapons SET data = json_set(data, '$.properties', json('[\"light\"]')) WHERE name = 'Sichel';
        UPDATE core_weapons SET data = json_set(json_set(json_set(json_set(data, '$.properties', json('[\"versatile\", \"thrown\"]')), '$.versatile_damage', '1W8'), '$.thrown_range', json('{\"normal\": 6, \"max\": 18}')), '$.source_page', 213) WHERE name = 'Speer';
        UPDATE core_weapons SET data = json_set(data, '$.properties', json('[]')) WHERE name = 'Streitkolben';
        UPDATE core_weapons SET data = json_set(json_set(json_set(data, '$.properties', json('[\"thrown\"]')), '$.thrown_range', json('{\"normal\": 9, \"max\": 36}')), '$.source_page', 213) WHERE name = 'Wurfspeer';
        UPDATE core_weapons SET data = json_set(data, '$.properties', json('[\"two-handed\"]')) WHERE name = 'Zweihandknüppel';
        
        -- EINFACHE FERNKAMPFWAFFEN
        UPDATE core_weapons SET data = json_set(json_set(json_set(json_set(data, '$.properties', json('[\"ammunition\", \"two-handed\"]')), '$.range', json('{\"normal\": 24, \"max\": 96}')), '$.ammunition_type', 'Pfeil'), '$.source_page', 213) WHERE name = 'Kurzbogen';
        UPDATE core_weapons SET data = json_set(json_set(json_set(json_set(json_set(data, '$.properties', json('[\"ammunition\", \"loading\", \"two-handed\"]')), '$.range', json('{\"normal\": 24, \"max\": 96}')), '$.ammunition_type', 'Bolzen'), '$.source_page', 213), '$.property_details', json('{}')) WHERE name IN ('Leichte Armbrust', 'leichte Armbrust');
        -- Schleuder: Geschosse (Reichweite 9/36, Kugel) - Gewicht fehlt in Tabelle, setze auf 0
        UPDATE core_weapons SET data = json_set(json_set(json_set(json_set(data, '$.properties', json('[\"ammunition\"]')), '$.range', json('{\"normal\": 9, \"max\": 36}')), '$.ammunition_type', 'Kugel'), '$.source_page', 213) WHERE name = 'Schleuder';
        UPDATE core_weapons SET data = json_set(json_set(json_set(json_set(data, '$.properties', json('[\"finesse\", \"thrown\"]')), '$.thrown_range', json('{\"normal\": 6, \"max\": 18}')), '$.source_page', 213), '$.property_details', json('{}')) WHERE name = 'Wurfpfeil';
        
        -- NAHKAMPF KRIEGSWAFFEN
        UPDATE core_weapons SET data = json_set(json_set(json_set(json_set(data, '$.properties', json('[\"versatile\", \"thrown\"]')), '$.versatile_damage', '1W10'), '$.thrown_range', json('{\"normal\": 6, \"max\": 18}')), '$.source_page', 213) WHERE name = 'Dreizack';
        UPDATE core_weapons SET data = json_set(data, '$.properties', json('[]')) WHERE name = 'Flegel';
        UPDATE core_weapons SET data = json_set(data, '$.properties', json('[\"heavy\", \"reach\", \"two-handed\"]')) WHERE name = 'Glefe';
        UPDATE core_weapons SET data = json_set(data, '$.properties', json('[\"heavy\", \"reach\", \"two-handed\"]')) WHERE name = 'Hellebarde';
        UPDATE core_weapons SET data = json_set(json_set(data, '$.properties', json('[\"versatile\"]')), '$.versatile_damage', '1W10') WHERE name = 'Kriegshammer';
        UPDATE core_weapons SET data = json_set(json_set(data, '$.properties', json('[\"versatile\"]')), '$.versatile_damage', '1W10') WHERE name = 'Kriegspicke';
        UPDATE core_weapons SET data = json_set(data, '$.properties', json('[\"finesse\", \"light\"]')) WHERE name = 'Krummsäbel';
        UPDATE core_weapons SET data = json_set(data, '$.properties', json('[\"finesse\", \"light\"]')) WHERE name = 'Kurzschwert';
        UPDATE core_weapons SET data = json_set(json_set(data, '$.properties', json('[\"versatile\"]')), '$.versatile_damage', '1W10') WHERE name = 'Langschwert';
        UPDATE core_weapons SET data = json_set(data, '$.properties', json('[\"heavy\", \"reach\", \"two-handed\"]')) WHERE name = 'Lanze';
        UPDATE core_weapons SET data = json_set(data, '$.properties', json('[]')) WHERE name = 'Morgenstern';
        UPDATE core_weapons SET data = json_set(data, '$.properties', json('[\"finesse\", \"reach\"]')) WHERE name = 'Peitsche';
        UPDATE core_weapons SET data = json_set(data, '$.properties', json('[\"heavy\", \"reach\", \"two-handed\"]')) WHERE name = 'Pike';
        UPDATE core_weapons SET data = json_set(data, '$.properties', json('[\"finesse\"]')) WHERE name = 'Rapier';
        UPDATE core_weapons SET data = json_set(json_set(data, '$.properties', json('[\"versatile\"]')), '$.versatile_damage', '1W10') WHERE name = 'Streitaxt';
        UPDATE core_weapons SET data = json_set(data, '$.properties', json('[\"heavy\", \"two-handed\"]')) WHERE name = 'Zweihandaxt';
        UPDATE core_weapons SET data = json_set(data, '$.properties', json('[\"heavy\", \"two-handed\"]')) WHERE name = 'Zweihandhammer';
        UPDATE core_weapons SET data = json_set(data, '$.properties', json('[\"heavy\", \"two-handed\"]')) WHERE name = 'Zweihandschwert';
        
        -- FERNKAMPF KRIEGSWAFFEN
        UPDATE core_weapons SET data = json_set(json_set(json_set(json_set(data, '$.properties', json('[\"ammunition\", \"loading\"]')), '$.range', json('{\"normal\": 7.5, \"max\": 30}')), '$.ammunition_type', 'Blasrohrpfeil'), '$.source_page', 213) WHERE name = 'Blasrohr';
        UPDATE core_weapons SET data = json_set(json_set(json_set(json_set(json_set(data, '$.properties', json('[\"ammunition\", \"light\", \"loading\"]')), '$.range', json('{\"normal\": 9, \"max\": 36}')), '$.ammunition_type', 'Bolzen'), '$.source_page', 213), '$.property_details', json('{}')) WHERE name = 'Handarmbrust';
        UPDATE core_weapons SET data = json_set(json_set(json_set(json_set(json_set(data, '$.properties', json('[\"ammunition\", \"heavy\", \"two-handed\"]')), '$.range', json('{\"normal\": 45, \"max\": 180}')), '$.ammunition_type', 'Pfeil'), '$.source_page', 213), '$.property_details', json('{}')) WHERE name = 'Langbogen';
        UPDATE core_weapons SET data = json_set(json_set(json_set(json_set(json_set(data, '$.properties', json('[\"ammunition\", \"loading\", \"two-handed\"]')), '$.range', json('{\"normal\": 12, \"max\": 36}')), '$.ammunition_type', 'Kugel'), '$.source_page', 213), '$.property_details', json('{}')) WHERE name = 'Muskete';
        UPDATE core_weapons SET data = json_set(json_set(json_set(json_set(data, '$.properties', json('[\"ammunition\", \"loading\"]')), '$.range', json('{\"normal\": 9, \"max\": 27}')), '$.ammunition_type', 'Kugel'), '$.source_page', 213) WHERE name = 'Pistole';
        UPDATE core_weapons SET data = json_set(json_set(json_set(json_set(json_set(data, '$.properties', json('[\"ammunition\", \"loading\", \"heavy\", \"two-handed\"]')), '$.range', json('{\"normal\": 30, \"max\": 120}')), '$.ammunition_type', 'Bolzen'), '$.source_page', 213), '$.property_details', json('{}')) WHERE name = 'Schwere Armbrust';
        
        -- Stelle sicher, dass source_page für alle Waffen gesetzt ist
        UPDATE core_weapons SET data = json_set(data, '$.source_page', 213) WHERE json_extract(data, '$.source_page') IS NULL;
        
        -- WICHTIG: Entferne ALLE Duplikate aus weapon_property_mappings
        -- Behalte nur die erste Eintragung für jede weapon_id + property_id Kombination
        -- Führe dies MEHRMALS aus, um sicherzustellen, dass alle Duplikate entfernt werden
        DELETE FROM weapon_property_mappings 
        WHERE rowid NOT IN (
            SELECT MIN(rowid) 
            FROM weapon_property_mappings 
            GROUP BY weapon_id, property_id
        );
        
        -- Erstelle UNIQUE Constraint, um zukünftige Duplikate zu verhindern
        -- Falls der Index bereits existiert, wird er ignoriert
        CREATE UNIQUE INDEX IF NOT EXISTS idx_weapon_property_unique 
        ON weapon_property_mappings(weapon_id, property_id);
        
        -- Füge fehlende Properties für Waffen hinzu, die in data.properties definiert sind
        -- aber nicht in weapon_property_mappings existieren
        -- Verwende INSERT OR IGNORE, um Duplikate zu verhindern (funktioniert nur mit UNIQUE Constraint)
        INSERT OR IGNORE INTO weapon_property_mappings (weapon_id, property_id, parameter_value)
        SELECT 
            w.id,
            json_each.value,
            NULL
        FROM all_weapons_unified w
        CROSS JOIN json_each(json_extract(w.data, '$.properties'))
        WHERE json_each.value IS NOT NULL
        AND json_each.value != '';
        
        -- Finale Bereinigung: Entferne eventuell durch INSERT erzeugte Duplikate
        -- (sollte nicht passieren, aber sicherheitshalber)
        DELETE FROM weapon_property_mappings 
        WHERE rowid NOT IN (
            SELECT MIN(rowid) 
            FROM weapon_property_mappings 
            GROUP BY weapon_id, property_id
        );

        -- Character Inventory (Normalized)
        CREATE TABLE IF NOT EXISTS character_inventory (
            id TEXT PRIMARY KEY,
            character_id TEXT NOT NULL,
            item_id TEXT NOT NULL,
            item_type TEXT NOT NULL CHECK(item_type IN ('core_item', 'custom_item', 'core_weapon', 'custom_weapon', 'core_armor', 'custom_armor', 'core_magic_item', 'custom_magic_item')),
            quantity INTEGER NOT NULL DEFAULT 1,
            is_equipped BOOLEAN NOT NULL DEFAULT 0,
            container_id TEXT, -- For nested containers
            custom_name TEXT, 
            custom_description TEXT,
            is_attuned BOOLEAN NOT NULL DEFAULT 0,
            data JSON,        -- Container-specific data or overrides
            created_at INTEGER DEFAULT (unixepoch()),
            updated_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
            FOREIGN KEY (container_id) REFERENCES character_inventory(id) ON DELETE SET NULL
        );

        CREATE INDEX IF NOT EXISTS idx_inv_character ON character_inventory(character_id);
        CREATE INDEX IF NOT EXISTS idx_inv_container ON character_inventory(container_id);

        -- Character Spells (Normalized)
        CREATE TABLE IF NOT EXISTS character_spells (
            id TEXT PRIMARY KEY,
            character_id TEXT NOT NULL,
            spell_id TEXT NOT NULL,
            is_prepared BOOLEAN NOT NULL DEFAULT 0,
            is_always_prepared BOOLEAN NOT NULL DEFAULT 0,
            source TEXT, -- e.g. 'class', 'race', 'feat', 'item'
            created_at INTEGER DEFAULT (unixepoch()),
            updated_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_spells_character ON character_spells(character_id);

        -- Character Proficiencies (Normalized)
        CREATE TABLE IF NOT EXISTS character_proficiencies (
            id TEXT PRIMARY KEY,
            character_id TEXT NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('skill', 'saving_throw', 'weapon', 'armor', 'tool', 'language')),
            ref_id TEXT NOT NULL,
            source TEXT, -- e.g. 'class', 'race', 'feat', 'item'
            created_at INTEGER DEFAULT (unixepoch()),
            updated_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_prof_character ON character_proficiencies(character_id);

        -- Character Features (Normalized)
        CREATE TABLE IF NOT EXISTS character_features (
            id TEXT PRIMARY KEY,
            character_id TEXT NOT NULL,
            feature_id TEXT NOT NULL,
            source TEXT, -- e.g. 'class', 'race', 'feat', 'item'
            created_at INTEGER DEFAULT (unixepoch()),
            updated_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_features_character ON character_features(character_id);

        -- Character Modifiers (Normalized)
        CREATE TABLE IF NOT EXISTS character_modifiers (
            id TEXT PRIMARY KEY,
            character_id TEXT NOT NULL,
            source TEXT NOT NULL, -- e.g. 'feat:tough', 'item:ring_of_protection'
            target TEXT NOT NULL, -- e.g. 'hp_max', 'ac', 'str'
            modifier_type TEXT NOT NULL CHECK(modifier_type IN ('Override', 'Add', 'Multiply')),
            value INTEGER NOT NULL,
            condition TEXT,
            created_at INTEGER DEFAULT (unixepoch()),
            updated_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_modifiers_character ON character_modifiers(character_id);

        -- View for backward compatibility (Phase 2)
        DROP VIEW IF EXISTS character_inventory_legacy_view;
        CREATE VIEW character_inventory_legacy_view AS
        SELECT 
            character_id,
            json_group_array(
                json_object(
                    'id', id,
                    'item_id', item_id,
                    'item_type', item_type,
                    'quantity', quantity,
                    'is_equipped', is_equipped,
                    'container_id', container_id,
                    'custom_name', custom_name,
                    'custom_description', custom_description,
                    'data', json(data)
                )
            ) as inventory_json
        FROM character_inventory
        GROUP BY character_id;

        COMMIT;"
    ).map_err(|e| format!("Migration error: {}", e))?;
    
    // Füge category_label Spalten hinzu, falls sie noch nicht existieren
    // SQLite unterstützt kein IF NOT EXISTS für ALTER TABLE ADD COLUMN,
    // daher prüfen wir zuerst, ob die Spalte existiert
    let add_column_if_not_exists = |table: &str, column: &str| -> Result<(), String> {
        // Prüfe, ob die Spalte bereits existiert
        let mut stmt = conn.prepare(&format!("PRAGMA table_info({})", table))
            .map_err(|e| format!("Konnte table_info nicht abfragen: {}", e))?;
        let columns: Vec<String> = stmt
            .query_map([], |row| row.get::<_, String>(1)) // column name ist an Position 1
        .map_err(|e| format!("Fehler beim Abfragen der Spalten: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Fehler beim Sammeln der Spalten: {}", e))?;
        
        if !columns.contains(&column.to_string()) {
            conn.execute(&format!("ALTER TABLE {} ADD COLUMN {} TEXT", table, column), [])
                .map_err(|e| format!("Konnte Spalte {} zu {} nicht hinzufügen: {}", column, table, e))?;
        }
        Ok(())
    };
    
    // Füge category_label zu Waffen hinzu (falls noch nicht vorhanden)
    add_column_if_not_exists("core_weapons", "category_label")?;
    add_column_if_not_exists("custom_weapons", "category_label")?;
    
    // Füge category_label zu Rüstungen hinzu (falls noch nicht vorhanden)
    add_column_if_not_exists("core_armors", "category_label")?;
    add_column_if_not_exists("custom_armors", "category_label")?;
    
    // Füge weapon_subtype zu Waffen hinzu (falls noch nicht vorhanden)
    add_column_if_not_exists("core_weapons", "weapon_subtype")?;
    add_column_if_not_exists("custom_weapons", "weapon_subtype")?;
    
    // Aktualisiere weapon_subtype basierend auf Waffeneigenschaften
    // Stangenwaffen: Waffen mit "reach" (Weitreichend)
    // Fernkampfwaffen: Waffen mit "ammunition" (Geschosse) oder category enthält "ranged"
    // Wurfwaffen: Waffen mit "thrown" (Wurfwaffe)
    // Nahkampfwaffen: Alle anderen Nahkampfwaffen
    let update_weapon_subtype = |table: &str| -> Result<(), String> {
        // Prüfe, ob weapon_subtype Spalte existiert
        let mut stmt = conn.prepare(&format!("PRAGMA table_info({})", table))
            .map_err(|e| format!("Konnte table_info nicht abfragen: {}", e))?;
        let columns: Vec<String> = stmt
            .query_map([], |row| row.get::<_, String>(1))
        .map_err(|e| format!("Fehler beim Abfragen der Spalten: {}", e))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Fehler beim Sammeln der Spalten: {}", e))?;
        
        if !columns.contains(&"weapon_subtype".to_string()) {
            return Ok(()); // Spalte existiert nicht, nichts zu tun
        }
        
        // Aktualisiere weapon_subtype basierend auf Eigenschaften
        // SQLite JSON-Funktionen verwenden
        conn.execute(
            &format!(
                "UPDATE {} SET weapon_subtype = CASE
                    WHEN json_extract(data, '$.properties') IS NOT NULL AND 
                         json_array_length(json_extract(data, '$.properties')) > 0 AND
                         EXISTS (SELECT 1 FROM json_each(json_extract(data, '$.properties')) WHERE value = 'reach')
                    THEN 'Stangenwaffen'
                    WHEN category LIKE '%ranged%' OR 
                         (json_extract(data, '$.properties') IS NOT NULL AND 
                          EXISTS (SELECT 1 FROM json_each(json_extract(data, '$.properties')) WHERE value = 'ammunition'))
                    THEN 'Fernkampfwaffen'
                    WHEN json_extract(data, '$.properties') IS NOT NULL AND 
                         json_array_length(json_extract(data, '$.properties')) > 0 AND
                         EXISTS (SELECT 1 FROM json_each(json_extract(data, '$.properties')) WHERE value = 'thrown')
                    THEN 'Wurfwaffen'
                    WHEN category LIKE '%melee%'
                    THEN 'Nahkampfwaffen'
                    ELSE 'Nahkampfwaffen'
                END
                WHERE weapon_subtype IS NULL OR weapon_subtype = ''",
                table
            ),
            []
        ).map_err(|e| format!("Konnte weapon_subtype nicht aktualisieren: {}", e))?;
        
        Ok(())
    };
    
    update_weapon_subtype("core_weapons")?;
    update_weapon_subtype("custom_weapons")?;
    
    Ok(())
}
