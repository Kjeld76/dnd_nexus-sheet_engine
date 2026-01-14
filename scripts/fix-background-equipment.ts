import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('dnd-nexus.db');
const db = new Database(dbPath);

interface StructuredItem {
  name: string;
  quantity: number;
  unit: string | null;
  variant: string | null;
}

function parseItemString(itemString: string): StructuredItem {
  const trimmed = itemString.trim();
  
  const numberWords: Record<string, number> = {
    'ein': 1, 'eine': 1, 'eins': 1,
    'zwei': 2, 'drei': 3, 'vier': 4, 'fünf': 5,
    'sechs': 6, 'sieben': 7, 'acht': 8, 'neun': 9, 'zehn': 10
  };
  
  // Pattern 1: "Item (Menge Einheit)" z.B. "Pergament (10 Blätter)"
  const pattern1 = /^(.+?)\s*\((\d+)\s+([^)]+)\)$/;
  const match1 = trimmed.match(pattern1);
  if (match1) {
    return {
      name: match1[1].trim(),
      quantity: parseInt(match1[2], 10),
      unit: match1[3].trim(),
      variant: null
    };
  }
  
  // Pattern 1b: "Item (Menge-Wort Einheit)" z.B. "Öl (drei Flaschen)"
  const pattern1b = /^(.+?)\s*\(([^)]+)\)$/;
  const match1b = trimmed.match(pattern1b);
  if (match1b) {
    const variantText = match1b[2].trim();
    const variantWords = variantText.split(/\s+/);
    
    // Prüfe ob Variant mit Zahl-Wort beginnt
    if (variantWords.length >= 2) {
      const firstVariantWord = variantWords[0].toLowerCase();
      if (numberWords[firstVariantWord]) {
        const quantity = numberWords[firstVariantWord];
        const unit = variantWords.slice(1).join(' ');
        return {
          name: match1b[1].trim(),
          quantity: quantity,
          unit: unit,
          variant: null
        };
      }
    }
  }
  
  // Pattern 2: "Menge Item" z.B. "zwei Beutel", "zwei Dolche"
  const words = trimmed.split(/\s+/);
  if (words.length >= 2) {
    const firstWord = words[0].toLowerCase();
    if (numberWords[firstWord]) {
      const quantity = numberWords[firstWord];
      const rest = words.slice(1).join(' ');
      
      // Prüfe ob letztes Wort eine Einheit ist
      const lastWord = words[words.length - 1].toLowerCase();
      const commonUnits = ['flaschen', 'flasche', 'beutel', 'beuteln', 'stück', 'stücke', 'blätter', 'blätter'];
      
      if (commonUnits.includes(lastWord)) {
        // Wenn nur 2 Wörter, dann ist das erste die Menge und das zweite die Einheit
        // z.B. "zwei Beutel" -> name: "Beutel", quantity: 2, unit: "Beutel"
        if (words.length === 2) {
          return {
            name: words[1],
            quantity: quantity,
            unit: lastWord,
            variant: null
          };
        }
        // Mehr als 2 Wörter: z.B. "drei Flaschen Öl" -> name: "Öl", quantity: 3, unit: "Flaschen"
        return {
          name: words.slice(2).join(' '),
          quantity: quantity,
          unit: lastWord,
          variant: null
        };
      }
      
      // Plural zu Singular konvertieren (z.B. "Dolche" -> "Dolch")
      let itemName = rest;
      if (rest.endsWith('e') && rest.length > 3) {
        // Versuche Plural zu Singular
        const singular = rest.slice(0, -1);
        itemName = singular;
      }
      
      return {
        name: itemName,
        quantity: quantity,
        unit: null,
        variant: null
      };
    }
  }
  
  // Pattern 3: "Item (Variant)" z.B. "Buch (Gebete)", "Heiliges Symbol"
  const pattern3 = /^(.+?)\s*\(([^)]+)\)$/;
  const match3 = trimmed.match(pattern3);
  if (match3) {
    const variant = match3[2].trim();
    // Prüfe ob Variant eine Zahl ist (dann ist es Pattern 1, nicht Pattern 3)
    if (!/^\d+/.test(variant)) {
      return {
        name: match3[1].trim(),
        quantity: 1,
        unit: null,
        variant: variant
      };
    }
  }
  
  // Default: Einzelnes Item ohne Mengenangabe
  return {
    name: trimmed,
    quantity: 1,
    unit: null,
    variant: null
  };
}

