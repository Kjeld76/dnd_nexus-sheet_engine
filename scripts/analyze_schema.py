#!/usr/bin/env python3
"""
SQLite Schema Analysis Script
Analysiert dnd-nexus.db und extrahiert Schema-Informationen für den Optimierungs-Report.
"""

import sqlite3
import json
import sys
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "dnd-nexus.db"

def get_all_tables(conn):
    """Holt alle Tabellennamen."""
    cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    return [row[0] for row in cursor.fetchall()]

def get_table_info(conn, table_name):
    """Holt PRAGMA table_info für eine Tabelle."""
    cursor = conn.execute(f"PRAGMA table_info({table_name})")
    columns = []
    for row in cursor.fetchall():
        columns.append({
            'cid': row[0],
            'name': row[1],
            'type': row[2],
            'notnull': bool(row[3]),
            'default_value': row[4],
            'pk': bool(row[5])
        })
    return columns

def get_foreign_keys(conn, table_name):
    """Holt PRAGMA foreign_key_list für eine Tabelle."""
    cursor = conn.execute(f"PRAGMA foreign_key_list({table_name})")
    fks = []
    for row in cursor.fetchall():
        fks.append({
            'id': row[0],
            'seq': row[1],
            'table': row[2],
            'from': row[3],
            'to': row[4],
            'on_update': row[5],
            'on_delete': row[6],
            'match': row[7]
        })
    return fks

def get_indexes(conn, table_name):
    """Holt PRAGMA index_list für eine Tabelle."""
    cursor = conn.execute(f"PRAGMA index_list({table_name})")
    indexes = []
    for row in cursor.fetchall():
        idx_name = row[1]
        unique = bool(row[2])
        origin = row[3]
        partial = bool(row[4])
        
        # Hole Index-Details
        cursor_idx = conn.execute(f"PRAGMA index_info({idx_name})")
        columns = []
        for idx_row in cursor_idx.fetchall():
            columns.append({
                'seqno': idx_row[0],
                'cid': idx_row[1],
                'name': idx_row[2]
            })
        
        indexes.append({
            'name': idx_name,
            'unique': unique,
            'origin': origin,
            'partial': partial,
            'columns': columns
        })
    return indexes

def get_create_statement(conn, name, obj_type):
    """Holt CREATE-Statement für Tabelle/Index/View."""
    cursor = conn.execute(
        "SELECT sql FROM sqlite_master WHERE type=? AND name=?",
        (obj_type, name)
    )
    row = cursor.fetchone()
    return row[0] if row else None

def get_all_views(conn):
    """Holt alle View-Namen."""
    cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='view' ORDER BY name")
    return [row[0] for row in cursor.fetchall()]

def get_all_triggers(conn):
    """Holt alle Trigger-Namen."""
    cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='trigger' ORDER BY name")
    return [row[0] for row in cursor.fetchall()]

def analyze_schema():
    """Hauptfunktion: Analysiert das Schema."""
    if not DB_PATH.exists():
        print(f"ERROR: Database not found at {DB_PATH}", file=sys.stderr)
        sys.exit(1)
    
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    
    schema_info = {
        'database_path': str(DB_PATH),
        'tables': {},
        'views': {},
        'triggers': {},
        'indexes_standalone': []
    }
    
    # Tabellen analysieren
    tables = get_all_tables(conn)
    print(f"Found {len(tables)} tables", file=sys.stderr)
    
    for table in tables:
        print(f"Analyzing table: {table}", file=sys.stderr)
        schema_info['tables'][table] = {
            'columns': get_table_info(conn, table),
            'foreign_keys': get_foreign_keys(conn, table),
            'indexes': get_indexes(conn, table),
            'create_statement': get_create_statement(conn, table, 'table')
        }
    
    # Views analysieren
    views = get_all_views(conn)
    print(f"Found {len(views)} views", file=sys.stderr)
    
    for view in views:
        schema_info['views'][view] = {
            'create_statement': get_create_statement(conn, view, 'view')
        }
    
    # Trigger analysieren
    triggers = get_all_triggers(conn)
    print(f"Found {len(triggers)} triggers", file=sys.stderr)
    
    for trigger in triggers:
        schema_info['triggers'][trigger] = {
            'create_statement': get_create_statement(conn, trigger, 'trigger')
        }
    
    # Standalone Indizes (nicht an Tabellen gebunden)
    cursor = conn.execute(
        "SELECT name, sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL"
    )
    for row in cursor.fetchall():
        if row[0] not in [idx['name'] for table_info in schema_info['tables'].values() for idx in table_info['indexes']]:
            schema_info['indexes_standalone'].append({
                'name': row[0],
                'create_statement': row[1]
            })
    
    conn.close()
    
    return schema_info

if __name__ == "__main__":
    try:
        schema = analyze_schema()
        print(json.dumps(schema, indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
