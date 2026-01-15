#!/usr/bin/env python3
"""
Import-Skript für magische Gegenstände aus exports/items.json in SQLite-Datenbank.

Dieses Skript:
- Erstellt die notwendigen Tabellen für magische Gegenstände (core_mag_*)
- Importiert die JSON-Daten aus exports/items.json
- Führt Tool-Matching durch (core_tools -> custom_tools)
- Extrahiert Boni und Ladungen aus dem facts-Objekt
"""

import json
import sqlite3
import sys
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple
import re

# Pfade
PROJECT_ROOT = Path(__file__).parent.parent
DB_PATH = PROJECT_ROOT / "dnd-nexus.db"
JSON_PATH = PROJECT_ROOT / "exports" / "items.json"


def normalize_id(name: str) -> str:
    """Konvertiert einen Namen in eine normalisierte ID (lowercase, Sonderzeichen entfernt)."""
    # Entferne Sonderzeichen, ersetze Leerzeichen mit Unterstrichen
    normalized = re.sub(r'[^\w\s-]', '', name.lower())
    normalized = re.sub(r'[-\s]+', '_', normalized)
    return normalized.strip('_')


def create_tables(conn: sqlite3.Connection) -> None:
    """Erstellt die Tabellen für magische Gegenstände, falls sie nicht existieren."""
    conn.execute("""
        CREATE TABLE IF NOT EXISTS core_mag_items_base (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            rarity TEXT NOT NULL,
            category TEXT NOT NULL,
            source_book TEXT,
            source_page INTEGER,
            requires_attunement BOOLEAN NOT NULL DEFAULT 0,
            facts_json TEXT NOT NULL,
            created_at INTEGER DEFAULT (unixepoch())
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS core_mag_armor (
            item_base_id TEXT PRIMARY KEY,
            armor_type TEXT,
            ac_bonus INTEGER,
            FOREIGN KEY (item_base_id) REFERENCES core_mag_items_base(id) ON DELETE CASCADE
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS core_mag_weapons (
            item_base_id TEXT PRIMARY KEY,
            weapon_type TEXT,
            attack_bonus INTEGER,
            damage_bonus INTEGER,
            FOREIGN KEY (item_base_id) REFERENCES core_mag_items_base(id) ON DELETE CASCADE
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS core_mag_consumables (
            item_base_id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            FOREIGN KEY (item_base_id) REFERENCES core_mag_items_base(id) ON DELETE CASCADE
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS core_mag_focus_items (
            item_base_id TEXT PRIMARY KEY,
            focus_type TEXT NOT NULL,
            charges_max INTEGER,
            recharge TEXT,
            FOREIGN KEY (item_base_id) REFERENCES core_mag_items_base(id) ON DELETE CASCADE
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS core_mag_jewelry (
            item_base_id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            FOREIGN KEY (item_base_id) REFERENCES core_mag_items_base(id) ON DELETE CASCADE
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS core_mag_wondrous (
            item_base_id TEXT PRIMARY KEY,
            FOREIGN KEY (item_base_id) REFERENCES core_mag_items_base(id) ON DELETE CASCADE
        )
    """)
    
    conn.execute("""
        CREATE TABLE IF NOT EXISTS core_mag_item_crafting (
            item_base_id TEXT NOT NULL,
            tool_id TEXT NOT NULL,
            source_table TEXT NOT NULL CHECK(source_table IN ('core_tools', 'custom_tools')),
            PRIMARY KEY (item_base_id, tool_id, source_table),
            FOREIGN KEY (item_base_id) REFERENCES core_mag_items_base(id) ON DELETE CASCADE
        )
    """)
    
    # Indizes für Performance
    conn.execute("CREATE INDEX IF NOT EXISTS idx_mag_items_category ON core_mag_items_base(category)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_mag_items_rarity ON core_mag_items_base(rarity)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_mag_crafting_item ON core_mag_item_crafting(item_base_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_mag_crafting_tool ON core_mag_item_crafting(tool_id)")
    
    conn.commit()


