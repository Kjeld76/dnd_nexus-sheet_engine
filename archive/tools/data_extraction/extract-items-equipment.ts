import mammoth from 'mammoth';
import fs from 'fs/promises';
import path from 'path';

interface Item {
  id: string;
  name: string;
  description: string;
  cost_gp: number;
  weight_kg: number;
  category?: string;
  data: {
    source_page?: number;
    [key: string]: any;
  };
}

interface EquipmentItem {
  item_id: string;
  quantity: number;
}

interface EquipmentTool {
  tool_id: string;
  quantity: number;
}

interface Equipment {
  id: string;
  name: string;
  description: string;
  total_cost_gp?: number;
  total_weight_kg?: number;
  items: EquipmentItem[];
  tools?: EquipmentTool[];
  data: {
    source_page?: number;
    [key: string]: any;
  };
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
    'Ã„': 'Ä', 'Ã–': 'Ö', 'Ãœ': 'Ü',
    'Ã©': 'é', 'Ã¨': 'è', 'Â': '', 
    'â€"': '–', 'â€"': '—', 'â€™': "'", 
    'â€ž': '"', 'â€œ': '"'
  };
  let fixed = text;
  for (const [bad, good] of Object.entries(ENCODING_FIXES)) {
    fixed = fixed.replace(new RegExp(bad, 'g'), good);
  }
  return fixed;
}

// Filter für falsche Treffer (Waffeneigenschaften, Regeltext, etc.)
const EXCLUDED_ITEM_PATTERNS = [
  // Waffeneigenschaften
  /^(Plagen|Einkerben|Umstoßen|Verlangsamen|Auslaugen|Leicht|Stoßen|Streifen|Spalten|Nachteil|Kristall|Kugel|Rute|Stab|Zauberstab)$/i,
  // Regeltext
  /^(KAPITEL|ABENTEURER|STANDARD|AUSRÜSTUNG|GEWICHT|KOSTEN|NAME|SEITE|TIER|SYMBOL)$/i,
  // Zu kurz/lang
  /^[A-ZÄÖÜß\s]{1,2}$/,
  /^\d+$/,
  /^[A-ZÄÖÜß\s]{20,}$/,
  // Kampf-Aktionen/Regeltext
  /^(ANGRIFF|AKTION|BONUS|REAKTION|WURF|SCHADEN|TREFFER|WERTE|PUNKTE)$/i,
  // Spezielle Zeichen (wahrscheinlich keine Items)
  /^[^A-ZÄÖÜßa-zäöüß0-9\s-]+$/,
  // Leer oder nur Leerzeichen
  /^\s*$/
];

// Deutsche Plural-Regeln (Plural → Singular)
const PLURAL_TO_SINGULAR: Record<string, string> = {
  'fackeln': 'fackel',
  'flaschen': 'flasche',
  'kerzen': 'kerze',
  'rationen': 'rationen', // bereits Singular
  'tagesrationen': 'rationen',
  'bögen': 'bogen',
  'boegen': 'bogen',
  'kostüme': 'kostüm',
  'kostueme': 'kostüm'
};

function normalizeToSingular(name: string): string {
  const lower = name.toLowerCase().trim();
  if (PLURAL_TO_SINGULAR[lower]) {
    return PLURAL_TO_SINGULAR[lower];
  }
  // Einfache Plural-Regeln
  if (lower.endsWith('en') && lower.length > 4) {
    const singular = lower.slice(0, -2);
    return singular;
  }
  return lower;
}

function isValidItemName(name: string): boolean {
  if (!name || name.length < 3) return false;
  if (name === name.toUpperCase() && name.length > 20) return false;
  for (const pattern of EXCLUDED_ITEM_PATTERNS) {
    if (pattern.test(name)) return false;
  }
  // Nicht nur Zahlen
  if (/^\d+$/.test(name)) return false;
  // Mindestens ein Buchstabe
  if (!/[A-ZÄÖÜßa-zäöüß]/.test(name)) return false;
  return true;
}

