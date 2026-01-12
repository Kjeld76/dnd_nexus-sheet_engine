import fs from 'fs/promises';
import path from 'path';

interface Item {
  id: string;
  name: string;
  description: string;
  cost_gp: number;
  weight_kg: number;
  category?: string;
  data: any;
}

interface EquipmentItem {
  item_id: string;
  quantity: number;
}

interface Equipment {
  id: string;
  name: string;
  description: string;
  total_cost_gp?: number;
  total_weight_kg?: number;
  items: EquipmentItem[];
  tools?: EquipmentItem[];
  data: any;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalItems: number;
    totalEquipment: number;
    totalReferences: number;
    validReferences: number;
    invalidReferences: number;
  };
}

async function validateItemsAndEquipment(): Promise<ValidationResult> {
  console.log('🔍 Validiere Items und Equipment...\n');

  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    stats: {
      totalItems: 0,
      totalEquipment: 0,
      totalReferences: 0,
      validReferences: 0,
      invalidReferences: 0
    }
  };

  // 1. Lade Daten
  console.log('📖 Lade Daten...\n');
  const itemsData = JSON.parse(
    await fs.readFile('archive/tools/data_extraction/intermediate_data/items.json', 'utf-8')
  );
  const equipmentData = JSON.parse(
    await fs.readFile('archive/tools/data_extraction/intermediate_data/equipment_resolved.json', 'utf-8')
  );

  const items: Item[] = itemsData.items || [];
  const equipment: Equipment[] = equipmentData.equipment || [];

  result.stats.totalItems = items.length;
  result.stats.totalEquipment = equipment.length;

  console.log(`✅ ${items.length} Items geladen`);
  console.log(`✅ ${equipment.length} Equipment-Pakete geladen\n`);

  // 2. Erstelle Item-Mappings
  const itemById = new Map<string, Item>();
  const itemIds = new Set<string>();
  const duplicateIds: string[] = [];
  const duplicateNames: string[] = [];

  for (const item of items) {
    // Prüfe auf doppelte IDs
    if (itemIds.has(item.id)) {
      duplicateIds.push(item.id);
      result.errors.push(`Doppelte Item-ID: "${item.id}"`);
      result.valid = false;
    } else {
      itemIds.add(item.id);
      itemById.set(item.id, item);
    }

    // Prüfe Pflichtfelder
    if (!item.id || item.id.trim() === '') {
      result.errors.push(`Item ohne ID: "${item.name}"`);
      result.valid = false;
    }
    if (!item.name || item.name.trim() === '') {
      result.errors.push(`Item ohne Name: ID "${item.id}"`);
      result.valid = false;
    }
    if (typeof item.cost_gp !== 'number' || item.cost_gp < 0) {
      result.warnings.push(`Item "${item.name}" (${item.id}): Ungültige Kosten: ${item.cost_gp}`);
    }
    if (typeof item.weight_kg !== 'number' || item.weight_kg < 0) {
      result.warnings.push(`Item "${item.name}" (${item.id}): Ungültiges Gewicht: ${item.weight_kg}`);
    }
  }

  // Prüfe auf doppelte Namen (Case-insensitive)
  const namesLower = new Map<string, string>();
  for (const item of items) {
    const nameLower = item.name.toLowerCase();
    if (namesLower.has(nameLower)) {
      duplicateNames.push(`"${item.name}" und "${namesLower.get(nameLower)}"`);
    } else {
      namesLower.set(nameLower, item.name);
    }
  }

  if (duplicateIds.length > 0) {
    console.log(`❌ ${duplicateIds.length} doppelte Item-IDs gefunden`);
  }
  if (duplicateNames.length > 0) {
    result.warnings.push(`${duplicateNames.length} Items mit ähnlichen Namen (Case-insensitive)`);
  }

  // 3. Validiere Equipment-Referenzen
  console.log('🔍 Validiere Equipment-Referenzen...\n');

  const equipmentItemIds = new Set<string>();
  const missingItemRefs: Array<{ equipment: string; item_id: string; quantity: number }> = [];
  const invalidQuantities: Array<{ equipment: string; item_id: string; quantity: number }> = [];

  for (const eq of equipment) {
    // Prüfe Pflichtfelder
    if (!eq.id || eq.id.trim() === '') {
      result.errors.push(`Equipment ohne ID: "${eq.name}"`);
      result.valid = false;
    }
    if (!eq.name || eq.name.trim() === '') {
      result.errors.push(`Equipment ohne Name: ID "${eq.id}"`);
      result.valid = false;
    }
    if (!eq.items || !Array.isArray(eq.items)) {
      result.errors.push(`Equipment "${eq.name}" (${eq.id}): Keine Items-Liste`);
      result.valid = false;
      continue;
    }

    // Prüfe Item-Referenzen
    for (const itemRef of eq.items) {
      result.stats.totalReferences++;

      if (!itemRef.item_id || itemRef.item_id.trim() === '') {
        result.errors.push(`Equipment "${eq.name}": Item-Referenz ohne ID`);
        result.valid = false;
        result.stats.invalidReferences++;
        continue;
      }

      if (!itemById.has(itemRef.item_id)) {
        missingItemRefs.push({
          equipment: eq.name,
          item_id: itemRef.item_id,
          quantity: itemRef.quantity
        });
        result.errors.push(
          `Equipment "${eq.name}": Item-ID "${itemRef.item_id}" nicht gefunden (qty: ${itemRef.quantity})`
        );
        result.valid = false;
        result.stats.invalidReferences++;
      } else {
        equipmentItemIds.add(itemRef.item_id);
        result.stats.validReferences++;

        // Prüfe Quantity
        if (typeof itemRef.quantity !== 'number' || itemRef.quantity <= 0) {
          invalidQuantities.push({
            equipment: eq.name,
            item_id: itemRef.item_id,
            quantity: itemRef.quantity
          });
          result.warnings.push(
            `Equipment "${eq.name}": Ungültige Quantity für "${itemRef.item_id}": ${itemRef.quantity}`
          );
        }
      }
    }

    // Prüfe Tools-Referenzen (falls vorhanden)
    if (eq.tools && Array.isArray(eq.tools)) {
      for (const toolRef of eq.tools) {
        // Tools werden später validiert (separate Tabelle)
        // Hier nur grundlegende Checks
        if (!toolRef.tool_id || toolRef.tool_id.trim() === '') {
          result.errors.push(`Equipment "${eq.name}": Tool-Referenz ohne ID`);
          result.valid = false;
        }
        if (typeof toolRef.quantity !== 'number' || toolRef.quantity <= 0) {
          result.warnings.push(
            `Equipment "${eq.name}": Ungültige Quantity für Tool "${toolRef.tool_id}": ${toolRef.quantity}`
          );
        }
      }
    }
  }

  // 4. Statistiken
  result.stats.invalidReferences = result.stats.totalReferences - result.stats.validReferences;

  // 5. Zusätzliche Checks
  console.log('📊 Statistiken:\n');
  console.log(`   Items: ${result.stats.totalItems}`);
  console.log(`   Equipment-Pakete: ${result.stats.totalEquipment}`);
  console.log(`   Item-Referenzen: ${result.stats.totalReferences}`);
  console.log(`   ✅ Gültige Referenzen: ${result.stats.validReferences}`);
  console.log(`   ❌ Ungültige Referenzen: ${result.stats.invalidReferences}`);
  console.log(`   Unique Item-IDs in Equipment: ${equipmentItemIds.size}\n`);

  // Prüfe, ob alle Items verwendet werden
  const unusedItems = items.filter(item => !equipmentItemIds.has(item.id));
  if (unusedItems.length > 0) {
    result.warnings.push(`${unusedItems.length} Items werden nicht in Equipment-Paketen verwendet`);
    console.log(`⚠️  ${unusedItems.length} Items werden nicht verwendet (kann normal sein)`);
  }

  // 6. Fehlerbericht
  if (result.errors.length > 0) {
    console.log(`\n❌ ${result.errors.length} Fehler gefunden:\n`);
    for (const error of result.errors.slice(0, 20)) {
      console.log(`   - ${error}`);
    }
    if (result.errors.length > 20) {
      console.log(`   ... und ${result.errors.length - 20} weitere Fehler\n`);
    }
  }

  if (result.warnings.length > 0) {
    console.log(`\n⚠️  ${result.warnings.length} Warnungen:\n`);
    for (const warning of result.warnings.slice(0, 10)) {
      console.log(`   - ${warning}`);
    }
    if (result.warnings.length > 10) {
      console.log(`   ... und ${result.warnings.length - 10} weitere Warnungen\n`);
    }
  }

  if (missingItemRefs.length > 0) {
    console.log(`\n❌ Fehlende Item-Referenzen (${missingItemRefs.length}):\n`);
    for (const ref of missingItemRefs.slice(0, 10)) {
      console.log(`   - "${ref.item_id}" (qty: ${ref.quantity}) in ${ref.equipment}`);
    }
    if (missingItemRefs.length > 10) {
      console.log(`   ... und ${missingItemRefs.length - 10} weitere\n`);
    }
  }

  // 7. Zusammenfassung
  console.log('\n📊 Validierungs-Zusammenfassung:\n');
  if (result.valid && result.errors.length === 0) {
    console.log('✅ Alle Daten sind gültig!\n');
  } else {
    console.log(`❌ Validierung fehlgeschlagen: ${result.errors.length} Fehler\n`);
  }

  // Speichere Validierungs-Report
  const reportPath = 'archive/tools/data_extraction/intermediate_data/validation_report.json';
  await fs.writeFile(reportPath, JSON.stringify(result, null, 2));
  console.log(`📄 Validierungs-Report gespeichert: ${reportPath}\n`);

  return result;
}

validateItemsAndEquipment().catch(console.error);