function fixBackgroundEquipment() {
  console.log('🔧 Korrigiere starting_equipment Items...\n');
  
  const coreBackgrounds = db.prepare('SELECT id, name, data FROM core_backgrounds').all() as Array<{
    id: string;
    name: string;
    data: string;
  }>;
  
  const customBackgrounds = db.prepare('SELECT id, name, data FROM custom_backgrounds').all() as Array<{
    id: string;
    name: string;
    data: string;
  }>;
  
  const allBackgrounds = [
    ...coreBackgrounds.map(bg => ({ ...bg, table: 'core_backgrounds' as const })),
    ...customBackgrounds.map(bg => ({ ...bg, table: 'custom_backgrounds' as const }))
  ];
  
  let updatedCount = 0;
  const changes: Array<{ background: string; table: string; changes: string[] }> = [];
  
  for (const bg of allBackgrounds) {
    let data: any;
    try {
      data = JSON.parse(bg.data);
    } catch (e) {
      console.log(`⚠️  ${bg.name}: Daten nicht als JSON parsebar`);
      continue;
    }
    
    if (!data.starting_equipment || !data.starting_equipment.options) {
      continue;
    }
    
    let hasChanges = false;
    const bgChanges: string[] = [];
    
    for (const option of data.starting_equipment.options) {
      if (!option.items || !Array.isArray(option.items)) {
        continue;
      }
      
      const structuredItems: StructuredItem[] = [];
      
      for (const item of option.items) {
        if (typeof item === 'string') {
          // String-Item, parsen
          const structured = parseItemString(item);
          structuredItems.push(structured);
          
          if (structured.quantity !== 1 || structured.unit || structured.variant) {
            bgChanges.push(
              `  "${item}" → ${JSON.stringify(structured)}`
            );
          }
        } else if (typeof item === 'object' && item.name !== undefined) {
          // Bereits strukturiert, prüfe auf Fehler
          if (!item.name || item.name.trim() === '') {
            // Fehlerhafter Eintrag mit leerem Namen
            // Versuche aus unit/quantity zu rekonstruieren
            if (item.unit && item.quantity) {
              const fixed = {
                name: item.unit.charAt(0).toUpperCase() + item.unit.slice(1), // z.B. "beutel" -> "Beutel"
                quantity: item.quantity,
                unit: item.unit,
                variant: null
              };
              structuredItems.push(fixed);
              bgChanges.push(
                `  🔧 Korrigiert (leerer Name): ${JSON.stringify(item)} → ${JSON.stringify(fixed)}`
              );
              hasChanges = true;
            } else {
              bgChanges.push(
                `  ⚠️  Fehlerhafter Eintrag (kann nicht repariert werden): ${JSON.stringify(item)}`
              );
              // Überspringe fehlerhafte Einträge
              continue;
            }
          }
          
          // Prüfe ob es korrekt strukturiert ist, aber falsche Werte hat
          // z.B. "Öl (drei Flaschen)" wurde als variant gespeichert statt unit
          if (item.variant && item.variant.includes('drei Flaschen')) {
            const fixed = {
              name: item.name,
              quantity: 3,
              unit: 'Flaschen',
              variant: null
            };
            structuredItems.push(fixed);
            bgChanges.push(
              `  🔧 Korrigiert: ${JSON.stringify(item)} → ${JSON.stringify(fixed)}`
            );
            hasChanges = true;
          } else {
            // Korrekt strukturiert, übernehme
            structuredItems.push(item);
          }
        }
      }
      
      if (structuredItems.length > 0 && hasChanges) {
        option.items = structuredItems;
        hasChanges = true;
      } else if (structuredItems.length !== option.items.length) {
        // Anzahl hat sich geändert (fehlerhafte Einträge entfernt)
        option.items = structuredItems;
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      const updatedData = JSON.stringify(data, null, 2);
      db.prepare(`UPDATE ${bg.table} SET data = ? WHERE id = ?`).run(updatedData, bg.id);
      updatedCount++;
      
      if (bgChanges.length > 0) {
        changes.push({
          background: bg.name,
          table: bg.table,
          changes: bgChanges
        });
      }
    }
  }
  
  console.log(`\n✅ ${updatedCount} Backgrounds aktualisiert`);
  console.log(`   - core_backgrounds: ${coreBackgrounds.length} geprüft`);
  console.log(`   - custom_backgrounds: ${customBackgrounds.length} geprüft\n`);
  
  if (changes.length > 0) {
    console.log('📋 Änderungen:\n');
    changes.forEach(({ background, table, changes: bgChanges }) => {
      console.log(`📌 ${background} (${table}):`);
      bgChanges.forEach(change => console.log(change));
      console.log('');
    });
  }
  
  // Speichere Report
  fs.writeFileSync(
    './background-equipment-fix-report.json',
    JSON.stringify(changes, null, 2)
  );
  console.log('💾 Report gespeichert: background-equipment-fix-report.json');
}

console.log('═'.repeat(80));
console.log('D&D NEXUS - BACKGROUND EQUIPMENT KORREKTUR');
console.log('═'.repeat(80) + '\n');

try {
  fixBackgroundEquipment();
  console.log('═'.repeat(80) + '\n');
} catch (error) {
  console.error('\n❌ FEHLER:', error);
  process.exit(1);
} finally {
  db.close();
}
