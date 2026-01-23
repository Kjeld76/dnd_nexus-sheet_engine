#!/bin/bash
# D&D Nexus - Swarm Synchronization Script

TASK_NAME=$1
CATEGORY=$2 # Added, Fixed, Changed
CHECKLIST_ITEM=$3

echo "🔄 Synchronisiere Schwarm-Ergebnisse..."

# 1. Update CHANGELOG.md
DATE=$(date +%Y-%m-%d)
# Suche die Zeile unter [Unreleased] und füge den Task ein
sed -i "/## \[Unreleased\]/a ### $CATEGORY\n- **Autonom:** $TASK_NAME (via Swarm Agent)" CHANGELOG.md

# 2. Update CHECKLIST.md
if [ ! -z "$CHECKLIST_ITEM" ]; then
    # Ersetzt [ ] durch [x] für den spezifischen Text
    sed -i "s/\[ \] \(.*$CHECKLIST_ITEM.*\)/\[x\] \1/" CHECKLIST.md
fi

# 3. Log in Swarm Context
echo "- [$(date +'%Y-%m-%d %H:%M')] Task completed: $TASK_NAME" >> .antigravity/swarm_context.md

echo "✅ Dokumentation aktualisiert."
