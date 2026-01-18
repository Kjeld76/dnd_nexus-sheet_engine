import fs from 'node:fs/promises';
import path from 'node:path';
import pdf from 'pdf-parse';

type ItemEntry = {
  name: string;
  source?: {
    book: string;
    start_page_physical?: number;
    end_page_physical?: number;
  };
  magic?: {
    text_blocks?: Array<{ type: string; text: string }>;
    [k: string]: unknown;
  };
  [k: string]: unknown;
};

async function extractMissingDirect() {
  const itemsJsonPath = path.resolve('exports/items.json');
  const pdfPath = path.resolve('resources/books/2024_D&D Spielleiterhandbuch (2024).pdf');

  console.log('📖 Lade Daten...\n');

  const itemsData = JSON.parse(await fs.readFile(itemsJsonPath, 'utf-8')) as ItemEntry[];
  const itemsByName = new Map<string, ItemEntry>();
  for (const item of itemsData) {
    itemsByName.set(item.name, item);
  }

  // Lade PDF
  console.log(`📖 Lade PDF...`);
  const dataBuffer = await fs.readFile(pdfPath);
  const pdfData = await pdf(dataBuffer);
  const text = pdfData.text;

  console.log(`✅ PDF geladen\n`);

  // Bekannte Positionen aus find-missing-items.ts
  const knownPositions: Record<string, number> = {
    'FIGUR DER WUNDERSAMEN KRAFT': 967066,
    'MYSTERIENSCHLÜSSEL': 1244007,
    'PFEIFE DER RAUCHMONSTER': 1244314,
    'SCHILD DES KAVALIERS': 1253657,
    'SCHWERT VON KAS': 1118206,
  };

  const categoryPattern =
    '(Waffe|Wundersamer Gegenstand|Rüstung|Ring|Schriftrolle|Zauberstab|Stab|Zepter|Trank|Schild|Waffe \\(.*?\\)|Rüstung \\(.*?\\))';
  const rarityPattern = '(gewöhnlich|ungewöhnlich|selten|sehr selten|legendär|Artefakt|artefakt|Seltenheit variiert)';

  let extractedCount = 0;

  for (const [itemName, startPos] of Object.entries(knownPositions)) {
    const item = itemsByName.get(itemName);
    if (!item) {
      console.log(`⚠️  ${itemName}: NICHT IN items.json`);
      continue;
    }

    console.log(`🔍 Extrahiere: ${itemName}...`);

    // Extrahiere Text ab der bekannten Position
    const contextStart = Math.max(0, startPos - 50);
    const context = text.substring(contextStart, startPos + 3000);

    // Finde den tatsächlichen Start (Item-Name)
    const nameRegex = new RegExp(itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const nameMatch = context.match(nameRegex);
    
    if (!nameMatch || nameMatch.index === undefined) {
      console.log(`  ❌ Item-Name nicht gefunden im Kontext`);
      continue;
    }

    const actualStart = contextStart + nameMatch.index;

    // Finde das Ende (nächstes Item oder Abschnitt)
    const nextItemRegex = new RegExp(
      `([A-ZÄÖÜ][A-ZÄÖÜ\\s\\-]{5,})\\s+${categoryPattern}[,\\s]+${rarityPattern}`,
      'i'
    );
    const nextMatch = text.substring(actualStart + 100).match(nextItemRegex);

    let descriptionEnd: number;
    if (nextMatch && nextMatch.index !== undefined) {
      descriptionEnd = actualStart + 100 + nextMatch.index;
    } else {
      // Suche nach nächstem Kapitel
      const nextSection = text.substring(actualStart, actualStart + 5000).match(/KAPITEL\s+\d+|^[A-ZÄÖÜ\s]{15,}$/m);
      if (nextSection && nextSection.index !== undefined) {
        descriptionEnd = actualStart + nextSection.index;
      } else {
        descriptionEnd = Math.min(actualStart + 5000, text.length);
      }
    }

    const description = text.substring(actualStart, descriptionEnd).trim();

    if (description.length > 50) {
      // Aktualisiere Item
      if (!item.magic) {
        item.magic = {};
      }
      if (!item.magic.text_blocks) {
        item.magic.text_blocks = [];
      }

      item.magic.text_blocks = [
        {
          type: 'paragraph',
          text: description,
        },
      ];

      extractedCount++;
      console.log(`  ✅ Beschreibung extrahiert (${description.length} Zeichen)`);
      console.log(`     Vorschau: ${description.substring(0, 150)}...`);
    } else {
      console.log(`  ⚠️  Beschreibung zu kurz (${description.length} Zeichen)`);
    }
  }

  console.log(`\n=== ${extractedCount}/${Object.keys(knownPositions).length} Beschreibungen extrahiert ===\n`);

  // Speichere aktualisierte items.json
  await fs.writeFile(itemsJsonPath, JSON.stringify(itemsData, null, 2), 'utf-8');
  console.log('✅ items.json aktualisiert');
}

extractMissingDirect().catch(console.error);