def find_tool_id(conn: sqlite3.Connection, tool_name: str) -> Optional[Tuple[str, str]]:
    """
    Sucht ein Werkzeug zuerst in core_tools, dann in custom_tools.
    
    Returns:
        Tuple (tool_id, source_table) oder None wenn nicht gefunden
    """
    # Normalisiere den Tool-Namen für Suche
    normalized_search = normalize_id(tool_name)
    
    # Suche zuerst in core_tools (mehrere Strategien)
    # 1. Exakte ID-Match
    cursor = conn.execute("""
        SELECT id, name FROM core_tools 
        WHERE id = ?
        LIMIT 1
    """, (normalized_search,))
    row = cursor.fetchone()
    if row:
        return (row[0], 'core_tools')
    
    # 2. Normalisierter Name-Match
    cursor = conn.execute("""
        SELECT id, name FROM core_tools 
        WHERE LOWER(REPLACE(REPLACE(REPLACE(name, ' ', '_'), '-', '_'), 'ü', 'ue')) = ?
           OR LOWER(name) = LOWER(?)
        LIMIT 1
    """, (normalized_search, tool_name))
    row = cursor.fetchone()
    if row:
        return (row[0], 'core_tools')
    
    # 3. Fuzzy-Suche (enthält) - entferne "werkzeug" für bessere Matches
    tool_name_clean = tool_name.replace('werkzeug', '').replace('Werkzeug', '').strip()
    if tool_name_clean:
        cursor = conn.execute("""
            SELECT id, name FROM core_tools 
            WHERE LOWER(name) LIKE LOWER(?)
            LIMIT 1
        """, (f'%{tool_name_clean}%',))
        row = cursor.fetchone()
        if row:
            return (row[0], 'core_tools')
    
    # 4. Enthält-Suche mit Original-Name
    cursor = conn.execute("""
        SELECT id, name FROM core_tools 
        WHERE LOWER(name) LIKE LOWER(?)
        LIMIT 1
    """, (f'%{tool_name}%',))
    row = cursor.fetchone()
    if row:
        return (row[0], 'core_tools')
    
    # Gleiche Suche in custom_tools
    cursor = conn.execute("""
        SELECT id, name FROM custom_tools 
        WHERE id = ?
        LIMIT 1
    """, (normalized_search,))
    row = cursor.fetchone()
    if row:
        return (row[0], 'custom_tools')
    
    cursor = conn.execute("""
        SELECT id, name FROM custom_tools 
        WHERE LOWER(REPLACE(REPLACE(REPLACE(name, ' ', '_'), '-', '_'), 'ü', 'ue')) = ?
           OR LOWER(name) = LOWER(?)
        LIMIT 1
    """, (normalized_search, tool_name))
    row = cursor.fetchone()
    if row:
        return (row[0], 'custom_tools')
    
    # Gleiche Fuzzy-Suche in custom_tools
    if tool_name_clean:
        cursor = conn.execute("""
            SELECT id, name FROM custom_tools 
            WHERE LOWER(name) LIKE LOWER(?)
            LIMIT 1
        """, (f'%{tool_name_clean}%',))
        row = cursor.fetchone()
        if row:
            return (row[0], 'custom_tools')
    
    cursor = conn.execute("""
        SELECT id, name FROM custom_tools 
        WHERE LOWER(name) LIKE LOWER(?)
        LIMIT 1
    """, (f'%{tool_name}%',))
    row = cursor.fetchone()
    if row:
        return (row[0], 'custom_tools')
    
    return None


def extract_facts_json(item: Dict[str, Any]) -> str:
    """Extrahiert das facts-Objekt als JSON-String."""
    facts = item.get('magic', {}).get('facts', {})
    return json.dumps(facts, ensure_ascii=False)


def extract_bonuses(facts: Dict[str, Any]) -> Dict[str, Optional[int]]:
    """Extrahiert Boni aus dem facts-Objekt."""
    bonuses = facts.get('bonuses', {})
    return {
        'ac': bonuses.get('ac'),
        'attack_roll': bonuses.get('attack_roll'),
        'damage_roll': bonuses.get('damage_roll'),
        'save_dc': bonuses.get('save_dc'),
        'spell_attack': bonuses.get('spell_attack')
    }


def extract_charges(facts: Dict[str, Any]) -> Dict[str, Optional[Any]]:
    """Extrahiert Ladungsinformationen aus dem facts-Objekt."""
    charges = facts.get('charges', {})
    return {
        'max': charges.get('max'),
        'recharge': charges.get('recharge')
    }


