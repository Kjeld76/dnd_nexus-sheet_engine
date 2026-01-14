import Database from 'better-sqlite3';
import fs from 'fs/promises';
import path from 'path';

interface BackgroundOption {
  label: string;
  items: string[] | null;
  gold: number | null;
}

interface ExtractedBackground {
  id: string;
  name: string;
  description: string;
  ability_scores?: string[];
  feat?: string;
  skills: string[];
  tool?: string;
  starting_equipment?: {
    options: BackgroundOption[];
  };
  feature?: {
    name: string;
    description: string;
  };
  data: any;
}

async function migrateBackgrounds() {
  const dbPath = path.resolve('dnd-nexus.db');
  const extractedPath = path.resolve('archive/tools/data_extraction/intermediate_data/extracted_backgrounds_complete.json');

  // Prüfe ob extrahierte Daten existieren
  if (!await fs.access(extractedPath).then(() => true).catch(() => false)) {
    console.error(`❌ Extrahierte Daten nicht gefunden: ${extractedPath}`);
    console.log('💡 Führe zuerst scripts/extract-backgrounds-complete.ts aus');
    return;
  }

  console.log('📖 Lade extrahierte Hintergrund-Daten...');
  const extractedData = JSON.parse(await fs.readFile(extractedPath, 'utf-8')) as ExtractedBackground[];
  console.log(`   ${extractedData.length} Hintergründe gefunden\n`);

  console.log('🔌 Verbinde mit Datenbank...');
  const db = new Database(dbPath);

  // Beginne Transaktion
  const transaction = db.transaction(() => {
    let updated = 0;
    let created = 0;
    const skipped = 0;

    for (const extracted of extractedData) {
      // Prüfe ob Hintergrund bereits existiert
      const existing = db.prepare('SELECT id, name, data FROM core_backgrounds WHERE id = ?').get(extracted.id) as {
        id: string;
        name: string;
        data: string;
      } | undefined;

      let currentData: any = {};
      if (existing) {
        try {
          currentData = JSON.parse(existing.data);
        } catch (e) {
          console.warn(`⚠️  Konnte Daten von ${extracted.name} nicht parsen, überschreibe`);
          currentData = {};
        }
      }

      // Merge: Behalte bestehende Daten, überschreibe mit neuen
      const mergedData: any = {
        ...currentData,
        description: extracted.description || currentData.description,
        ability_scores: extracted.ability_scores || currentData.ability_scores,
        feat: extracted.feat || currentData.feat,
        skills: extracted.skills || currentData.skills,
        tool: extracted.tool || currentData.tool,
      };

      // Startausrüstung: Überschreibe komplett, wenn vorhanden
      if (extracted.starting_equipment?.options && extracted.starting_equipment.options.length > 0) {
        mergedData.starting_equipment = extracted.starting_equipment;
        
        // Entferne Legacy-Felder (optional, als Fallback behalten)
        // delete mergedData.gold;
        // delete mergedData.equipment_id;
      } else if (currentData.starting_equipment) {
        // Behalte bestehende Startausrüstung, wenn keine neue vorhanden
        mergedData.starting_equipment = currentData.starting_equipment;
      }

      // Feature
      if (extracted.feature) {
        mergedData.feature = extracted.feature;
      } else if (currentData.feature) {
        mergedData.feature = currentData.feature;
      }

      // Zusätzliche Daten aus extracted.data
      if (extracted.data && typeof extracted.data === 'object') {
        Object.assign(mergedData, extracted.data);
      }

      const dataJson = JSON.stringify(mergedData);

      if (existing) {
        // Update
        db.prepare('UPDATE core_backgrounds SET name = ?, data = ? WHERE id = ?').run(
          extracted.name,
          dataJson,
          extracted.id
        );
        updated++;
        console.log(`✅ Aktualisiert: ${extracted.name}`);
      } else {
        // Insert
        db.prepare('INSERT INTO core_backgrounds (id, name, data, source) VALUES (?, ?, ?, ?)').run(
          extracted.id,
          extracted.name,
          dataJson,
          'phb_2024'
        );
        created++;
        console.log(`➕ Erstellt: ${extracted.name}`);
      }

      // Zeige Startausrüstungs-Optionen
      if (mergedData.starting_equipment?.options) {
        mergedData.starting_equipment.options.forEach((opt: BackgroundOption) => {
          const itemsStr = opt.items ? opt.items.join(', ') : 'keine';
          const goldStr = opt.gold ? `${opt.gold} GM` : 'kein Gold';
          console.log(`   Option ${opt.label}: ${itemsStr} + ${goldStr}`);
        });
      }
    }

    return { updated, created, skipped };
  });

  const result = transaction();
  console.log(`\n📊 Migration abgeschlossen:`);
  console.log(`   ✅ Aktualisiert: ${result.updated}`);
  console.log(`   ➕ Erstellt: ${result.created}`);
  console.log(`   ⏭️  Übersprungen: ${result.skipped}`);

  db.close();
}

migrateBackgrounds().catch(console.error);
