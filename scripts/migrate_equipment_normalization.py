#!/usr/bin/env python3
"""
Migriert core_equipment und custom_equipment von JSON-Arrays zu normalisierten Tabellen.

Dieses Script:
1. Erstellt die neuen normalisierten Tabellen
2. Migriert bestehende JSON-Daten
3. Erstellt die aktualisierte View
4. Validiert die Migration
"""
import sqlite3
import json
from pathlib import Path
from datetime import datetime

PROJECT_ROOT = Path(__file__).parent.parent
DB_PATH = PROJECT_ROOT / "dnd-nexus.db"


def create_tables(conn: sqlite3.Connection):
    """Erstellt die neuen normalisierten Tabellen."""
    conn.executescript("""
        -- Equipment-Item-Relationen
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

        -- Equipment-Tool-Relationen
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

        -- Indizes
        CREATE INDEX IF NOT EXISTS idx_equipment_items_equipment ON core_equipment_items(equipment_id);
        CREATE INDEX IF NOT EXISTS idx_equipment_items_item ON core_equipment_items(item_id);
        CREATE INDEX IF NOT EXISTS idx_equipment_tools_equipment ON core_equipment_tools(equipment_id);
        CREATE INDEX IF NOT EXISTS idx_equipment_tools_tool ON core_equipment_tools(tool_id);
        
        CREATE INDEX IF NOT EXISTS idx_custom_equipment_items_equipment ON custom_equipment_items(equipment_id);
        CREATE INDEX IF NOT EXISTS idx_custom_equipment_items_item ON custom_equipment_items(item_id);
        CREATE INDEX IF NOT EXISTS idx_custom_equipment_tools_equipment ON custom_equipment_tools(equipment_id);
        CREATE INDEX IF NOT EXISTS idx_custom_equipment_tools_tool ON custom_equipment_tools(tool_id);
    """)


def migrate_table(conn: sqlite3.Connection, table_name: str, is_custom: bool = False):
    """Migriert eine Equipment-Tabelle von JSON zu normalisierten Tabellen."""
    items_table = f"{'custom_' if is_custom else 'core_'}equipment_items"
    tools_table = f"{'custom_' if is_custom else 'core_'}equipment_tools"
    
    cursor = conn.execute(f"SELECT id, items, tools FROM {table_name}")
    migrated_items = 0
    migrated_tools = 0
    errors = []
    
    for row in cursor:
        eq_id, items_str, tools_str = row
        
        # Migriere Items
        if items_str and items_str.strip() and items_str != '[]':
            try:
                items = json.loads(items_str)
                if isinstance(items, list):
                    for item in items:
                        item_id = item.get('item_id') or item.get('id')
                        quantity = item.get('quantity', 1)
                        if item_id:
                            try:
                                conn.execute(f"""
                                    INSERT OR IGNORE INTO {items_table} 
                                    (equipment_id, item_id, quantity)
                                    VALUES (?, ?, ?)
                                """, (eq_id, item_id, quantity))
                                migrated_items += 1
                            except sqlite3.IntegrityError as e:
                                errors.append(f"{eq_id}: Item {item_id} - {e}")
            except json.JSONDecodeError as e:
                errors.append(f"{eq_id}: JSON-Parse-Fehler (items) - {e}")
        
        # Migriere Tools
        if tools_str and tools_str.strip() and tools_str != '[]':
            try:
                tools = json.loads(tools_str)
                if isinstance(tools, list):
                    for tool in tools:
                        tool_id = tool.get('tool_id') or tool.get('id')
                        quantity = tool.get('quantity', 1)
                        source_table = tool.get('source_table', 'core_tools')
                        if tool_id:
                            try:
                                conn.execute(f"""
                                    INSERT OR IGNORE INTO {tools_table} 
                                    (equipment_id, tool_id, quantity, source_table)
                                    VALUES (?, ?, ?, ?)
                                """, (eq_id, tool_id, quantity, source_table))
                                migrated_tools += 1
                            except sqlite3.IntegrityError as e:
                                errors.append(f"{eq_id}: Tool {tool_id} - {e}")
            except json.JSONDecodeError as e:
                errors.append(f"{eq_id}: JSON-Parse-Fehler (tools) - {e}")
    
    return migrated_items, migrated_tools, errors