def import_item(conn: sqlite3.Connection, item: Dict[str, Any]) -> None:
    """Importiert ein einzelnes Item in die Datenbank."""
    name = item['name']
    item_id = normalize_id(name)
    magic = item.get('magic', {})
    
    if not magic:
        print(f"⚠️  Überspringe {name}: Kein magic-Objekt vorhanden")
        return
    
    category = magic.get('category')
    rarity = magic.get('rarity') or 'unbekannt'  # Behandle null als 'unbekannt'
    requires_attunement = magic.get('requires_attunement', False)
    
    source = item.get('source', {})
    source_book = source.get('book')
    source_page = source.get('start_page_physical')
    
    facts_json = extract_facts_json(item)
    facts = magic.get('facts', {})
    
    # Füge Basis-Item ein
    conn.execute("""
        INSERT OR REPLACE INTO core_mag_items_base 
        (id, name, rarity, category, source_book, source_page, requires_attunement, facts_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (item_id, name, rarity, category, source_book, source_page, requires_attunement, facts_json))
    
    # Kategorie-spezifische Tabellen befüllen
    bonuses = extract_bonuses(facts)
    charges = extract_charges(facts)
    
    if category == 'Rüstung':
        conn.execute("""
            INSERT OR REPLACE INTO core_mag_armor 
            (item_base_id, armor_type, ac_bonus)
            VALUES (?, ?, ?)
        """, (item_id, None, bonuses['ac']))
    
    elif category == 'Waffe':
        conn.execute("""
            INSERT OR REPLACE INTO core_mag_weapons 
            (item_base_id, weapon_type, attack_bonus, damage_bonus)
            VALUES (?, ?, ?, ?)
        """, (item_id, None, bonuses['attack_roll'], bonuses['damage_roll']))
    
    elif category in ('Trank', 'Schriftrolle'):
        consumable_type = 'Trank' if category == 'Trank' else 'Schriftrolle'
        conn.execute("""
            INSERT OR REPLACE INTO core_mag_consumables 
            (item_base_id, type)
            VALUES (?, ?)
        """, (item_id, consumable_type))
    
    elif category in ('Stab', 'Zepter'):
        focus_type = 'Stab' if category == 'Stab' else 'Zepter'
        conn.execute("""
            INSERT OR REPLACE INTO core_mag_focus_items 
            (item_base_id, focus_type, charges_max, recharge)
            VALUES (?, ?, ?, ?)
        """, (item_id, focus_type, charges['max'], charges['recharge']))
    
    elif category == 'Ring':
        conn.execute("""
            INSERT OR REPLACE INTO core_mag_jewelry 
            (item_base_id, type)
            VALUES (?, ?)
        """, (item_id, 'Ring'))
    
    elif category == 'Wundersamer Gegenstand':
        conn.execute("""
            INSERT OR REPLACE INTO core_mag_wondrous 
            (item_base_id)
            VALUES (?)
        """, (item_id,))
    
    # Tool-Matching und Crafting-Relationen
    crafting = magic.get('crafting', {})
    tools = crafting.get('tools', [])
    
    for tool_name in tools:
        tool_match = find_tool_id(conn, tool_name)
        if tool_match:
            tool_id, source_table = tool_match
            conn.execute("""
                INSERT OR IGNORE INTO core_mag_item_crafting 
                (item_base_id, tool_id, source_table)
                VALUES (?, ?, ?)
            """, (item_id, tool_id, source_table))
        else:
            print(f"⚠️  Tool '{tool_name}' für Item '{name}' nicht gefunden in core_tools oder custom_tools")


def main():
    """Hauptfunktion: Liest JSON und importiert in Datenbank."""
    if not JSON_PATH.exists():
        print(f"❌ Fehler: {JSON_PATH} nicht gefunden")
        sys.exit(1)
    
    if not DB_PATH.exists():
        print(f"❌ Fehler: {DB_PATH} nicht gefunden")
        sys.exit(1)
    
    print(f"📖 Lese JSON-Daten aus {JSON_PATH}...")
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        items = json.load(f)
    
    print(f"📊 Gefunden: {len(items)} Items")
    
    print(f"🔌 Verbinde mit Datenbank {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    
    try:
        print("🏗️  Erstelle Tabellen...")
        create_tables(conn)
        
        print("📥 Importiere Items...")
        imported = 0
        skipped = 0
        
        for item in items:
            try:
                import_item(conn, item)
                imported += 1
            except Exception as e:
                print(f"❌ Fehler beim Import von '{item.get('name', 'UNBEKANNT')}': {e}")
                skipped += 1
        
        conn.commit()
        
        print(f"\n✅ Import abgeschlossen!")
        print(f"   Importiert: {imported}")
        print(f"   Übersprungen: {skipped}")
        
        # Statistiken
        cursor = conn.execute("SELECT COUNT(*) FROM core_mag_items_base")
        total = cursor.fetchone()[0]
        print(f"   Gesamt in DB: {total}")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Fehler: {e}")
        sys.exit(1)
    finally:
        conn.close()


if __name__ == '__main__':
    main()
