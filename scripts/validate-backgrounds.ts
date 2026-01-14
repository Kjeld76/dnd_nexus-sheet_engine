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

    let data: unknown;
    try {
      data = JSON.parse(bg.data);
    } catch (e) {
      result.issues.push('Daten nicht als JSON parsebar');
      results.push(result);
      continue;
    }

    if (typeof data !== "object" || data === null) {
      result.issues.push("Daten sind kein Objekt");
      results.push(result);
      continue;
    }
    const dataObj = data as Record<string, unknown>;

    // Pflichtfelder prüfen
    const description =
      typeof dataObj.description === "string" ? dataObj.description : "";
    if (!description || description.length < 50) {
      result.warnings.push('Beschreibung fehlt oder zu kurz');
    }

    const skills = dataObj.skills;
    if (!Array.isArray(skills) || skills.length === 0) {
      result.issues.push('Keine Fertigkeiten definiert');
    }

    // Startausrüstung prüfen
    const startingEquipment = dataObj.starting_equipment;
    if (!startingEquipment || typeof startingEquipment !== "object") {
      result.warnings.push('Keine Startausrüstung definiert (Legacy: gold/equipment_id vorhanden?)');
    } else if (
      !("options" in (startingEquipment as Record<string, unknown>)) ||
      !Array.isArray((startingEquipment as { options?: unknown }).options)
    ) {
      result.issues.push('Startausrüstung hat keine options-Array');
    } else {
      // Prüfe jede Option
      const options = (startingEquipment as { options?: unknown }).options as unknown[];
      options.forEach((opt: unknown, idx: number) => {
        const optObj =
          typeof opt === "object" && opt !== null
            ? (opt as Record<string, unknown>)
            : {};
        const label = typeof optObj.label === "string" ? optObj.label : "";
        if (!label) {
          result.issues.push(`Option ${idx + 1} hat kein label`);
        }
        const items = optObj.items;
        const gold = optObj.gold;
        if (!items && !gold) {
          result.issues.push(`Option ${label || idx + 1} hat weder items noch gold`);
        }
        if (Array.isArray(items)) {
          // Prüfe Item-Referenzen
          items.forEach((itemName: unknown) => {
            if (typeof itemName !== "string") return;
            const itemId = itemMap.get(itemName.toLowerCase());
            const toolId = toolMap.get(itemName.toLowerCase());
            const equipId = equipmentMap.get(itemName.toLowerCase());
            if (!itemId && !toolId && !equipId) {
              result.warnings.push(`Item/Tool nicht gefunden: "${itemName}" (Option ${label})`);
            }
          });
        }
      });
    }

    // Werkzeug prüfen
    const tool = dataObj.tool;
    if (typeof tool === "string" && tool) {
      const toolId = toolMap.get(tool.toLowerCase());
      if (!toolId) {
        result.warnings.push(`Werkzeug nicht gefunden: "${tool}"`);
      }
    }

    // Talent prüfen
    const feat = dataObj.feat;
    if (typeof feat === "string" && feat) {
      const featExists = db.prepare('SELECT id FROM core_feats WHERE id = ? OR name = ?').get(
        feat.toLowerCase().replace(/\s+/g, '_'),
        feat
      );
      if (!featExists) {
        result.warnings.push(`Talent nicht gefunden: "${feat}"`);
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
