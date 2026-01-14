use rusqlite::Connection;

pub fn run_migrations(conn: &Connection) -> Result<(), String> {
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
            weapon_type TEXT,  -- DEPRECATED: Wird durch mastery_id ersetzt, bleibt für Rückwärtskompatibilität
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
            weapon_type TEXT,  -- DEPRECATED: Wird durch mastery_id ersetzt, bleibt für Rückwärtskompatibilität
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

        -- Armor Property Mappings (NEU - NOTWENDIG für magische Rüstungen)
        CREATE TABLE IF NOT EXISTS armor_property_mappings (
            armor_id TEXT NOT NULL,
            property_id TEXT NOT NULL,
            parameter_value TEXT,  -- JSON für komplexe Parameter (z.B. strength_requirement, ac_bonus, damage_type)
            
            PRIMARY KEY (armor_id, property_id),
            FOREIGN KEY (property_id) REFERENCES armor_properties(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_armor_property_armor ON armor_property_mappings(armor_id);
        CREATE INDEX IF NOT EXISTS idx_armor_property_property ON armor_property_mappings(property_id);

        -- Migration 005: Weapon Property Mappings
        -- Erstellt Mapping-Tabelle für Waffen ↔ Eigenschaften
        CREATE TABLE IF NOT EXISTS weapon_property_mappings (
            weapon_id TEXT NOT NULL,
            property_id TEXT NOT NULL,
            parameter_value TEXT,
            
            PRIMARY KEY (weapon_id, property_id),
            FOREIGN KEY (property_id) REFERENCES weapon_properties(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_weapon_property_weapon ON weapon_property_mappings(weapon_id);
        CREATE INDEX IF NOT EXISTS idx_weapon_property_property ON weapon_property_mappings(property_id);

        -- Trigger: Validiere weapon_id existiert in all_weapons_unified (wird nach View-Erstellung erstellt)

        CREATE TABLE IF NOT EXISTS characters (
            id TEXT PRIMARY KEY,
            data TEXT NOT NULL,
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
               COALESCE(cw.weapon_type, core.weapon_type) as weapon_type, COALESCE(cw.damage_dice, core.damage_dice) as damage_dice, 
               COALESCE(cw.damage_type, core.damage_type) as damage_type, COALESCE(cw.weight_kg, core.weight_kg) as weight_kg, 
               COALESCE(cw.cost_gp, core.cost_gp) as cost_gp, COALESCE(cw.data, core.data) as data, 
               CASE WHEN cw.parent_id IS NOT NULL THEN 'override' WHEN cw.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM core_weapons core LEFT JOIN custom_weapons cw ON cw.parent_id = core.id 
        UNION 
        SELECT id, name, category, weapon_type, damage_dice, damage_type, weight_kg, cost_gp, data, CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM custom_weapons WHERE parent_id IS NULL;

        CREATE VIEW all_weapons_unified AS 
        SELECT COALESCE(cw.id, core.id) as id, COALESCE(cw.name, core.name) as name, COALESCE(cw.category, core.category) as category, 
               COALESCE(cw.mastery_id, core.mastery_id) as mastery_id, COALESCE(cw.damage_dice, core.damage_dice) as damage_dice, 
               COALESCE(cw.damage_type, core.damage_type) as damage_type, COALESCE(cw.weight_kg, core.weight_kg) as weight_kg, 
               COALESCE(cw.cost_gp, core.cost_gp) as cost_gp, COALESCE(cw.data, core.data) as data, 
               CASE WHEN cw.parent_id IS NOT NULL THEN 'override' WHEN cw.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM core_weapons core LEFT JOIN custom_weapons cw ON cw.parent_id = core.id 
        UNION 
        SELECT id, name, category, mastery_id, damage_dice, damage_type, weight_kg, cost_gp, data, CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM custom_weapons WHERE parent_id IS NULL;

        CREATE VIEW all_armors AS 
        SELECT COALESCE(c.id, core.id) as id, COALESCE(c.name, core.name) as name, COALESCE(c.category, core.category) as category, 
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
        SELECT id, name, category, base_ac, ac_bonus, ac_formula, strength_requirement, stealth_disadvantage, 
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
        SELECT COALESCE(c.id, core.id) as id, COALESCE(c.name, core.name) as name, COALESCE(c.description, core.description) as description, 
               COALESCE(c.total_cost_gp, core.total_cost_gp) as total_cost_gp, COALESCE(c.total_weight_kg, core.total_weight_kg) as total_weight_kg, 
               COALESCE(c.items, core.items) as items, COALESCE(c.tools, core.tools) as tools, COALESCE(c.data, core.data) as data, 
               CASE WHEN c.parent_id IS NOT NULL THEN 'override' WHEN c.is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM core_equipment core LEFT JOIN custom_equipment c ON c.parent_id = core.id 
        UNION 
        SELECT id, name, description, total_cost_gp, total_weight_kg, items, tools, data, CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM custom_equipment WHERE parent_id IS NULL;

        -- Indizes für Performance (Checklist 6: < 10ms Lookups)
        CREATE INDEX IF NOT EXISTS idx_core_spells_name ON core_spells(name);
        CREATE INDEX IF NOT EXISTS idx_custom_spells_name ON custom_spells(name);
        CREATE INDEX IF NOT EXISTS idx_custom_spells_parent ON custom_spells(parent_id);
        
        CREATE INDEX IF NOT EXISTS idx_core_weapons_name ON core_weapons(name);
        CREATE INDEX IF NOT EXISTS idx_custom_weapons_name ON custom_weapons(name);
        
        CREATE INDEX IF NOT EXISTS idx_core_armors_name ON core_armors(name);
        CREATE INDEX IF NOT EXISTS idx_custom_armors_name ON custom_armors(name);

        CREATE INDEX IF NOT EXISTS idx_characters_updated ON characters(updated_at);

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

        -- Trigger: Validiere armor_id existiert in all_armors
        DROP TRIGGER IF EXISTS validate_armor_id;
        CREATE TRIGGER validate_armor_id
        BEFORE INSERT ON armor_property_mappings
        BEGIN
            SELECT CASE
                WHEN NOT EXISTS (SELECT 1 FROM all_armors WHERE id = NEW.armor_id)
                THEN RAISE(ABORT, 'armor_id must exist in all_armors (core_armors or custom_armors)')
            END;
        END;

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

        COMMIT;"
    ).map_err(|e| format!("Migration error: {}", e))
}
