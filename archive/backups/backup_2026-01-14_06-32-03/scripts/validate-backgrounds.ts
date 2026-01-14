import Database from 'better-sqlite3';
import fs from 'fs/promises';
import path from 'path';

interface ValidationResult {
  background: string;
  issues: string[];
  warnings: string[];
}

async function validateBackgrounds() {
  const dbPath = path.resolve('dnd-nexus.db');
  const db = new Database(dbPath);

  console.log('🔍 Validiere Hintergrund-Daten...\n');

  const backgrounds = db.prepare('SELECT id, name, data FROM core_backgrounds ORDER BY name').all() as Array<{
    id: string;
    name: string;
    data: string;
  }>;

  const results: ValidationResult[] = [];
  const items = db.prepare('SELECT id, name FROM core_items').all() as Array<{ id: string; name: string }>;
  const tools = db.prepare('SELECT id, name FROM core_tools').all() as Array<{ id: string; name: string }>;
  const equipment = db.prepare('SELECT id, name FROM core_equipment').all() as Array<{ id: string; name: string }>;

  // Erstelle Lookup-Maps
  const itemMap = new Map(items.map(i => [i.name.toLowerCase(), i.id]));
  const toolMap = new Map(tools.map(t => [t.name.toLowerCase(), t.id]));
  const equipmentMap = new Map(equipment.map(e => [e.name.toLowerCase(), e.id]));

  for (const bg of backgrounds) {
    const result: ValidationResult = {
      background: bg.name,
      issues: [],
      warnings: []
    };

    let data: any;
    try {
      data = JSON.parse(bg.data);
    } catch (e) {
      result.issues.push('Daten nicht als JSON parsebar');
      results.push(result);
      continue;
    }

    // Pflichtfelder prüfen
    if (!data.description || data.description.length < 50) {
      result.warnings.push('Beschreibung fehlt oder zu kurz');
    }

    if (!data.skills || !Array.isArray(data.skills) || data.skills.length === 0) {
      result.issues.push('Keine Fertigkeiten definiert');
    }

    // Startausrüstung prüfen
    if (!data.starting_equipment) {
      result.warnings.push('Keine Startausrüstung definiert (Legacy: gold/equipment_id vorhanden?)');
    } else if (!data.starting_equipment.options || !Array.isArray(data.starting_equipment.options)) {
      result.issues.push('Startausrüstung hat keine options-Array');
    } else {
      // Prüfe jede Option
      data.starting_equipment.options.forEach((opt: any, idx: number) => {
        if (!opt.label) {
          result.issues.push(`Option ${idx + 1} hat kein label`);
        }
        if (!opt.items && !opt.gold) {
          result.issues.push(`Option ${opt.label || idx + 1} hat weder items noch gold`);
        }
        if (opt.items && Array.isArray(opt.items)) {
          // Prüfe Item-Referenzen
          opt.items.forEach((itemName: string) => {
            const itemId = itemMap.get(itemName.toLowerCase());
            const toolId = toolMap.get(itemName.toLowerCase());
            const equipId = equipmentMap.get(itemName.toLowerCase());
            if (!itemId && !toolId && !equipId) {
              result.warnings.push(`Item/Tool nicht gefunden: "${itemName}" (Option ${opt.label})`);
            }
          });
        }
      });
    }

    // Werkzeug prüfen
    if (data.tool) {
      const toolId = toolMap.get(data.tool.toLowerCase());
      if (!toolId) {
        result.warnings.push(`Werkzeug nicht gefunden: "${data.tool}"`);
      }
    }

    // Talent prüfen
    if (data.feat) {
      const featExists = db.prepare('SELECT id FROM core_feats WHERE id = ? OR name = ?').get(
        data.feat.toLowerCase().replace(/\s+/g, '_'),
        data.feat
      );
      if (!featExists) {
        result.warnings.push(`Talent nicht gefunden: "${data.feat}"`);
      }
    }

    if (result.issues.length > 0 || result.warnings.length > 0) {
      results.push(result);
    }
  }

  db.close();

  // Report generieren
  console.log('📊 Validierungs-Report:\n');

  if (results.length === 0) {
    console.log('✅ Alle Hintergründe sind valide!\n');
    return;
  }

  results.forEach(result => {
    console.log(`📋 ${result.background}:`);
    if (result.issues.length > 0) {
      console.log('   ❌ Probleme:');
      result.issues.forEach(issue => console.log(`      - ${issue}`));
    }
    if (result.warnings.length > 0) {
      console.log('   ⚠️  Warnungen:');
      result.warnings.forEach(warning => console.log(`      - ${warning}`));
    }
    console.log('');
  });

  // Speichere Report
  const reportPath = path.resolve('archive/tools/data_extraction/validation/background_validation_report.json');
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`💾 Vollständiger Report gespeichert: ${reportPath}`);
}

validateBackgrounds().catch(console.error);
