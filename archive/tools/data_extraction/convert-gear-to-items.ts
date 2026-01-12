import fs from 'fs/promises';
import path from 'path';

interface Gear {
  id: string;
  name: string;
  description: string;
  cost_gp: number;
  weight_kg: number;
  data: any;
}

interface Item {
  id: string;
  name: string;
  description: string;
  cost_gp: number;
  weight_kg: number;
  category?: string;
  data: any;
}

async function convertGearToItems() {
  console.log('📖 Lade gear.json...\n');

  const gearData = JSON.parse(
    await fs.readFile('archive/tools/data_extraction/intermediate_data/gear.json', 'utf-8')
  );

  const gear: Gear[] = gearData.gear || [];
  console.log(`✅ ${gear.length} Items aus gear.json geladen\n`);

  // Konvertiere Gear → Items
  const items: Item[] = gear.map(g => ({
    id: g.id,
    name: g.name,
    description: g.description || '',
    cost_gp: g.cost_gp,
    weight_kg: g.weight_kg,
    category: 'Abenteuerausrüstung',
    data: g.data || { source_page: 222 }
  }));

  // Speichere als items.json
  const outputDir = 'archive/tools/data_extraction/intermediate_data';
  await fs.writeFile(
    path.join(outputDir, 'items_from_gear.json'),
    JSON.stringify({ items }, null, 2)
  );

  console.log(`✅ Konvertierte Items gespeichert: ${outputDir}/items_from_gear.json`);
  console.log(`   ${items.length} Items konvertiert\n`);

  // Statistiken
  console.log('📊 Zusammenfassung:');
  console.log(`   Items: ${items.length}`);
  
  // Prüfe wichtige Items
  const importantItems = ['Öl', 'Fackel', 'Rationen', 'Zunderkästchen', 'Glocke', 'Kerze', 'Flasche', 'Metallkügelchen', 'Krähenfüße'];
  console.log(`\n   Wichtige Items:`);
  for (const itemName of importantItems) {
    const found = items.some(item => 
      item.name.toLowerCase() === itemName.toLowerCase() ||
      item.id.toLowerCase() === itemName.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    );
    console.log(`     ${found ? '✅' : '❌'} ${itemName}`);
  }
}

convertGearToItems().catch(console.error);
