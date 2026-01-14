import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve('dnd-nexus.db');
const db = new Database(dbPath);

interface AnalysisResult {
  totalItems: number;
  itemsWithParentheses: number;
  itemsWithQuantities: number;
  itemsWithVariants: number;
  examples: {
    withParentheses: string[];
    withQuantities: string[];
    withVariants: string[];
  };
  recommendations: string[];
}

function analyzeItems() {
  console.log('🔍 Analysiere core_items und custom_items...\n');
  
  const coreItems = db.prepare('SELECT id, name, description, category FROM core_items').all() as Array<{
    id: string;
    name: string;
    description: string;
    category: string;
  }>;
  
  const customItems = db.prepare('SELECT id, name, description, category FROM custom_items').all() as Array<{
    id: string;
    name: string;
    description: string;
    category: string;
  }>;
  
  const allItems = [...coreItems, ...customItems];
  
  const result: AnalysisResult = {
    totalItems: allItems.length,
    itemsWithParentheses: 0,
    itemsWithQuantities: 0,
    itemsWithVariants: 0,
    examples: {
      withParentheses: [],
      withQuantities: [],
      withVariants: []
    },
    recommendations: []
  };
  
  // Pattern für Mengenangaben: "Item (10 Blätter)", "Item (drei Flaschen)"
  const quantityPattern = /\((\d+|\w+)\s+[\w\s]+\)/;
  // Pattern für Varianten: "Item (Variant)" ohne Zahl am Anfang
  const variantPattern = /\([^\d][^)]+\)/;
  
  for (const item of allItems) {
    const hasParentheses = /\(/.test(item.name);
    
    if (hasParentheses) {
      result.itemsWithParentheses++;
      
      if (result.examples.withParentheses.length < 10) {
        result.examples.withParentheses.push(item.name);
      }
      
      // Prüfe ob es eine Mengenangabe ist
      if (quantityPattern.test(item.name)) {
        result.itemsWithQuantities++;
        if (result.examples.withQuantities.length < 10) {
          result.examples.withQuantities.push(item.name);
        }
      }
      
      // Prüfe ob es eine Variante ist (nicht Mengenangabe)
      if (variantPattern.test(item.name) && !quantityPattern.test(item.name)) {
        result.itemsWithVariants++;
        if (result.examples.withVariants.length < 10) {
          result.examples.withVariants.push(item.name);
        }
      }
    }
  }
  
  // Prüfe wie Items in Equipment-Paketen verwendet werden
  const equipment = db.prepare('SELECT id, name, items FROM core_equipment').all() as Array<{
    id: string;
    name: string;
    items: string;
  }>;
  
  let equipmentItemsWithQuantities = 0;
  const equipmentExamples: string[] = [];
  
  for (const eq of equipment) {
    try {
      const items = JSON.parse(eq.items);
      if (Array.isArray(items)) {
        items.forEach((item: any) => {
          if (typeof item === 'object' && item.quantity && item.quantity > 1) {
            equipmentItemsWithQuantities++;
            if (equipmentExamples.length < 5) {
              equipmentExamples.push(`${eq.name}: ${JSON.stringify(item)}`);
            }
          }
        });
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  // Prüfe wie Items im Character Inventory verwendet werden
  const characters = db.prepare('SELECT data FROM characters LIMIT 5').all() as Array<{
    data: string;
  }>;
  
  let inventoryItemsWithQuantities = 0;
  const inventoryExamples: string[] = [];
  
  for (const char of characters) {
    try {
      const charData = JSON.parse(char.data);
      if (charData.inventory && Array.isArray(charData.inventory)) {
        charData.inventory.forEach((inv: any) => {
          if (inv.quantity && inv.quantity > 1) {
            inventoryItemsWithQuantities++;
            if (inventoryExamples.length < 5) {
              inventoryExamples.push(`${inv.item_id}: quantity=${inv.quantity}`);
            }
          }
        });
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  // Empfehlungen generieren
  if (result.itemsWithParentheses > 0) {
    result.recommendations.push(
      `${result.itemsWithParentheses} Items haben Klammern im Namen - könnten strukturiert werden`
    );
  }
  
  if (result.itemsWithQuantities > 0) {
    result.recommendations.push(
      `${result.itemsWithQuantities} Items haben Mengenangaben im Namen - sollten strukturiert werden`
    );
  }
  
  if (result.itemsWithVariants > 0) {
    result.recommendations.push(
      `${result.itemsWithVariants} Items haben Varianten im Namen - könnten strukturiert werden`
    );
  }
  
  if (equipmentItemsWithQuantities > 0) {
    result.recommendations.push(
      `Equipment-Pakete verwenden bereits quantity-Felder (${equipmentItemsWithQuantities} Einträge)`
    );
  }
  
  if (inventoryItemsWithQuantities > 0) {
    result.recommendations.push(
      `Character-Inventar verwendet bereits quantity-Felder (${inventoryItemsWithQuantities} Einträge)`
    );
  }
  
  // Ausgabe
  console.log('📊 Analyse-Ergebnisse:\n');
  console.log(`Gesamt Items: ${result.totalItems}`);
  console.log(`  - core_items: ${coreItems.length}`);
  console.log(`  - custom_items: ${customItems.length}`);
  console.log(`\nItems mit Klammern: ${result.itemsWithParentheses}`);
  console.log(`Items mit Mengenangaben: ${result.itemsWithQuantities}`);
  console.log(`Items mit Varianten: ${result.itemsWithVariants}`);
  console.log(`\nEquipment-Pakete mit quantity: ${equipmentItemsWithQuantities}`);
  console.log(`Character-Inventar mit quantity: ${inventoryItemsWithQuantities}`);
  
  if (result.examples.withParentheses.length > 0) {
    console.log('\n📋 Beispiele (Items mit Klammern):');
    result.examples.withParentheses.forEach(ex => console.log(`  - ${ex}`));
  }
  
  if (result.examples.withQuantities.length > 0) {
    console.log('\n📋 Beispiele (Items mit Mengenangaben):');
    result.examples.withQuantities.forEach(ex => console.log(`  - ${ex}`));
  }
  
  if (result.examples.withVariants.length > 0) {
    console.log('\n📋 Beispiele (Items mit Varianten):');
    result.examples.withVariants.forEach(ex => console.log(`  - ${ex}`));
  }
  
  if (equipmentExamples.length > 0) {
    console.log('\n📋 Beispiele (Equipment-Pakete):');
    equipmentExamples.forEach(ex => console.log(`  - ${ex}`));
  }
  
  if (inventoryExamples.length > 0) {
    console.log('\n📋 Beispiele (Character-Inventar):');
    inventoryExamples.forEach(ex => console.log(`  - ${ex}`));
  }
  
  console.log('\n💡 Empfehlungen:');
  result.recommendations.forEach(rec => console.log(`  - ${rec}`));
  
  // Speichere Report
  fs.writeFileSync(
    './items-structure-analysis.json',
    JSON.stringify({
      ...result,
      equipmentItemsWithQuantities,
      inventoryItemsWithQuantities,
      equipmentExamples,
      inventoryExamples
    }, null, 2)
  );
  console.log('\n💾 Report gespeichert: items-structure-analysis.json');
  
  return result;
}

console.log('═'.repeat(80));
console.log('D&D NEXUS - ITEMS STRUKTUR ANALYSE');
console.log('═'.repeat(80) + '\n');

try {
  analyzeItems();
  console.log('\n═'.repeat(80) + '\n');
} catch (error) {
  console.error('\n❌ FEHLER:', error);
  process.exit(1);
} finally {
  db.close();
}
