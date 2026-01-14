#!/bin/bash
# Script to read logs from the app data directory

APP_DATA_DIR="$HOME/.local/share/com.dndnexus.app"
LOG_FILE="$APP_DATA_DIR/dnd-nexus.log"

if [ -f "$LOG_FILE" ]; then
    echo "=== D&D Nexus Logs ==="
    echo ""
    cat "$LOG_FILE"
else
    echo "No log file found at: $LOG_FILE"
    echo "Make sure the app is running and has generated logs."
    echo ""
    echo "Available files in app data directory:"
    ls -la "$APP_DATA_DIR" 2>/dev/null || echo "App data directory not found"
fi
