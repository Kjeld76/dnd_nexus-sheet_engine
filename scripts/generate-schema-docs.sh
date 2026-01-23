#!/bin/bash
# scripts/generate-schema-docs.sh

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( dirname "$SCRIPT_DIR" )"
DB_PATH="$PROJECT_ROOT/dnd-nexus.db"
OUTPUT_PATH="$PROJECT_ROOT/docs/schema-current.md"

if [ ! -f "$DB_PATH" ]; then
    echo "Error: Database not found at $DB_PATH"
    exit 1
fi

echo "Generating schema documentation from $DB_PATH..."

sqlite3 "$DB_PATH" <<EOF > "$OUTPUT_PATH"
.mode markdown
.headers on

SELECT '# Database Schema Overview' as title;
SELECT '';
SELECT 'Generated at: ' || datetime('now');
SELECT '';

SELECT '## Tables' as section;
SELECT '';
SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;
SELECT '';

SELECT '## Views' as section;
SELECT '';
SELECT name, sql FROM sqlite_master WHERE type='view' ORDER BY name;
SELECT '';

SELECT '## Indexes' as section;
SELECT '';
SELECT name, tbl_name, sql FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%' ORDER BY tbl_name, name;
EOF

echo "Documentation generated at $OUTPUT_PATH"
