import fs from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';

interface Item {
  id: string;
  name: string;
  description: string;
  cost_gp: number;
  weight_kg: number;
  category?: string;
  data: any;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äöüß]/g, (match) => {
      const map: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' };
      return map[match] || match;
    })
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function fixEncoding(text: string): string {
  const ENCODING_FIXES: Record<string, string> = {
    'Ã¤': 'ä', 'Ã¶': 'ö', 'Ã¼': 'ü', 'ÃŸ': 'ß',
    'Ã„': 'Ä', 'Ã–': 'Ö', 'Ãœ': 'Ü'
  };
  let fixed = text;
  for (const [bad, good] of Object.entries(ENCODING_FIXES)) {
    fixed = fixed.replace(new RegExp(bad, 'g'), good);
  }
  return fixed;
}

async function addMissingItems() {
  console.log('📖 Lade Text aus DOCX...\n');
  const docxPath = path.resolve('resources/books/D&D Spielerhandbuch (2024).docx');
  const result = await mammoth.extractRawText({ path: docxPath });
  const text = fixEncoding(result.value);

  // Lade bestehende Items
  const itemsData = JSON.parse(
    await fs.readFile('archive/tools/data_extraction/intermediate_data/items.json', 'utf-8')
  );
  const items: Item[] = itemsData.items || [];
  const existingIds = new Set(items.map(i => i.id));
  const existingNames = new Set(items.map(i => i.name.toLowerCase()));

  console.log(`✅ ${items.length} bestehende Items geladen\n`);

  // Finde Bereich für Items (Seite 222-229, vor REITTIERE)
  const ausruestungMarker = text.indexOf('ABENTEUERAUSRÜSTUNG');
  const reittiereMarker = text.indexOf('REITTIERE');
  const endMarker = reittiereMarker !== -1 ? reittiereMarker : text.indexOf('KAPITEL 7');
  const itemsSection = text.substring(ausruestungMarker, endMarker);

  console.log('🔍 Suche fehlende Items...\n');

  // Pattern für Item-Zeilen: Name Gewicht Kosten
  const gearLineRegex = /^([A-ZÄÖÜßa-z\s\(\),-]{3,})\s+([\d,]+|Variiert|-)\s*(?:kg)?\s+(\d+)\s*(GM|SM|KM)$/gm;
  const newItems: Item[] = [];

  // Suche nach "Abdeckbare Laterne" oder "Laterne, abdeckbar"
  const laterneVariants = [
    /Abdeckbare Laterne\s+([\d,]+)\s*(?:kg)?\s+(\d+)\s*(GM|SM|KM)/i,
    /Laterne, abdeckbar\s+([\d,]+)\s*(?:kg)?\s+(\d+)\s*(GM|SM|KM)/i
  ];

  for (const pattern of laterneVariants) {
    const match = itemsSection.match(pattern);
    if (match) {
      const name = 'Abdeckbare Laterne';
      const id = 'abdeckbare-laterne';
      if (!existingIds.has(id) && !existingNames.has(name.toLowerCase())) {
        const weight = parseFloat(match[1].replace(',', '.'));
        let cost = parseInt(match[2]);
        if (match[3] === 'SM') cost /= 10;
        if (match[3] === 'KM') cost /= 100;

        newItems.push({
          id,
          name,
          description: '',
          cost_gp: cost,
          weight_kg: weight,
          category: 'Abenteuerausrüstung',
          data: { source_page: 222 }
        });
        console.log(`✅ ${name} gefunden: ${cost} GM, ${weight} kg`);
        break;
      }
    }
  }

  // Suche nach "Weihwasser" (Seite 229, oben links)
  const weihwasserPattern = /Weihwasser\s+([\d,]+)\s*(?:kg)?\s+(\d+)\s*(GM|SM|KM)/i;
  const weihwasserMatch = itemsSection.match(weihwasserPattern);
  if (weihwasserMatch) {
    const name = 'Weihwasser';
    const id = 'weihwasser';
    if (!existingIds.has(id) && !existingNames.has(name.toLowerCase())) {
      const weight = parseFloat(weihwasserMatch[1].replace(',', '.'));
      let cost = parseInt(weihwasserMatch[2]);
      if (weihwasserMatch[3] === 'SM') cost /= 10;
      if (weihwasserMatch[3] === 'KM') cost /= 100;

      newItems.push({
        id,
        name,
        description: '',
        cost_gp: cost,
        weight_kg: weight,
        category: 'Abenteuerausrüstung',
        data: { source_page: 229 }
      });
      console.log(`✅ ${name} gefunden: ${cost} GM, ${weight} kg`);
    }
  }

  // Füge neue Items hinzu
  if (newItems.length > 0) {
    items.push(...newItems);
    
    // Sortiere Items nach Name
    items.sort((a, b) => a.name.localeCompare(b.name, 'de'));
    
    // Speichere aktualisierte Items
    await fs.writeFile(
      'archive/tools/data_extraction/intermediate_data/items.json',
      JSON.stringify({ items }, null, 2)
    );

    console.log(`\n✅ ${newItems.length} neue Items hinzugefügt`);
    console.log(`   Gesamt: ${items.length} Items\n`);
  } else {
    console.log('⚠️  Keine neuen Items gefunden\n');
  }
}

addMissingItems().catch(console.error);
