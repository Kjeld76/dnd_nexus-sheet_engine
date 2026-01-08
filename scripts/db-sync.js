#!/usr/bin/env node

import { existsSync, copyFileSync } from 'fs';
import { join } from 'path';

const args = process.argv.slice(2);
const command = args[0];

const rootDb = 'dnd-nexus.db';
const syncDb = 'sync.db';

if (command === 'push') {
  if (!existsSync(rootDb)) {
    console.error(`❌ Fehler: ${rootDb} nicht gefunden!`);
    console.error(`   Stelle sicher, dass die Datenbank im Projektverzeichnis existiert.`);
    process.exit(1);
  }
  
  try {
    copyFileSync(rootDb, syncDb);
    console.log(`✅ ${rootDb} → ${syncDb} kopiert`);
    console.log(`   Führe jetzt aus: git add sync.db && git commit -m "Update sync database" && git push`);
  } catch (error) {
    console.error(`❌ Fehler beim Kopieren: ${error.message}`);
    process.exit(1);
  }
} else if (command === 'pull') {
  if (!existsSync(syncDb)) {
    console.error(`❌ Fehler: ${syncDb} nicht gefunden!`);
    console.error(`   Führe zuerst aus: git pull`);
    console.error(`   Wenn die Datei nach git pull immer noch fehlt, prüfe ob sie in Git getrackt wird:`);
    console.error(`   git ls-files sync.db`);
    process.exit(1);
  }
  
  try {
    copyFileSync(syncDb, rootDb);
    console.log(`✅ ${syncDb} → ${rootDb} kopiert`);
    console.log(`   Die Datenbank wurde erfolgreich synchronisiert.`);
  } catch (error) {
    console.error(`❌ Fehler beim Kopieren: ${error.message}`);
    process.exit(1);
  }
} else {
  console.error(`❌ Unbekannter Befehl: ${command}`);
  console.error(`   Verwendung: node scripts/db-sync.js [push|pull]`);
  process.exit(1);
}
