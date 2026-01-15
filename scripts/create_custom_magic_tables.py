#!/usr/bin/env python3
"""
Erstellt Custom-Varianten für magische Items (analog zu custom_weapons, custom_armors).

Dieses Script:
1. Erstellt custom_mag_items_base
2. Erstellt alle Kategorie-spezifischen Custom-Tabellen
3. Erstellt Views für einheitliche Abfragen
4. Fügt Foreign Keys und Indizes hinzu
"""
import sqlite3
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
DB_PATH = PROJECT_ROOT / "dnd-nexus.db"


def create_custom_tables(conn: sqlite3.Connection):
    """Erstellt alle Custom-Varianten für magische Items."""
    conn.executescript("""
        -- Custom magische Items Basis
        CREATE TABLE IF NOT EXISTS custom_mag_items_base (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            rarity TEXT NOT NULL,
            category TEXT NOT NULL,
            source_book TEXT,
            source_page INTEGER,
            requires_attunement BOOLEAN NOT NULL DEFAULT 0,
            facts_json TEXT NOT NULL,
            parent_id TEXT,
            is_homebrew BOOLEAN DEFAULT 1,
            created_at INTEGER DEFAULT (unixepoch()),
            updated_at INTEGER DEFAULT (unixepoch()),
            FOREIGN KEY (parent_id) REFERENCES core_mag_items_base(id) ON DELETE CASCADE
        );

        -- Custom magische Waffen
        CREATE TABLE IF NOT EXISTS custom_mag_weapons (
            item_base_id TEXT PRIMARY KEY,
            weapon_type TEXT,
            attack_bonus INTEGER,
            damage_bonus INTEGER,
            FOREIGN KEY (item_base_id) REFERENCES custom_mag_items_base(id) ON DELETE CASCADE
        );

        -- Custom magische Rüstungen
        CREATE TABLE IF NOT EXISTS custom_mag_armor (
            item_base_id TEXT PRIMARY KEY,
            armor_type TEXT,
            ac_bonus INTEGER,
            FOREIGN KEY (item_base_id) REFERENCES custom_mag_items_base(id) ON DELETE CASCADE
        );

        -- Custom magische Consumables
        CREATE TABLE IF NOT EXISTS custom_mag_consumables (
            item_base_id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            FOREIGN KEY (item_base_id) REFERENCES custom_mag_items_base(id) ON DELETE CASCADE
        );

        -- Custom magische Focus Items
        CREATE TABLE IF NOT EXISTS custom_mag_focus_items (
            item_base_id TEXT PRIMARY KEY,
            focus_type TEXT NOT NULL,
            charges_max INTEGER,
            recharge TEXT,
            FOREIGN KEY (item_base_id) REFERENCES custom_mag_items_base(id) ON DELETE CASCADE
        );

        -- Custom magische Jewelry
        CREATE TABLE IF NOT EXISTS custom_mag_jewelry (
            item_base_id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            FOREIGN KEY (item_base_id) REFERENCES custom_mag_items_base(id) ON DELETE CASCADE
        );

        -- Custom magische Wondrous Items
        CREATE TABLE IF NOT EXISTS custom_mag_wondrous (
            item_base_id TEXT PRIMARY KEY,
            FOREIGN KEY (item_base_id) REFERENCES custom_mag_items_base(id) ON DELETE CASCADE
        );

        -- Custom magische Item Crafting
        CREATE TABLE IF NOT EXISTS custom_mag_item_crafting (
            item_base_id TEXT NOT NULL,
            tool_id TEXT NOT NULL,
            source_table TEXT NOT NULL CHECK(source_table IN ('core_tools', 'custom_tools')),
            PRIMARY KEY (item_base_id, tool_id, source_table),
            FOREIGN KEY (item_base_id) REFERENCES custom_mag_items_base(id) ON DELETE CASCADE
        );

        -- Indizes
        CREATE INDEX IF NOT EXISTS idx_custom_mag_items_name ON custom_mag_items_base(name);
        CREATE INDEX IF NOT EXISTS idx_custom_mag_items_category ON custom_mag_items_base(category);
        CREATE INDEX IF NOT EXISTS idx_custom_mag_items_rarity ON custom_mag_items_base(rarity);
        CREATE INDEX IF NOT EXISTS idx_custom_mag_items_parent ON custom_mag_items_base(parent_id);
        CREATE INDEX IF NOT EXISTS idx_custom_mag_crafting_item ON custom_mag_item_crafting(item_base_id);
        CREATE INDEX IF NOT EXISTS idx_custom_mag_crafting_tool ON custom_mag_item_crafting(tool_id);
    """)


def create_views(conn: sqlite3.Connection):
    """Erstellt Views für einheitliche Abfragen (analog zu all_weapons, all_armors)."""
    conn.executescript("""
        -- View: all_mag_items_base (vereinigt core und custom)
        DROP VIEW IF EXISTS all_mag_items_base;
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
            requires_attunement, facts_json, created_at,
            CASE WHEN is_homebrew = 1 THEN 'homebrew' ELSE 'core' END as source 
        FROM custom_mag_items_base 
        WHERE parent_id IS NULL;

        -- View: all_mag_weapons (vereinigt core und custom)
        DROP VIEW IF EXISTS all_mag_weapons;
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

        -- View: all_mag_armor (vereinigt core und custom)
        DROP VIEW IF EXISTS all_mag_armor;
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
    """)


def main():
    """Hauptfunktion."""
    if not DB_PATH.exists():
        print(f"❌ Fehler: {DB_PATH} nicht gefunden")
        return
    
    print(f"📖 Öffne Datenbank: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    
    try:
        print("🏗️  Erstelle Custom-Tabellen für magische Items...")
        create_custom_tables(conn)
        
        print("🔄 Erstelle Views...")
        create_views(conn)
        
        conn.commit()
        print("\n✅ Custom-Varianten erfolgreich erstellt!")
        print("\n📊 Erstellte Tabellen:")
        print("   - custom_mag_items_base")
        print("   - custom_mag_weapons")
        print("   - custom_mag_armor")
        print("   - custom_mag_consumables")
        print("   - custom_mag_focus_items")
        print("   - custom_mag_jewelry")
        print("   - custom_mag_wondrous")
        print("   - custom_mag_item_crafting")
        print("\n📊 Erstellte Views:")
        print("   - all_mag_items_base")
        print("   - all_mag_weapons")
        print("   - all_mag_armor")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Fehler: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        conn.close()


if __name__ == '__main__':
    main()
