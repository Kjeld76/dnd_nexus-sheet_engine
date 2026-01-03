use rusqlite::Connection;

pub fn run_migrations(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        "BEGIN;
        
        -- Core Spells
        CREATE TABLE IF NOT EXISTS core_spells (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            level INTEGER NOT NULL,
            school TEXT NOT NULL,
            data TEXT NOT NULL, -- JSON
            created_at INTEGER DEFAULT (unixepoch())
        );

        -- Custom Spells (Overrides and Homebrew)
        CREATE TABLE IF NOT EXISTS custom_spells (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            level INTEGER NOT NULL,
            school TEXT NOT NULL,
            data TEXT NOT NULL, -- JSON
            parent_id TEXT, -- References core_spells.id if it's an override
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

        -- Items
        CREATE TABLE IF NOT EXISTS core_items (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            data TEXT NOT NULL,
            created_at INTEGER DEFAULT (unixepoch())
        );

        CREATE TABLE IF NOT EXISTS custom_items (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            data TEXT NOT NULL,
            parent_id TEXT,
            is_homebrew BOOLEAN DEFAULT 1,
            created_at INTEGER DEFAULT (unixepoch()),
            updated_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (parent_id) REFERENCES core_items(id)
        );

        -- Feats
        CREATE TABLE IF NOT EXISTS core_feats (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            data TEXT NOT NULL,
            created_at INTEGER DEFAULT (unixepoch())
        );

        CREATE TABLE IF NOT EXISTS custom_feats (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            data TEXT NOT NULL,
            parent_id TEXT,
            is_homebrew BOOLEAN DEFAULT 1,
            created_at INTEGER DEFAULT (unixepoch()),
            updated_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (parent_id) REFERENCES core_feats(id)
        );

        -- Characters
        CREATE TABLE IF NOT EXISTS characters (
            id TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            created_at INTEGER DEFAULT (unixepoch()),
            updated_at INTEGER DEFAULT (unixepoch())
        );

        -- Settings
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        -- Indexes
        CREATE INDEX IF NOT EXISTS idx_core_spells_level ON core_spells(level);
        CREATE INDEX IF NOT EXISTS idx_core_spells_name ON core_spells(name COLLATE NOCASE);
        CREATE INDEX IF NOT EXISTS idx_custom_spells_parent ON custom_spells(parent_id);
        
        -- Views for combining core + custom with override logic
        CREATE VIEW IF NOT EXISTS all_spells AS
        SELECT 
            COALESCE(c.id, core.id) as id,
            COALESCE(c.name, core.name) as name,
            COALESCE(c.level, core.level) as level,
            COALESCE(c.school, core.school) as school,
            COALESCE(c.data, core.data) as data,
            CASE 
                WHEN c.parent_id IS NOT NULL THEN 'override'
                WHEN c.is_homebrew = 1 THEN 'homebrew'
                ELSE 'core'
            END as source
        FROM core_spells core
        LEFT JOIN custom_spells c ON c.parent_id = core.id
        UNION
        SELECT id, name, level, school, data, 'homebrew' as source
        FROM custom_spells
        WHERE parent_id IS NULL;

        CREATE VIEW IF NOT EXISTS all_species AS
        SELECT 
            COALESCE(c.id, core.id) as id,
            COALESCE(c.name, core.name) as name,
            COALESCE(c.data, core.data) as data,
            CASE 
                WHEN c.parent_id IS NOT NULL THEN 'override'
                WHEN c.is_homebrew = 1 THEN 'homebrew'
                ELSE 'core'
            END as source
        FROM core_species core
        LEFT JOIN custom_species c ON c.parent_id = core.id
        UNION
        SELECT id, name, data, 'homebrew' as source
        FROM custom_species
        WHERE parent_id IS NULL;

        CREATE VIEW IF NOT EXISTS all_classes AS
        SELECT 
            COALESCE(c.id, core.id) as id,
            COALESCE(c.name, core.name) as name,
            COALESCE(c.data, core.data) as data,
            CASE 
                WHEN c.parent_id IS NOT NULL THEN 'override'
                WHEN c.is_homebrew = 1 THEN 'homebrew'
                ELSE 'core'
            END as source
        FROM core_classes core
        LEFT JOIN custom_classes c ON c.parent_id = core.id
        UNION
        SELECT id, name, data, 'homebrew' as source
        FROM custom_classes
        WHERE parent_id IS NULL;

        CREATE VIEW IF NOT EXISTS all_items AS
        SELECT 
            COALESCE(c.id, core.id) as id,
            COALESCE(c.name, core.name) as name,
            COALESCE(c.category, core.category) as category,
            COALESCE(c.data, core.data) as data,
            CASE 
                WHEN c.parent_id IS NOT NULL THEN 'override'
                WHEN c.is_homebrew = 1 THEN 'homebrew'
                ELSE 'core'
            END as source
        FROM core_items core
        LEFT JOIN custom_items c ON c.parent_id = core.id
        UNION
        SELECT id, name, category, data, 'homebrew' as source
        FROM custom_items
        WHERE parent_id IS NULL;

        CREATE VIEW IF NOT EXISTS all_feats AS
        SELECT 
            COALESCE(c.id, core.id) as id,
            COALESCE(c.name, core.name) as name,
            COALESCE(c.data, core.data) as data,
            CASE 
                WHEN c.parent_id IS NOT NULL THEN 'override'
                WHEN c.is_homebrew = 1 THEN 'homebrew'
                ELSE 'core'
            END as source
        FROM core_feats core
        LEFT JOIN custom_feats c ON c.parent_id = core.id
        UNION
        SELECT id, name, data, 'homebrew' as source
        FROM custom_feats
        WHERE parent_id IS NULL;

        COMMIT;"
    ).map_err(|e| format!("Migration error: {}", e))
}