def update_view(conn: sqlite3.Connection):
    """Aktualisiert die all_equipment View (ohne items/tools Spalten)."""
    conn.execute("DROP VIEW IF EXISTS all_equipment")
    conn.execute("""
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
        WHERE parent_id IS NULL
    """)


def validate_migration(conn: sqlite3.Connection):
    """Validiert die Migration durch Vergleich."""
    print("\n🔍 Validierung:")
    
    # Prüfe core_equipment
    cursor = conn.execute("SELECT COUNT(*) FROM core_equipment WHERE items IS NOT NULL AND items != '[]'")
    json_items_count = cursor.fetchone()[0]
    
    cursor = conn.execute("SELECT COUNT(*) FROM core_equipment_items")
    normalized_items_count = cursor.fetchone()[0]
    
    print(f"  core_equipment Items: JSON={json_items_count}, Normalisiert={normalized_items_count}")
    
    cursor = conn.execute("SELECT COUNT(*) FROM core_equipment WHERE tools IS NOT NULL AND tools != '[]'")
    json_tools_count = cursor.fetchone()[0]
    
    cursor = conn.execute("SELECT COUNT(*) FROM core_equipment_tools")
    normalized_tools_count = cursor.fetchone()[0]
    
    print(f"  core_equipment Tools: JSON={json_tools_count}, Normalisiert={normalized_tools_count}")
    
    # Prüfe custom_equipment
    cursor = conn.execute("SELECT COUNT(*) FROM custom_equipment WHERE items IS NOT NULL AND items != '[]'")
    json_items_count = cursor.fetchone()[0]
    
    cursor = conn.execute("SELECT COUNT(*) FROM custom_equipment_items")
    normalized_items_count = cursor.fetchone()[0]
    
    print(f"  custom_equipment Items: JSON={json_items_count}, Normalisiert={normalized_items_count}")
    
    cursor = conn.execute("SELECT COUNT(*) FROM custom_equipment WHERE tools IS NOT NULL AND tools != '[]'")
    json_tools_count = cursor.fetchone()[0]
    
    cursor = conn.execute("SELECT COUNT(*) FROM custom_equipment_tools")
    normalized_tools_count = cursor.fetchone()[0]
    
    print(f"  custom_equipment Tools: JSON={json_tools_count}, Normalisiert={normalized_tools_count}")


def main():
    """Hauptfunktion."""
    if not DB_PATH.exists():
        print(f"❌ Fehler: {DB_PATH} nicht gefunden")
        return
    
    print(f"📖 Öffne Datenbank: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    
    try:
        print("🏗️  Erstelle neue Tabellen...")
        create_tables(conn)
        
        print("📥 Migriere core_equipment...")
        items, tools, errors = migrate_table(conn, "core_equipment", False)
        print(f"   Items: {items}, Tools: {tools}")
        if errors:
            print(f"   ⚠️  {len(errors)} Fehler (erste 5):")
            for err in errors[:5]:
                print(f"      - {err}")
        
        print("📥 Migriere custom_equipment...")
        items, tools, errors = migrate_table(conn, "custom_equipment", True)
        print(f"   Items: {items}, Tools: {tools}")
        if errors:
            print(f"   ⚠️  {len(errors)} Fehler (erste 5):")
            for err in errors[:5]:
                print(f"      - {err}")
        
        print("🔄 Aktualisiere View...")
        update_view(conn)
        
        print("✅ Validierung...")
        validate_migration(conn)
        
        conn.commit()
        print("\n✅ Migration erfolgreich abgeschlossen!")
        print("\n⚠️  Nächste Schritte:")
        print("   1. Update Backend-Command get_all_equipment() in src-tauri/src/commands/compendium.rs")
        print("   2. Teste Frontend")
        print("   3. Optional: Entferne JSON-Spalten (nur nach erfolgreichem Test)")
        
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