async function extractItemsAndEquipment() {
  // Lade Items aus gear.json als Basis (extract-gear.ts funktioniert bereits gut)
  console.log('📖 Lade Items aus gear.json...\n');
  let items: Item[] = [];
  const seenItemIds = new Set<string>();

  try {
    const gearData = JSON.parse(
      await fs.readFile('archive/tools/data_extraction/intermediate_data/gear.json', 'utf-8')
    );
    const gear = gearData.gear || [];
    
    // Konvertiere Gear → Items
    for (const g of gear) {
      const itemId = g.id;
      if (!seenItemIds.has(itemId)) {
        items.push({
          id: itemId,
          name: g.name,
          description: g.description || '',
          cost_gp: g.cost_gp,
          weight_kg: g.weight_kg,
          category: 'Abenteuerausrüstung',
          data: g.data || { source_page: 222 }
        });
        seenItemIds.add(itemId);
      }
    }
    console.log(`✅ ${items.length} Items aus gear.json geladen\n`);
  } catch (error) {
    console.log('⚠️  gear.json nicht gefunden, extrahiere Items neu...\n');
  }

  const docxPath = path.resolve('resources/books/D&D Spielerhandbuch (2024).docx');
  console.log('📖 Extrahiere Text aus DOCX...');
  const result = await mammoth.extractRawText({ path: docxPath });
  const text = fixEncoding(result.value);
  console.log(`✅ Text extrahiert (${text.length} Zeichen)\n`);

  // Finde Bereich für Items/Equipment
  const ausruestungMarker = text.indexOf('ABENTEUERAUSRÜSTUNG');
  const kapitel7Marker = text.indexOf('KAPITEL 7');
  
  if (ausruestungMarker === -1) {
    console.error('❌ ABENTEUERAUSRÜSTUNG nicht gefunden');
    return;
  }

  const endIndex = kapitel7Marker !== -1 ? kapitel7Marker : text.length;
  const itemsSection = text.substring(ausruestungMarker, endIndex);
  console.log(`📋 Items/Equipment-Bereich: ${itemsSection.length} Zeichen\n`);

  // Wenn keine Items aus gear.json geladen wurden, extrahiere neu
  if (items.length === 0) {
    console.log('🔍 Extrahiere Items aus Text...');
    
    // Pattern aus extract-gear.ts (funktioniert bereits gut)
    const gearLineRegex = /^([A-ZÄÖÜßa-z\s\(\),-]{3,})\s+([\d,]+|Variiert|-)\s*(?:kg)?\s+(\d+)\s*(GM|SM|KM)$/gm;
    let match;
    
    while ((match = gearLineRegex.exec(itemsSection)) !== null) {
      let nameRaw = match[1].trim();
      
      // Bereinige Name
      if (nameRaw.includes('\n')) {
        nameRaw = nameRaw.split('\n').pop()!.trim();
      }
      
      // Filtere aus (aus extract-gear.ts)
      if (!nameRaw || nameRaw.length < 3 || nameRaw.toUpperCase() === nameRaw) continue;
      if (nameRaw.includes('KAPITEL') || nameRaw.includes('ABENTEUERAUSRÜSTUNG')) continue;
      if (nameRaw.includes('Gewicht') || nameRaw.includes('Kosten')) continue;
      if (nameRaw === 'Symbol' || nameRaw === 'Tier') continue;
      
      // Zusätzliche Filter für falsche Treffer
      if (!isValidItemName(nameRaw)) continue;
      
      const name = fixEncoding(nameRaw);
      
      // Erstelle ID (aus Original-Name, nicht normalisiert)
      const itemId = slugify(name);
      if (seenItemIds.has(itemId)) continue;
      
      seenItemIds.add(itemId);

      let weight = 0;
      if (match[2] !== 'Variiert' && match[2] !== '-') {
        weight = parseFloat(match[2].replace(',', '.'));
      }

      let cost = parseInt(match[3]);
      if (match[4] === 'SM') cost /= 10;
      if (match[4] === 'KM') cost /= 100;

      items.push({
        id: itemId,
        name: name,
        description: '',
        cost_gp: cost,
        weight_kg: weight,
        category: 'Abenteuerausrüstung',
        data: { source_page: 222 }
      });
    }
  }

  // Beschreibungen für Items finden
  console.log('📝 Suche Beschreibungen für Items...');
  for (const item of items) {
    const escapedName = item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const descRegex = new RegExp(`${escapedName}\\s*\\([^)]+\\)\\s*([\\s\\S]+?)(?=\\n[A-ZÄÖÜß\\s,]{3,} \\(|\\n[A-ZÄÖÜß]{4,}\\s+\\d|$)`, 'i');
    const descMatch = itemsSection.match(descRegex);
    if (descMatch) {
      item.description = fixEncoding(descMatch[1].trim()
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .split('KAPITEL')[0]
        .trim());
    }
  }

  console.log(`✅ ${items.length} Items extrahiert\n`);

  // 2. Extrahiere Equipment-Pakete
  console.log('🔍 Extrahiere Equipment-Pakete...');
  const equipment: Equipment[] = [];
  
  const equipmentPackageNames = [
    'BÜRGERAUSRÜSTUNG',
    'KRIEGERAUSRÜSTUNG',
    'KUNDSCHAFTERAUSRÜSTUNG',
    'GELEHRTENAUSRÜSTUNG',
    'GEWÖLBEFORSCHERAUSRÜSTUNG',
    'EINBRECHERAUSRÜSTUNG',
    'ENTDECKERAUSRÜSTUNG',
    'PRIESTERAUSRÜSTUNG',
    'DIPLOMATENAUSRÜSTUNG',
    'UNTERHALTUNGSKÜNSTLER-AUSRÜSTUNG',
    'UNTERHALTUNGSKÜNSTLER AUSRÜSTUNG'
  ];

  // Deutsche Zahlen zu Zahlen konvertieren
  const numberMap: Record<string, number> = {
    'ein': 1, 'eine': 1, 'einer': 1, 'eines': 1, 'einem': 1, 'einen': 1,
    'zwei': 2, 'drei': 3, 'vier': 4, 'fünf': 5, 'sechs': 6,
    'sieben': 7, 'acht': 8, 'neun': 9, 'zehn': 10, 'elf': 11,
    'zwölf': 12, 'dreizehn': 13, 'vierzehn': 14, 'fünfzehn': 15,
    'sechzehn': 16, 'siebzehn': 17, 'achtzehn': 18, 'neunzehn': 19, 'zwanzig': 20
  };

  function parseGermanNumber(text: string): { quantity: number; rest: string } {
    const lower = text.toLowerCase().trim();
    for (const [word, num] of Object.entries(numberMap)) {
      if (lower.startsWith(word + ' ')) {
        return { quantity: num, rest: text.substring(word.length).trim() };
      }
    }
    return { quantity: 1, rest: text };
  }

  // Parse Item-Liste aus Fließtext (komma-separiert)
  function parseItemList(text: string): Array<{ name: string; quantity: number }> {
    const items: Array<{ name: string; quantity: number }> = [];
    
    // Entferne "enthält folgende Gegenstände:" und ähnliche Präfixe
    let cleanText = text
      .replace(/^.*?enthält\s+folgende\s+Gegenstände:\s*/i, '')
      .replace(/^.*?enthält:/i, '')
      .trim();
    
    // Entferne "und" am Ende
    cleanText = cleanText.replace(/\s+und\s+([^,]+)\.?$/, ', $1');
    
    // Teile durch Kommas
    const parts = cleanText.split(',').map(p => p.trim()).filter(p => p.length > 0);
    
    for (const part of parts) {
      if (part.length < 2) continue;
      
      // Parse Mengenangabe (z.B. "zehn Flaschen Öl" → quantity: 10, name: "Flaschen Öl")
      const { quantity, rest } = parseGermanNumber(part);
      
      // Bereinige Item-Name
      let itemName = fixEncoding(rest)
        .replace(/\.$/, '')
        .trim();
      
      if (itemName.length > 2) {
        items.push({ name: itemName, quantity });
      }
    }
    
    return items;
  }

  for (const pkgName of equipmentPackageNames) {
    // Suche nach Paket (mit verschiedenen Varianten)
    const variants = [
      new RegExp(`${pkgName}\\s*\\((\\d+)\\s*GM\\)`, 'i'),
      new RegExp(`${pkgName.replace('AUSRÜSTUNG', ' AUSRÜSTUNG')}\\s*\\((\\d+)\\s*GM\\)`, 'i')
    ];

    for (const variant of variants) {
      const match = itemsSection.match(variant);
      if (match) {
        const packageStart = match.index!;
        const cost = parseInt(match[1]);
        const packageName = fixEncoding(match[0].replace(/\s*\([\d\sGM]+\)/, '').trim());
        
        // Suche nach "enthält folgende Gegenstände:" im Text nach dem Paket-Header
        const textAfterHeader = itemsSection.substring(packageStart + match[0].length, packageStart + 3000);
        
        // Verbesserter Regex: Suche nach "Eine [Paket] enthält folgende Gegenstände:" oder "[Paket] enthält folgende Gegenstände:"
        const escapedPkgName = pkgName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const enthaeltPatterns = [
          new RegExp(`eine\\s+${escapedPkgName}[^.]*?enthält\\s+folgende\\s+Gegenstände:\\s*([^.]+(?:\\.\\s+[A-ZÄÖÜß][^.]*?)*?)`, 'i'),
          new RegExp(`${escapedPkgName}[^.]*?enthält\\s+folgende\\s+Gegenstände:\\s*([^.]+(?:\\.\\s+[A-ZÄÖÜß][^.]*?)*?)`, 'i'),
          new RegExp(`eine\\s+[^.]*?enthält\\s+folgende\\s+Gegenstände:\\s*([^.]*?)\\.\\s+(?=[A-ZÄÖÜß\\s-]{12,}\\s*\\(|\\n[A-ZÄÖÜß\\s-]{12,})`, 'i'),
          new RegExp(`enthält\\s+folgende\\s+Gegenstände:\\s*([^.]*?)\\.\\s+(?=[A-ZÄÖÜß\\s-]{12,}\\s*\\(|\\n[A-ZÄÖÜß\\s-]{12,})`, 'i')
        ];
        
        let enthaeltMatch: RegExpMatchArray | null = null;
        for (const pattern of enthaeltPatterns) {
          enthaeltMatch = textAfterHeader.match(pattern);
          if (enthaeltMatch) break;
        }
        
        if (enthaeltMatch) {
          let itemListText = enthaeltMatch[1];
          
          // Bereinige Text - entferne neue Zeilen und extra Leerzeichen
          itemListText = itemListText.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
          
          // Stopp bei neuen Abschnitten (große Überschriften in GROSSBUCHSTABEN mit Kosten)
          const stopPatterns = [
            /\s+([A-ZÄÖÜß\s-]{15,})\s*\(\d+\s*GM\)/,
            /\s+KAPITEL/,
            /\s+\d+\s*$/
          ];
          
          for (const pattern of stopPatterns) {
            const stopMatch = itemListText.match(pattern);
            if (stopMatch && stopMatch.index! < 600) {
              itemListText = itemListText.substring(0, stopMatch.index);
              break;
            }
          }
          
          // Stopp bei sehr langen Texten (wahrscheinlich falscher Match)
          if (itemListText.length > 600) {
            // Versuche, nur bis zum ersten Punkt zu nehmen, der zu einem neuen Abschnitt gehört
            const periodMatches = itemListText.matchAll(/\.\s+([A-ZÄÖÜß\s-]{12,})/g);
            for (const periodMatch of periodMatches) {
              if (periodMatch.index! > 100 && periodMatch.index! < 500) {
                itemListText = itemListText.substring(0, periodMatch.index);
                break;
              }
            }
            // Fallback: nur erste 500 Zeichen
            if (itemListText.length > 600) {
              itemListText = itemListText.substring(0, 500);
            }
          }
          
          const parsedItems = parseItemList(itemListText);
          
          // Filtere leere oder zu kurze Items
          const validItems = parsedItems.filter(item => item.name.length > 2 && item.name.length < 100);
          
          if (validItems.length > 0) {
            // Konvertiere zu EquipmentItem-Format
            const equipmentItems: EquipmentItem[] = validItems.map(item => ({
              item_id: slugify(item.name),
              quantity: item.quantity
            }));

            // Finde Beschreibung (Text vor "enthält")
            const descriptionText = textAfterHeader.substring(0, enthaeltMatch.index || 0).trim();
            const description = fixEncoding(descriptionText
              .replace(/\n/g, ' ')
              .replace(/\s+/g, ' ')
              .split('KAPITEL')[0]
              .trim());

            equipment.push({
              id: slugify(packageName),
              name: packageName,
              description: description || `Eine ${packageName.toLowerCase()} enthält verschiedene Gegenstände.`,
              total_cost_gp: cost,
              items: equipmentItems,
              tools: [],
              data: { source_page: 222 }
            });

            console.log(`  ✅ ${packageName}: ${equipmentItems.length} Items extrahiert`);
            break;
          }
        }
      }
    }
  }

  console.log(`✅ ${equipment.length} Equipment-Pakete extrahiert\n`);

  // Speichere Ergebnisse
  const outputDir = 'archive/tools/data_extraction/intermediate_data';
  await fs.mkdir(outputDir, { recursive: true });
  
  await fs.writeFile(
    path.join(outputDir, 'items.json'),
    JSON.stringify({ items }, null, 2)
  );
  
  await fs.writeFile(
    path.join(outputDir, 'equipment.json'),
    JSON.stringify({ equipment }, null, 2)
  );

  console.log('✅ Daten gespeichert:');
  console.log(`   - ${outputDir}/items.json (${items.length} Items)`);
  console.log(`   - ${outputDir}/equipment.json (${equipment.length} Equipment-Pakete)\n`);

  // Zusammenfassung
  console.log('📊 Zusammenfassung:');
  console.log(`   Items: ${items.length}`);
  console.log(`   Equipment-Pakete: ${equipment.length}`);
  console.log(`   Gesamt-Items in Equipment: ${equipment.reduce((sum, eq) => sum + eq.items.length, 0)}\n`);
}

extractItemsAndEquipment().catch(console.error);
