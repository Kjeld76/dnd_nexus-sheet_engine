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

function escapeSql(str: string): string {
  return str.replace(/'/g, "''");
}

function sqlValue(value: any): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  if (typeof value === 'object') {
    return `'${escapeSql(JSON.stringify(value))}'`;
  }
  return `'${escapeSql(String(value))}'`;
}

async function generateSeed() {
  console.log('📖 Lade extrahierte Daten...\n');

  const itemsData = JSON.parse(
    await fs.readFile('archive/tools/data_extraction/intermediate_data/items.json', 'utf-8')
  );
  const equipmentData = JSON.parse(
    await fs.readFile('archive/tools/data_extraction/intermediate_data/equipment_resolved.json', 'utf-8')
  );

  const items: Item[] = itemsData.items || [];
  const equipment: Equipment[] = equipmentData.equipment || [];

  console.log(`✅ ${items.length} Items geladen`);
  console.log(`✅ ${equipment.length} Equipment-Pakete geladen\n`);

  let sql = '-- PHB 2024 Items and Equipment Seed\n';
  sql += '-- Generated from extracted data\n\n';

  // PURGE
  sql += '-- PURGE\n';
  sql += 'DELETE FROM custom_items;\n';
  sql += 'DELETE FROM core_items;\n';
  sql += 'DELETE FROM custom_equipment;\n';
  sql += 'DELETE FROM core_equipment;\n';
  sql += '\n';

  // ITEMS
  sql += '-- ITEMS\n';
  for (const item of items) {
    const id = escapeSql(item.id);
    const name = escapeSql(item.name);
    const description = escapeSql(item.description || '');
    const cost_gp = item.cost_gp;
    const weight_kg = item.weight_kg;
    const category = item.category ? sqlValue(item.category) : 'NULL';
    const data = sqlValue(item.data || {});

    sql += `INSERT INTO core_items (id, name, description, cost_gp, weight_kg, category, data) VALUES (${sqlValue(id)}, ${sqlValue(name)}, ${sqlValue(description)}, ${cost_gp}, ${weight_kg}, ${category}, ${data});\n`;
  }
  sql += '\n';

  // EQUIPMENT
  sql += '-- EQUIPMENT\n';
  for (const eq of equipment) {
    const id = escapeSql(eq.id);
    const name = escapeSql(eq.name);
    const description = escapeSql(eq.description || '');
    const total_cost_gp = eq.total_cost_gp !== undefined ? eq.total_cost_gp : 'NULL';
    const total_weight_kg = eq.total_weight_kg !== undefined ? eq.total_weight_kg : 'NULL';
    const itemsJson = sqlValue(eq.items || []);
    const toolsJson = eq.tools && eq.tools.length > 0 ? sqlValue(eq.tools) : 'NULL';
    const data = sqlValue(eq.data || {});

    sql += `INSERT INTO core_equipment (id, name, description, total_cost_gp, total_weight_kg, items, tools, data) VALUES (${sqlValue(id)}, ${sqlValue(name)}, ${sqlValue(description)}, ${total_cost_gp}, ${total_weight_kg}, ${itemsJson}, ${toolsJson}, ${data});\n`;
  }
  sql += '\n';

  // Speichere SQL
  const outputDir = 'archive/tools/data_extraction/seeds';
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'items_equipment_seed.sql');
  await fs.writeFile(outputPath, sql);

  console.log(`✅ SQL-Seed generiert: ${outputPath}`);
  console.log(`   ${items.length} Items`);
  console.log(`   ${equipment.length} Equipment-Pakete\n`);

  // Statistiken
  console.log('📊 Zusammenfassung:');
  console.log(`   Items: ${items.length}`);
  console.log(`   Equipment-Pakete: ${equipment.length}`);
  console.log(`   Item-Referenzen in Equipment: ${equipment.reduce((sum, eq) => sum + (eq.items?.length || 0), 0)}`);
  console.log(`   Tool-Referenzen in Equipment: ${equipment.reduce((sum, eq) => sum + (eq.tools?.length || 0), 0)}\n`);
}

generateSeed().catch(console.error);
